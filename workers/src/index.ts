import postgres from 'postgres';
import { extractContent } from './extractor';
import { detectChange } from './differ';
import { sendEmail } from './email';
import { sendSlackNotification, sendDiscordNotification } from './notify';
import { generateAiSummary } from './ai-summary';

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
        await pruneHistory(sql);
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
  // 1. Fetch URL
  let html: string;
  try {
    const res = await fetch(monitor.url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'CheetahPing/1.0 (https://cheetahping.com)' },
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    html = await res.text();
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

    const shareToken = crypto.randomUUID();
    await sql`
      INSERT INTO change_log (id, monitor_id, diff_summary, ai_summary, previous_snapshot, new_snapshot, notified, share_token)
      VALUES (
        gen_random_uuid(),
        ${monitor.id},
        ${summary},
        ${aiSummary},
        ${monitor.last_snapshot?.slice(0, MAX_SNAPSHOT_SIZE) || null},
        ${truncated},
        true,
        ${shareToken}
      )
    `;

    const label = monitor.label || monitor.url;
    const historyUrl = `${env.APP_URL}/monitors/${monitor.id}`;
    const shareUrl = `${env.APP_URL}/changes/${shareToken}`;

    // Email alert
    await sendEmail(env.RESEND_API_KEY, {
      to: monitor.user_email,
      subject: `Your monitor "${label}" just changed`,
      html: `
        <h2>Change Detected</h2>
        <p><strong>${label}</strong> detected a change:</p>
        <p style="background:#f4f4f5;padding:12px;border-radius:8px;font-size:14px;">${escapeHtml(displaySummary)}</p>
        ${aiSummary && summary !== aiSummary ? `<p style="color:#999;font-size:12px;">Raw diff: ${escapeHtml(summary)}</p>` : ''}
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
        consecutive_errors = 0,
        error_message = NULL
      WHERE id = ${monitor.id}
    `;

    console.log(`[CHANGE] ${label}: ${displaySummary}`);
  } else {
    // No change - just update timestamps
    await sql`
      UPDATE monitors SET
        last_snapshot = ${truncated},
        last_checked_at = NOW(),
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

async function pruneHistory(sql: postgres.Sql) {
  const result = await sql`
    DELETE FROM change_log cl
    USING monitors m
    INNER JOIN "user" u ON m.user_id = u.id
    WHERE cl.monitor_id = m.id
      AND cl.detected_at < NOW() - (
        CASE u.plan
          WHEN 'free' THEN INTERVAL '7 days'
          WHEN 'starter' THEN INTERVAL '30 days'
          WHEN 'pro' THEN INTERVAL '90 days'
          WHEN 'ultra' THEN INTERVAL '180 days'
          ELSE INTERVAL '7 days'
        END
      )
  `;

  console.log('[PRUNE] Expired history cleaned up');
}
