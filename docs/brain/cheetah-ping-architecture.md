# Cheetah Ping - Architecture Reference

## Overview

Cheetah Ping is a B2C consumer website change monitor. Users paste a URL, pick what to watch, and get email alerts when it changes. The product is a scheduled background job system - Inngest is primary infrastructure, not an optional add-on.

**No organizations. No RBAC. No multi-tenancy.** Every query scoped by `userId` from session.

### Documentation & AI Chat

- **Fumadocs** powers the `/docs` site (MDX content in `content/docs/`, rendered via `src/app/(docs)/`)
- **AI Chat Assistant** floating widget on all pages, powered by Groq (`llama-4-scout-17b-16e-instruct`)
  - Endpoint: `POST /api/chat` (streaming via Vercel AI SDK v6)
  - Context: all doc pages concatenated into system prompt (context stuffing)
  - Rate limits: 20 msgs/min authenticated, 5 msgs/min anonymous
  - Graceful degradation when `GROQ_API_KEY` is missing

---

## Data Model (Drizzle Schema)

### `users`

```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull(),
  name: text('name'),
  stripeCustomerId: text('stripe_customer_id'),
  plan: text('plan', { enum: ['free', 'starter', 'pro'] }).default('free').notNull(),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('user_email_idx').on(t.email),
]);
```

### `monitors`

```typescript
export const monitors = pgTable('monitors', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  label: text('label'),
  selector: text('selector'),           // CSS selector - watch specific element
  keyword: text('keyword'),             // Only alert on keyword appear/disappear
  checkIntervalMinutes: integer('check_interval_minutes').notNull().default(1440),
  lastSnapshot: text('last_snapshot'),
  lastCheckedAt: timestamp('last_checked_at'),
  lastChangedAt: timestamp('last_changed_at'),
  status: text('status', { enum: ['active', 'paused', 'error'] }).default('active').notNull(),
  errorMessage: text('error_message'),
  consecutiveErrors: integer('consecutive_errors').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('monitor_user_status_idx').on(t.userId, t.status),
  index('monitor_schedule_idx').on(t.status, t.lastCheckedAt),
]);
```

### `changeLog`

```typescript
export const changeLog = pgTable('change_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  monitorId: text('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  diffSummary: text('diff_summary'),
  previousSnapshot: text('previous_snapshot'),
  newSnapshot: text('new_snapshot'),
  notified: boolean('notified').default(false).notNull(),
}, (t) => [
  index('changelog_monitor_time_idx').on(t.monitorId, t.detectedAt),
]);
```

### `sessions` (Better Auth managed)

```typescript
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('session_token_idx').on(t.token),
  index('session_user_idx').on(t.userId),
]);
```

**Total: 4 tables.** No `organizations`, no `audit_logs`.

---

## Plan Tiers & Enforcement

| Plan | Price | Monitors | Check Frequency | Change History |
|------|-------|----------|----------------|----------------|
| Free | $0 | 5 | Every 24 hours | 7 days |
| Starter | $9/mo | 10 | Every 15 minutes | 30 days |
| Pro | $19/mo | 50 | Every 5 minutes | 90 days |
| Ultra | $49/mo | 50 | Every minute | 180 days |

### Enforcement Rules

```typescript
const PLAN_LIMITS = {
  free:    { maxMonitors: 5,  minIntervalMinutes: 1440, historyDays: 7 },
  starter: { maxMonitors: 10, minIntervalMinutes: 15,   historyDays: 30 },
  pro:     { maxMonitors: 50, minIntervalMinutes: 5,    historyDays: 90 },
  ultra:   { maxMonitors: 50, minIntervalMinutes: 1,    historyDays: 180 },
} as const;
```

