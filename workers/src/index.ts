import postgres from 'postgres';
import { extractContent } from './extractor';
import { detectChange } from './differ';
import { sendEmail } from './email';
import { sendSlackNotification, sendDiscordNotification } from './notify';
import { generateAiSummary } from './ai-summary';
import { takeScreenshot, screenshotContentType } from './screenshot';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface Env {
  DATABASE_URL: string;
  RESEND_API_KEY?: string;
  GROQ_API_KEY?: string;
  APP_URL: string;
  BROWSERLESS_URL?: string;
  BROWSERLESS_TOKEN?: string;
  R2_PUBLIC_URL: string;
  SCREENSHOTS: R2Bucket;
}

function looksLikeJsShell(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length < 500) return true;
  if (/<div[^>]*id=["'](root|__next|app|__nuxt)["'][^>]*>\s*<\/div>/i.test(html)) return true;
  return false;
}

async function browserlessFetch(url: string, env: Env): Promise<string> {
  const endpoint = `${env.BROWSERLESS_URL}/chrome/content?token=${env.BROWSERLESS_TOKEN}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      gotoOptions: { waitUntil: 'networkidle2', timeout: 20_000 },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Browserless ${res.status}: ${res.statusText}`);
  return await res.text();
}

async function smartFetch(url: string, env: Env): Promise<string> {
  // Try plain fetch first (free, fast)
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'CheetahPing/1.0 (https://cheetahping.com)' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const html = await res.text();

    if (looksLikeJsShell(html) && env.BROWSERLESS_URL && env.BROWSERLESS_TOKEN) {
      console.log(`[FALLBACK] ${url} looks JS-rendered, using Browserless`);
      return await browserlessFetch(url, env);
    }
    return html;
  } catch (err) {
    if (env.BROWSERLESS_URL && env.BROWSERLESS_TOKEN) {
      console.log(`[FALLBACK] ${url} fetch failed, using Browserless`);
      return await browserlessFetch(url, env);
    }
    throw err;
  }
}

interface Monitor {
  id: string;
  user_id: string;
  url: string;
  label: string | null;
  selector: string | null;
  keyword: string | null;
  check_interval_minutes: number;
  last_snapshot: string | null;
  last_checked_at: Date | null;
  last_changed_at: Date | null;
  status: string;
  error_message: string | null;
  consecutive_errors: number;
  share_enabled: boolean;
  last_screenshot_url: string | null;
  user_email: string;
  slack_webhook_url: string | null;
  discord_webhook_url: string | null;
}

const MAX_SNAPSHOT_SIZE = 100_000;
const BATCH_SIZE = 10;

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const sql = postgres(env.DATABASE_URL, { ssl: 'prefer' });

    try {
      // Check if it's time for daily pruning (3am UTC, minute 0)
      const now = new Date(controller.scheduledTime);
      if (now.getUTCHours() === 3 && now.getUTCMinutes() === 0) {
        await pruneHistory(sql, env);
      }

      // Main monitoring loop
      await checkDueMonitors(sql, env);
    } catch (err) {
      console.error('Scheduled handler error:', err);
    } finally {
      await sql.end();
    }
  },
} satisfies ExportedHandler<Env>;

async function checkDueMonitors(sql: postgres.Sql, env: Env) {
  // Query all monitors that are due for a check
  const dueMonitors = await sql<Monitor[]>`
    SELECT
      m.id,
      m.user_id,
      m.url,
      m.label,
      m.selector,
      m.keyword,
      m.check_interval_minutes,
      m.last_snapshot,
      m.last_checked_at,
      m.last_changed_at,
      m.status,
      m.error_message,
      m.consecutive_errors,
      m.share_enabled,
      m.last_screenshot_url,
      u.email AS user_email,
      u.slack_webhook_url,
      u.discord_webhook_url
    FROM monitors m
    INNER JOIN "user" u ON m.user_id = u.id
    WHERE m.status = 'active'
      AND (
        m.last_checked_at IS NULL
        OR NOW() > m.last_checked_at + (m.check_interval_minutes || ' minutes')::interval
      )
      AND m.check_interval_minutes >= CASE u.plan
        WHEN 'free' THEN 1440
        WHEN 'starter' THEN 15
        WHEN 'pro' THEN 5
        WHEN 'ultra' THEN 1
        ELSE 1440
      END
  `;

  if (dueMonitors.length === 0) return;

  console.log(`[CRON] ${dueMonitors.length} monitors due for check`);

  // Process in parallel batches
  for (let i = 0; i < dueMonitors.length; i += BATCH_SIZE) {
    const batch = dueMonitors.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((monitor) => checkMonitor(sql, env, monitor))
    );
  }
}

async function checkMonitor(sql: postgres.Sql, env: Env, monitor: Monitor) {
  // 1. Fetch URL — try plain fetch, fall back to Browserless for JS-rendered sites
  let html: string;
  try {
    html = await smartFetch(monitor.url, env);
  } catch (err) {
    await handleFetchError(sql, env, monitor, err);
    return;
  }

  // 2. Extract content
  const extracted = extractContent(html, monitor.selector);
  const truncated = extracted.slice(0, MAX_SNAPSHOT_SIZE);

  // 3. Diff
  const { changed, summary } = detectChange(
    monitor.last_snapshot,
    truncated,
    monitor.keyword
  );

  // 4. If changed, generate AI summary + insert change_log + send alerts
  if (changed) {
    // AI summary (non-blocking - falls back to raw diff)
    let aiSummary: string | null = null;
    if (env.GROQ_API_KEY) {
      aiSummary = await generateAiSummary(
        env.GROQ_API_KEY,
        monitor.last_snapshot || '',
        truncated,
        summary,
        monitor.url
      );
    }

    const displaySummary = aiSummary || summary;

    // Generate the change ID up front so we can use it in the R2 key
    // before the row exists in the database. crypto.randomUUID() is the
    // same generator the previous version used via gen_random_uuid().
    const changeId = crypto.randomUUID();
    const shareToken = crypto.randomUUID();

    // Take an "after" screenshot — best effort. Failures must NOT block
    // the alert: a text-only notification is far better than missing the
    // change because Browserless or R2 had a hiccup.
    let afterScreenshotUrl: string | null = null;
    if (env.BROWSERLESS_URL && env.BROWSERLESS_TOKEN) {
      try {
        const buffer = await takeScreenshot(monitor.url, env);
        const key = `snapshots/${monitor.id}/${changeId}.jpg`;
        await env.SCREENSHOTS.put(key, buffer, {
          httpMetadata: { contentType: screenshotContentType() },
        });
        afterScreenshotUrl = `${env.R2_PUBLIC_URL}/${key}`;
      } catch (err) {
        console.error('[SCREENSHOT]', err instanceof Error ? err.message : err);
      }
    }

    await sql`
      INSERT INTO change_log (
        id, monitor_id, diff_summary, ai_summary,
        previous_snapshot, new_snapshot, notified, share_token,
        before_screenshot_url, after_screenshot_url
      )
      VALUES (
        ${changeId},
        ${monitor.id},
        ${summary},
        ${aiSummary},
        ${monitor.last_snapshot?.slice(0, MAX_SNAPSHOT_SIZE) || null},
        ${truncated},
        true,
        ${shareToken},
        ${monitor.last_screenshot_url},
        ${afterScreenshotUrl}
      )
    `;

    const label = monitor.label || monitor.url;
    const historyUrl = `${env.APP_URL}/monitors/${monitor.id}`;
    const shareUrl = `${env.APP_URL}/changes/${shareToken}`;

    // Build the screenshot block for the email — table layout for cross-client
    // compatibility (Gmail and Outlook do not honor flexbox).
    let screenshotBlock = '';
    if (afterScreenshotUrl && monitor.last_screenshot_url) {
      screenshotBlock = `
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin:20px 0;">
          <tr>
            <td style="width:50%;padding-right:4px;vertical-align:top;">
              <p style="font-size:11px;color:#999;margin:0 0 4px;letter-spacing:0.04em;">BEFORE</p>
              <img src="${monitor.last_screenshot_url}" alt="Page before the change" style="width:100%;border-radius:6px;border:1px solid #e5e5e5;display:block;" />
            </td>
            <td style="width:50%;padding-left:4px;vertical-align:top;">
              <p style="font-size:11px;color:#999;margin:0 0 4px;letter-spacing:0.04em;">AFTER</p>
              <img src="${afterScreenshotUrl}" alt="Page after the change" style="width:100%;border-radius:6px;border:1px solid #e5e5e5;display:block;" />
            </td>
          </tr>
        </table>
      `;
    } else if (afterScreenshotUrl) {
      screenshotBlock = `
        <div style="margin:20px 0;">
          <p style="font-size:11px;color:#999;margin:0 0 4px;letter-spacing:0.04em;">UPDATED PAGE</p>
          <img src="${afterScreenshotUrl}" alt="Updated page" style="width:100%;max-width:600px;border-radius:6px;border:1px solid #e5e5e5;display:block;" />
        </div>
      `;
    }

    // Email alert
    await sendEmail(env.RESEND_API_KEY, {
      to: monitor.user_email,
      subject: `Your monitor "${label}" just changed`,
      html: `
        <h2>Change Detected</h2>
        <p><strong>${label}</strong> detected a change:</p>
        <p style="background:#f4f4f5;padding:12px;border-radius:8px;font-size:14px;">${escapeHtml(displaySummary)}</p>
        ${aiSummary && summary !== aiSummary ? `<p style="color:#999;font-size:12px;">Raw diff: ${escapeHtml(summary)}</p>` : ''}
        ${screenshotBlock}
        <p>
          <a href="${monitor.url}" style="display:inline-block;padding:10px 20px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">
            View the page
          </a>
        </p>
        <p style="color:#666;font-size:13px;margin-top:16px;">
          <a href="${historyUrl}">View full change history</a>
           |
          <a href="${env.APP_URL}/api/monitors/${monitor.id}/pause">Pause this monitor</a>
        </p>
        ${monitor.share_enabled ? `
        <p style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:12px;">
          <a href="${shareUrl}" style="color:#666;">Share this change</a>
          &nbsp;|&nbsp;
          Know someone who'd love this?
          <a href="${env.APP_URL}/login?ref=${monitor.user_id}" style="color:#666;">Invite them to Cheetah Ping</a>
        </p>
        ` : ''}
        <p style="margin-top:16px;color:#aaa;font-size:11px;text-align:center;">
          Cheetah Ping — paste a link, get alerted when it changes
        </p>
      `,
    });

    // Slack notification
    if (monitor.slack_webhook_url) {
      await sendSlackNotification(monitor.slack_webhook_url, {
        label,
        url: monitor.url,
        summary: displaySummary,
        changeHistoryUrl: historyUrl,
      }).catch((err) => console.error('[SLACK]', err));
    }

    // Discord notification
    if (monitor.discord_webhook_url) {
      await sendDiscordNotification(monitor.discord_webhook_url, {
        label,
        url: monitor.url,
        summary: displaySummary,
        changeHistoryUrl: historyUrl,
      }).catch((err) => console.error('[DISCORD]', err));
    }

    await sql`
      UPDATE monitors SET
        last_snapshot = ${truncated},
        last_checked_at = NOW(),
        last_changed_at = NOW(),
        last_screenshot_url = COALESCE(${afterScreenshotUrl}, last_screenshot_url),
        consecutive_errors = 0,
        error_message = NULL
      WHERE id = ${monitor.id}
    `;

    console.log(`[CHANGE] ${label}: ${displaySummary}`);
  } else {
    // No change. Edge case: this is the first ever check (last_snapshot was
    // null) AND the monitor has no baseline screenshot (created via API or
    // the form's preview screenshot failed). Capture a baseline now so the
    // *next* real change has a "before" image to embed in the alert.
    let baselineScreenshotUrl: string | null = null;
    const isFirstCheck = monitor.last_snapshot === null;
    if (
      isFirstCheck &&
      !monitor.last_screenshot_url &&
      env.BROWSERLESS_URL &&
      env.BROWSERLESS_TOKEN
    ) {
      try {
        const buffer = await takeScreenshot(monitor.url, env);
        const key = `snapshots/${monitor.id}/baseline.jpg`;
        await env.SCREENSHOTS.put(key, buffer, {
          httpMetadata: { contentType: screenshotContentType() },
        });
        baselineScreenshotUrl = `${env.R2_PUBLIC_URL}/${key}`;
      } catch (err) {
        console.error('[BASELINE]', err instanceof Error ? err.message : err);
      }
    }

    await sql`
      UPDATE monitors SET
        last_snapshot = ${truncated},
        last_checked_at = NOW(),
        last_screenshot_url = COALESCE(${baselineScreenshotUrl}, last_screenshot_url),
        consecutive_errors = 0,
        error_message = NULL
      WHERE id = ${monitor.id}
    `;
  }
}