**Where to enforce:**
- **Monitor creation**: Check `COUNT(*) WHERE userId = ?` against `maxMonitors`
- **Frequency selection**: UI only shows intervals >= `minIntervalMinutes` for user's plan
- **History pruning**: Background job deletes change_log entries older than `historyDays`
- **Downgrade**: When user downgrades, pause excess monitors (don't delete). Notify user.

---

## Core Loop - Monitor Check Engine

The product is this loop. It runs on Inngest.

### Architecture: Fan-Out Pattern

```
Inngest Cron (every 1 min)
  -> "monitor/fan-out" function
    -> Queries all monitors WHERE status='active' AND due for check
    -> For each: sends "monitor/check" event

Inngest Function: "monitor/check"
  -> Receives { monitorId }
  -> Fetches URL (10s timeout)
  -> Parses HTML (Cheerio)
  -> Diffs against lastSnapshot
  -> If changed: insert change_log, send email
  -> Updates monitor timestamps
  -> On error: increment consecutiveErrors, auto-pause at 3
```

### Fan-Out Function

```typescript
// src/modules/monitoring/functions/fan-out.ts
export const monitorFanOut = inngest.createFunction(
  { id: 'monitor-fan-out' },
  { cron: '* * * * *' }, // Every minute
  async ({ step }) => {
    const dueMonitors = await step.run('query-due-monitors', async () => {
      return db.select({ id: monitors.id })
        .from(monitors)
        .innerJoin(users, eq(monitors.userId, users.id))
        .where(and(
          eq(monitors.status, 'active'),
          sql`${monitors.lastCheckedAt} IS NULL OR
              NOW() > ${monitors.lastCheckedAt} + (${monitors.checkIntervalMinutes} || ' minutes')::interval`,
          // Plan enforcement: user's plan allows this frequency
          sql`${monitors.checkIntervalMinutes} >= CASE ${users.plan}
              WHEN 'free' THEN 1440
              WHEN 'starter' THEN 15
              WHEN 'pro' THEN 5
              END`
        ));
    });

    // Dispatch individual check events
    await step.sendEvent('dispatch-checks',
      dueMonitors.map(m => ({
        name: 'monitor/check',
        data: { monitorId: m.id },
      }))
    );

    return { dispatched: dueMonitors.length };
  }
);
```

### Individual Check Function

```typescript
// src/modules/monitoring/functions/check.ts
export const monitorCheck = inngest.createFunction(
  { id: 'monitor-check', retries: 1 },
  { event: 'monitor/check' },
  async ({ event, step }) => {
    const { monitorId } = event.data;

    const result = await step.run('fetch-and-diff', async () => {
      const monitor = await db.query.monitors.findFirst({
        where: eq(monitors.id, monitorId),
      });
      if (!monitor || monitor.status !== 'active') return { skipped: true };

      // 1. Fetch URL
      let html: string;
      try {
        const res = await fetch(monitor.url, {
          signal: AbortSignal.timeout(10_000),
          headers: { 'User-Agent': 'CheetahPing/1.0 (https://cheetahping.com)' },
        });
        html = await res.text();
      } catch (err) {
        return handleFetchError(monitor, err);
      }

      // 2. Extract content (Cheerio)
      const extracted = extractContent(html, monitor.selector);

      // 3. Diff
      const changed = detectChange(monitor, extracted);

      // 4. Update monitor + optionally create change_log + send alert
      return processResult(monitor, extracted, changed);
    });

    return result;
  }
);
```

### Content Extraction (Cheerio)

```typescript
// src/modules/monitoring/lib/extractor.ts
import * as cheerio from 'cheerio';

export function extractContent(html: string, selector?: string | null): string {
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, footer, noscript, iframe').remove();

  if (selector) {
    // CSS selector mode: extract only that element's text
    return $(selector).text().trim();
  }

  // Full page mode: extract body text
  return $('body').text().replace(/\s+/g, ' ').trim();
}
```

### Change Detection (diff package)

```typescript
// src/modules/monitoring/lib/differ.ts
import { diffWords } from 'diff';

export function detectChange(
  monitor: Monitor,
  newContent: string
): { changed: boolean; summary: string } {
  if (!monitor.lastSnapshot) {
    return { changed: false, summary: 'Initial snapshot captured' };
  }

  if (monitor.keyword) {
    // Keyword mode: only alert if keyword appeared or disappeared
    const wasPresent = monitor.lastSnapshot.toLowerCase().includes(monitor.keyword.toLowerCase());
    const isPresent = newContent.toLowerCase().includes(monitor.keyword.toLowerCase());
    if (wasPresent === isPresent) return { changed: false, summary: '' };
    return {
      changed: true,
      summary: isPresent
        ? `Keyword "${monitor.keyword}" appeared`
        : `Keyword "${monitor.keyword}" disappeared`,
    };
  }

  // Full diff mode
  const changes = diffWords(monitor.lastSnapshot, newContent);
  const meaningful = changes.filter(c => (c.added || c.removed) && c.value.trim().length > 0);

  if (meaningful.length === 0) return { changed: false, summary: '' };

  // Generate human-readable summary
  const added = meaningful.filter(c => c.added).map(c => c.value.trim()).join(', ');
  const removed = meaningful.filter(c => c.removed).map(c => c.value.trim()).join(', ');
  const parts: string[] = [];
  if (added) parts.push(`Added: "${added.slice(0, 100)}"`);
  if (removed) parts.push(`Removed: "${removed.slice(0, 100)}"`);

  return { changed: true, summary: parts.join('. ') };
}
```

### Error Handling & Auto-Pause

```typescript
// src/modules/monitoring/lib/errors.ts
async function handleFetchError(monitor: Monitor, err: unknown): Promise<void> {
  const newErrorCount = monitor.consecutiveErrors + 1;
  const errorMsg = err instanceof Error ? err.message : 'Unknown fetch error';

  if (newErrorCount >= 3) {
    // Auto-pause after 3 consecutive errors
    await db.update(monitors)
      .set({
        status: 'error',
        errorMessage: errorMsg,
        consecutiveErrors: newErrorCount,
        lastCheckedAt: new Date(),
      })
      .where(eq(monitors.id, monitor.id));

    // Notify user their monitor was auto-paused
    await sendMonitorPausedEmail(monitor);
  } else {
    await db.update(monitors)
      .set({
        errorMessage: errorMsg,
        consecutiveErrors: newErrorCount,
        lastCheckedAt: new Date(),
      })
      .where(eq(monitors.id, monitor.id));
  }
}
```

---

## Background Jobs (Inngest)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `monitor/fan-out` | Cron: `* * * * *` (every min) | Query due monitors, dispatch check events |
| `monitor/check` | Event: `monitor/check` | Fetch URL, parse, diff, alert |
| `history/prune` | Cron: `0 3 * * *` (daily 3am) | Delete expired change_log per plan tier |
| `billing/downgrade` | Event: `billing/downgrade` | Pause excess monitors on plan downgrade |

### History Pruning Job

```typescript
export const historyPrune = inngest.createFunction(
  { id: 'history-prune' },
  { cron: '0 3 * * *' },
  async ({ step }) => {
    await step.run('prune-expired-history', async () => {
      // Delete change_log entries older than plan allows
      await db.execute(sql`
        DELETE FROM change_log cl
        USING monitors m, users u
        WHERE cl.monitor_id = m.id
          AND m.user_id = u.id
          AND cl.detected_at < NOW() - (
            CASE u.plan
              WHEN 'free' THEN INTERVAL '7 days'
              WHEN 'starter' THEN INTERVAL '30 days'
              WHEN 'pro' THEN INTERVAL '90 days'
            END
          )
      `);
    });
  }
);
```

---

## Auth Setup

### Better Auth Config

```typescript
// src/modules/auth/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins/magic-link';
import { db } from '@/shared/database/db';
import { env } from '@/shared/lib/env';

export const auth = betterAuth({
  database: drizzleAdapter(db),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Wire up Resend
        await sendMagicLinkEmail(email, url);
      },
    }),
    // Optionally add OAuth: google(), github()
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
```

**No organization plugin. No TOTP plugin.**

### Route Protection

```typescript
// src/shared/lib/require-auth.ts
export async function requireAuth(): Promise<{ userId: string; email: string; plan: Plan }> {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user) redirect('/login');

  return { userId: user.id, email: user.email, plan: user.plan };
}
```

Every API route and server component calls `requireAuth()` and uses `userId` to scope queries.

---

## Stripe Integration

### Products

| Product | Price | Stripe Price ID |
|---------|-------|-----------------|
| Starter | $9/mo | Set in env: `STRIPE_STARTER_PRICE_ID` |
| Pro | $19/mo | Set in env: `STRIPE_PRO_PRICE_ID` |

### Checkout Flow

1. User clicks pricing CTA
2. Redirect to Stripe Checkout with `customer_email` pre-filled
3. On success: Stripe webhook fires `checkout.session.completed`
4. Webhook handler: set `user.stripeCustomerId` and `user.plan`

### Webhooks to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set user plan + stripeCustomerId |
| `customer.subscription.updated` | Update user plan |
| `customer.subscription.deleted` | Downgrade to free, dispatch `billing/downgrade` event |

### Customer Portal

Link in `/settings` page. Users manage their own billing via Stripe's hosted portal.

---

## API Route Inventory

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/monitors` | List user's monitors | Yes |
| POST | `/api/monitors` | Create monitor (enforce plan limits) | Yes |
| GET | `/api/monitors/[id]` | Get monitor detail | Yes (owner) |
| PATCH | `/api/monitors/[id]` | Update monitor settings | Yes (owner) |
| DELETE | `/api/monitors/[id]` | Delete monitor + cascade change_log | Yes (owner) |
| POST | `/api/monitors/[id]/pause` | Pause monitor | Yes (owner) |
| POST | `/api/monitors/[id]/resume` | Resume monitor (reset consecutiveErrors) | Yes (owner) |
| GET | `/api/monitors/[id]/changes` | Get change history | Yes (owner) |
| POST | `/api/checkout` | Create Stripe Checkout session | Yes |
| POST | `/api/webhooks/stripe` | Handle Stripe events | Signature verified |
| POST | `/api/monitors/analyze` | AI analysis of URL for monitor setup | Yes |
| POST | `/api/monitors/pick` | CSS selector suggestions | Yes |
| POST | `/api/monitors/preview` | Preview URL content | Yes |
| GET | `/api/monitors/proxy` | Proxy page for iframe preview | Yes |
| POST | `/api/monitors/screenshot` | Screenshot capture via Browserless | Yes |
| GET/POST | `/api/settings/notifications` | Notification preferences | Yes |
| POST | `/api/settings/notifications/test` | Send test notification | Yes |
| POST | `/api/settings/account` | Update account settings | Yes |
| GET | `/api/settings/export` | Export user data (GDPR) | Yes |
| POST | `/api/billing/portal` | Stripe billing portal session | Yes |
| GET | `/api/admin/stats` | Admin dashboard stats | Admin |
| GET/PATCH/DELETE | `/api/admin/users/[id]` | Admin user management | Admin |
| GET | `/api/stats` | Public site stats (cached 5min) | Public |
| POST | `/api/cron/retention` | Daily data retention purge (Vercel Cron) | Cron secret |
| POST | `/api/chat` | AI chat assistant (streaming) | Public (rate limited) |
| GET/POST | `/api/auth/**` | Better Auth routes | Public |

**Every authenticated route:**
1. `requireAuth()` -> get `userId`
2. Zod validate input
3. Query scoped by `userId` (for monitor routes: verify `monitor.userId === userId`)
4. Return consistent `{ data }` or `{ error }` shape

---

## Email Templates (Resend + React Email)

### Change Alert Email

**Subject:** Your monitor "[label]" just changed
**Body:**
- One-line diff summary
- Direct link to the monitored URL
- Link to change history in Cheetah Ping dashboard
- "Pause this monitor" link
- Unsubscribe link

### Monitor Error Email (auto-pause)

**Subject:** Your monitor "[label]" has been paused
**Body:**
- Explanation: 3 consecutive errors
- Last error message
- Link to resume in dashboard
- Unsubscribe link

---

## Environment Variables

### Required

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=generate-64-char-random-string
BETTER_AUTH_URL=http://localhost:3000
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### Required for Payments

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

### Required for Email

```
RESEND_API_KEY=re_...
```

### Optional

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GROQ_API_KEY=gsk_...              # AI analysis + chat assistant
BROWSERLESS_API_KEY=              # JS-rendered page fetching
NEXT_PUBLIC_POSTHOG_KEY=          # Analytics (consent-gated)
NEXT_PUBLIC_POSTHOG_HOST=         # PostHog EU endpoint
NEXT_PUBLIC_APP_NAME=Cheetah Ping
```

---

## Additional Dependencies (not in greenfield)

```bash
pnpm add cheerio diff groq-sdk                       # monitoring + AI analysis
pnpm add fumadocs-core fumadocs-ui fumadocs-mdx       # documentation site
pnpm add ai @ai-sdk/groq @ai-sdk/react                # AI chat assistant
pnpm add @upstash/ratelimit @upstash/redis             # rate limiting
```

### Documentation Stack

- **Fumadocs**: MDX-based docs at `/docs`, content in `content/docs/`, source config in `source.config.ts`
- **Vercel AI SDK v6**: `streamText()` for chat endpoint, `useChat()` hook for widget
- **@ai-sdk/groq**: Groq provider for Llama 4 Scout model

---

*Last updated: April 2026*
*Companion to: cheetah-ping-spec.md, docs/greenfield/*