async function handleFetchError(
  sql: postgres.Sql,
  env: Env,
  monitor: Monitor,
  err: unknown
) {
  const errorMsg = err instanceof Error ? err.message : 'Unknown fetch error';
  const newErrorCount = monitor.consecutive_errors + 1;

  if (newErrorCount >= 3) {
    // Auto-pause
    await sql`
      UPDATE monitors SET
        status = 'error',
        error_message = ${errorMsg},
        consecutive_errors = ${newErrorCount},
        last_checked_at = NOW()
      WHERE id = ${monitor.id}
    `;

    await sendEmail(env.RESEND_API_KEY, {
      to: monitor.user_email,
      subject: `Your monitor "${monitor.label || monitor.url}" has been paused`,
      html: `
        <h2>Monitor Auto-Paused</h2>
        <p>Your monitor for <strong>${monitor.label || monitor.url}</strong> has been paused after 3 consecutive errors.</p>
        <p><strong>Last error:</strong> ${escapeHtml(errorMsg)}</p>
        <p>You can resume it from your <a href="${env.APP_URL}/monitors/${monitor.id}">dashboard</a>.</p>
      `,
    });

    console.log(`[ERROR] ${monitor.label || monitor.url}: auto-paused after 3 errors`);
  } else {
    await sql`
      UPDATE monitors SET
        error_message = ${errorMsg},
        consecutive_errors = ${newErrorCount},
        last_checked_at = NOW()
      WHERE id = ${monitor.id}
    `;
  }
}

/**
 * Daily prune. Two passes:
 *
 *   1. Retention — delete change_log rows older than the user's plan allows
 *      (7d free / 30d starter / 90d pro / 180d ultra).
 *   2. Per-monitor cap — keep at most the 20 most recent changes per monitor.
 *
 * Both passes are folded into a single SELECT so we can clean R2 objects
 * before deleting the rows in one shot.
 *
 * R2 cleanup rule: only delete the row's `before_screenshot_url`, never its
 * `after_screenshot_url`. Because each row's BEFORE is the previous row's
 * AFTER (the chain is back-pointers through time), only deleting BEFOREs
 * means the chain self-cleans from the oldest end without ever orphaning a
 * URL that's still referenced by a row we're keeping. The only object that
 * "leaks" is the most recent change's AFTER, which is correct: it's still
 * referenced by `monitors.last_screenshot_url` and powers the dashboard
 * thumbnail.
 */
async function pruneHistory(sql: postgres.Sql, env: Env) {
  const toDelete = await sql<{ id: string; before_screenshot_url: string | null }[]>`
    WITH ranked AS (
      SELECT
        cl.id,
        cl.before_screenshot_url,
        cl.detected_at,
        u.plan,
        ROW_NUMBER() OVER (PARTITION BY cl.monitor_id ORDER BY cl.detected_at DESC) AS rn
      FROM change_log cl
      INNER JOIN monitors m ON cl.monitor_id = m.id
      INNER JOIN "user" u ON m.user_id = u.id
    )
    SELECT id, before_screenshot_url
    FROM ranked
    WHERE
      rn > 20
      OR detected_at < NOW() - (
        CASE plan
          WHEN 'free' THEN INTERVAL '7 days'
          WHEN 'starter' THEN INTERVAL '30 days'
          WHEN 'pro' THEN INTERVAL '90 days'
          WHEN 'ultra' THEN INTERVAL '180 days'
          ELSE INTERVAL '7 days'
        END
      )
  `;

  if (toDelete.length === 0) {
    console.log('[PRUNE] Nothing to prune');
    return;
  }

  // Delete R2 objects (best effort — log failures but don't block row deletion).
  const r2Prefix = env.R2_PUBLIC_URL + '/';
  let r2Deleted = 0;
  for (const row of toDelete) {
    if (!row.before_screenshot_url || !row.before_screenshot_url.startsWith(r2Prefix)) continue;
    const key = row.before_screenshot_url.slice(r2Prefix.length);
    try {
      await env.SCREENSHOTS.delete(key);
      r2Deleted++;
    } catch (err) {
      console.error('[PRUNE] R2 delete failed:', key, err);
    }
  }

  // Delete the rows.
  const ids = toDelete.map((r) => r.id);
  await sql`DELETE FROM change_log WHERE id = ANY(${ids})`;

  console.log(`[PRUNE] Deleted ${toDelete.length} change log rows, ${r2Deleted} R2 objects`);
}
