# Greenfield SaaS Stack - 2026 Gold Standard

A complete reference for starting a new SaaS project with best-in-class tools across every layer.

---

## Core Principles

- **Stateless compute** that scales horizontally without thinking about servers
- **Postgres-first** with durable, boring data and zero vendor lock-in
- **Edge-accelerated** delivery for global performance
- **Zero-egress storage** to avoid surprise bills
- **Auth you control** - not auth that controls you
- **Predictable pricing** with no per-seat or per-org traps
- **Minimal moving parts** - fewer services, fewer failure points
- **Auditable and permissioned** at every layer
- **Composable** - add optional layers only when a feature demands it
- **Enterprise-grade from day 1** - compliance, security, and accessibility built into the architecture, not bolted on later

---

## 0. Enterprise-Grade Architecture (Built-In, Not Bolted On)

Every technical decision below is made with compliance, security, and enterprise readiness baked in. This is not a separate concern - it is how you build.

### Data Architecture
- **Soft deletes everywhere** - never hard-delete user data (GDPR right to erasure = mark deleted, purge on schedule)
- **Audit logging from day 1** - log who did what, when, on every mutation (auth events, data changes, admin actions)
- **Multi-tenancy via `organizationId`** - every query scoped by tenant, no cross-tenant data leaks
- **Snapshot critical data** - invoices store client name/email at creation time (data survives if source record changes)
- **Encryption at rest** - sensitive fields (credentials, tokens, secrets) encrypted with AES-256-GCM, per-tenant key derivation via HKDF
- **Data export capability** - build CSV/JSON export for user data from day 1 (GDPR data portability right)
- **Data retention policies** - define how long you keep each data type, auto-purge expired data via background jobs
- **EU data residency ready** - choose Neon region at project creation (can't change later), pin Vercel compute to EU when needed

### Auth Architecture
- **MFA from day 1** - Better Auth's TOTP plugin, not a future TODO
- **RBAC from day 1** - owner/admin/member roles with permission checks on every API route
- **Rate limiting on all auth endpoints** - use Upstash Redis (in-memory doesn't work across serverless instances)
- **Constant-time auth responses** - prevent timing-based user enumeration on login/magic-link endpoints
- **Session management** - database sessions (not JWT) for revocability, configurable expiry
- **Magic link tokens** - hash before storage, one-time use, 15-minute expiry
- **Password hashing** - bcrypt with 12+ salt rounds minimum
- **Better Auth plugins** - TOTP (`totp`), organization (`organization`), magic link, passkeys, rate limiting - compose auth features via plugins rather than building from scratch

### API Architecture
- **Input validation on every endpoint** - Zod schemas, no exceptions
- **Auth check on every endpoint** - `requireAuth()` guard in server components, session check in API routes
- **Org-scoped queries on every endpoint** - always filter by `organizationId` from session, never from request params
- **Error responses never leak internals** - generic messages to client, detailed logs server-side
- **Webhook signature verification** - verify Stripe/Resend/any webhook signature before processing any event
- **CORS and CSP headers** - configure Content-Security-Policy and strict CORS from day 1

### Frontend Architecture
- **WCAG 2.1 AA from the first component** - semantic HTML, 4.5:1 contrast, keyboard navigation, ARIA labels
- **No tracking without consent** - essential cookies only by default, consent banner before analytics
- **Privacy policy and ToS pages** - built into the app routing, not afterthoughts
- **Unsubscribe in every email** - CAN-SPAM compliance, Resend handles List-Unsubscribe header
- **GPC (Global Privacy Control) signal support** - honor browser opt-out signals

### Payment Architecture
- **Never touch card data** - Stripe Checkout or Elements only, qualifies for SAQ A (simplest PCI compliance)
- **Idempotency keys** - on all payment creation to prevent duplicate charges
- **Webhook-driven state** - payment status comes from Stripe webhooks, not client-side callbacks
- **Refund capability** - build refund flows, not just charge flows

### Infrastructure Architecture
- **HTTPS everywhere** - Vercel handles TLS termination
- **WAF + DDoS protection** - Cloudflare proxy enabled on all DNS records
- **Email authentication** - SPF + DKIM + DMARC configured before sending first email
- **Sending subdomain** - protect root domain reputation (e.g., `updates.yourdomain.com`)
- **Secrets in env vars only** - never in code, never in database, never in client bundles
- **Dependency scanning** - Dependabot enabled from first commit for security patches

### Testing Architecture
- **Accessibility in CI** - axe-core or Pa11y in your GitHub Actions pipeline
- **E2E tests against preview deploys** - Playwright runs against Vercel preview URLs before merge
- **Type checking in CI** - `tsc --noEmit` catches type errors before deploy
- **Security headers tested** - verify CSP, HSTS, X-Frame-Options in E2E tests

---

## 0.5 Code Architecture (Modularity + DRY)

How to structure your codebase so it scales, stays maintainable, and doesn't rot.

### Project Structure
```
src/
  app/                          # Next.js App Router (pages + API routes)
    (dashboard)/                # Authenticated dashboard pages (grouped route)
    (auth)/                     # Login, signup, invite pages
    portal/                     # Client-facing portal (separate layout)
    api/                        # API routes (mirror entity structure)
  modules/                      # Business logic (feature-specific)
    auth/                       # Auth config, signup service, types
    payments/                   # Stripe client, checkout logic
    invoicing/                  # Invoice PDF template, calculations
    contracts/                  # Contract PDF, signing logic
  shared/                       # Reusable across the entire app
    components/                 # Shared UI components
      ui/                       # shadcn primitives (button, card, dialog, etc.)
      inline-edit.tsx           # Reusable inline edit component
      confirm-dialog.tsx        # Reusable delete confirmation modal
      kanban-board.tsx          # Reusable drag-and-drop board
    lib/                        # Shared utilities
      status-colors.ts          # Centralized status badge/dot colors
      nav-items.ts              # Navigation structure (single source of truth)
      require-auth.ts           # Auth guards (requireAuth, requireRole)
      get-org.ts                # Org data fetcher
      email.ts                  # Email sending utility
      rate-limit.ts             # Rate limiting utility
      encryption.ts             # Encryption/decryption utility
      notifications.ts          # Notification creation utility
    database/
      db.ts                     # Drizzle client singleton
      schema.ts                 # Drizzle schema (all tables defined in TypeScript)
  types/                        # Global TypeScript type declarations
```

**Rules:**
- `app/` = routing and page shells only. No business logic in pages.
- `modules/` = feature-specific logic. Each module owns its domain (auth, payments, invoicing).
- `shared/` = anything used by 2+ features. If it's used once, it stays in the feature module.
- Never import from one `module/` into another `module/`. Shared logic goes in `shared/`.

### Centralized Config (Single Source of Truth)

Every piece of config that could appear in multiple places gets defined ONCE:

| Config | File | Never Do |
|--------|------|----------|
| Status badge colors | `shared/lib/status-colors.ts` | Never hardcode `bg-red-*` for status indicators |
| Nav items | `shared/lib/nav-items.ts` | Never duplicate nav structure across sidebar/mobile |
| Auth guards | `shared/lib/require-auth.ts` | Never write inline session checks in pages |
| Org branding | `getOrg()` from database | Never hardcode company name, logo, or colors |
| Env vars | `shared/lib/env.ts` (validated) | Never use raw `process.env.X` scattered in code |
| Invoice numbering | Org model `invoicePrefix` + `invoiceNextNumber` | Never hardcode prefixes or starting numbers |
| Payment terms | Org model `paymentTermsDays` | Never hardcode "Net 30" |
| Timezone/currency | Org model `timezone` + `currency` | Never hardcode "America/New_York" or "USD" |

### Component Patterns

**Shared components** (`shared/components/`):
- Built once, used everywhere. Must be generic enough for any context.
- Examples: `InlineEdit`, `ConfirmDialog`, `KanbanBoard`, `SectionEditor`
- Accept data via props, emit changes via callbacks. No internal API calls.

**Page-specific components** (co-located with page):
- Live next to the page that uses them (e.g., `clients/[id]/client-detail.tsx`)
- Can make API calls, access router, use page-specific state
- Only extract to `shared/` when a second page needs the same component

**When to abstract:**
- Used in 2+ places = extract to shared
- Used in 1 place = keep co-located, don't premature-abstract
- Three similar lines of code is better than a premature abstraction

**Component rules:**
- Every button must do something or not exist. No placeholder buttons.
- Every link must resolve. No `href="#"`.
- Delete actions always use `ConfirmDialog`. Never `window.confirm()`.
- Every action shows loading state, success, or error. No silent failures.
- Empty states show a helpful message with a link to create the first item.
- Inline editing for detail pages. No separate `/edit` routes.

### API Patterns

**Every API route follows this structure:**
```
1. Auth check (session + verify org ownership)
2. Input validation (Zod schema)
3. Business logic (org-scoped query)
4. Response (consistent shape)
```

**Rules:**
- Always scope queries with `organizationId` from session. Never trust client-sent org IDs.
- Validate ALL input with Zod schemas. No exceptions.
- Return consistent error shapes: `{ error: "message" }` with appropriate status code.
- Sensitive endpoints (settings, billing, roles) require OWNER/ADMIN role check.
- Never return secrets, password hashes, or internal IDs in API responses.
- Status transitions validated server-side (e.g., invoice can't go from PAID back to DRAFT).

### Database Patterns

- **Multi-tenancy** - every model has `organizationId`, every query filters by it
- **Soft deletes** - use `isActive` or `isArchived` flags, never hard-delete user data
- **Snapshot fields** - invoices store `clientName`, `clientEmail` at creation (survives client record changes)
- **Atomic operations** - use `db.transaction(async (tx) => { ... })` for multi-step mutations (e.g., increment invoice number + create invoice)
- **Cascade rules** - define explicitly. Tight coupling = CASCADE, loose coupling = SET NULL
- **Indexes** - add composite indexes for frequent queries: `(organizationId, status)`, `(organizationId, clientId)`
- **Polymorphic relations** - use optional foreign keys (e.g., Notification has optional `invoiceId`, `contractId`, `proposalId`)

### Starter Drizzle Schema

Every greenfield project starts with these four tables. They cover multi-tenancy, auth, and auditability from day 1.

```typescript
// src/shared/database/schema.ts
import { pgTable, text, timestamp, boolean, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// --- Organization (multi-tenancy root) ---
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  logoUrl: text('logo_url'),
  invoicePrefix: text('invoice_prefix').default('INV'),
  invoiceNextNumber: integer('invoice_next_number').default(1001),
  paymentTermsDays: integer('payment_terms_days').default(30),
  timezone: text('timezone').default('America/New_York'),
  currency: text('currency').default('USD'),
  encryptionKeySalt: text('encryption_key_salt').notNull(),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('org_slug_idx').on(t.slug),
]);

// --- User ---
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).default('member').notNull(),
  emailVerified: boolean('email_verified').default(false),
  totpSecret: text('totp_secret'),
  isArchived: boolean('is_archived').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('user_email_org_idx').on(t.organizationId, t.email),
  index('user_org_idx').on(t.organizationId),
]);

// --- Session (database sessions for Better Auth) ---
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

// --- Audit Log (from day 1) ---
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  metadata: text('metadata'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('audit_org_idx').on(t.organizationId),
  index('audit_org_action_idx').on(t.organizationId, t.action),
  index('audit_created_idx').on(t.createdAt),
]);
```

**Patterns embedded in this schema:**
- **Soft deletes**: `isArchived` boolean + optional `deletedAt` timestamp
- **Multi-tenancy**: every table has `organizationId`, every query filters by it
- **Composite indexes**: `(organizationId, email)`, `(organizationId, action)` for fast org-scoped queries
- **Per-org encryption**: `encryptionKeySalt` on Organization for HKDF key derivation
- **Database sessions**: Better Auth stores sessions in Postgres, not JWTs, for revocability
- **CUID2 IDs**: URL-safe, collision-resistant, no sequential guessing

**Drizzle client singleton** (`src/shared/database/db.ts`):
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '@/shared/lib/env';

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

### Environment Config

Validate env vars at startup, not at usage time:

```typescript
// shared/lib/env.ts
const required = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL'] as const;
const optional = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'GROQ_API_KEY'] as const;

// Validate required vars exist, throw on startup if missing
// Export typed, validated env object
// Never use raw process.env anywhere else
```

**Rules:**
- Required vars throw on app startup if missing (fail fast, not at 3am when a user hits the endpoint)
- Optional vars degrade gracefully (no Resend key = log to console instead of sending)
- Production secrets passed via Vercel env vars, never committed to repo
- `.env.example` documents every variable with descriptions

### Branding + Theming

**Everything dynamic, nothing hardcoded:**
- Company name comes from `Organization.name` in database, accessed via `getOrg()` helper
- Logo comes from `Organization.logoUrl`, with initials fallback
- Login page uses `NEXT_PUBLIC_APP_NAME` env var for branding
- Colors use shadcn semantic tokens (`bg-primary`, `text-muted-foreground`), never Tailwind colors (`bg-blue-500`)
- Status colors from `getStatusBadgeClass()` / `getStatusDotClass()`, never per-file hardcoded colors
- The repo IS the template - fork, change env vars + seed script, deploy as a new brand

### Design System Rules

- **Semantic tokens only** - `text-foreground`, `bg-card`, `text-muted-foreground`. Never `text-slate-700` or `bg-blue-500`.
- **No 1px borders** - use tonal layering (background color shifts between layers)
- **Consistent radius** - `rounded-3xl` for major cards, `rounded-xl` for smaller elements
- **Consistent spacing** - follow Tailwind scale, don't invent custom values
- **Headlines** - display font (Manrope/Geist/Satoshi) with tight letter-spacing
- **Body** - clean sans-serif (Inter) for readability
- **Elevation** - minimal shadows (blur < 32px, opacity < 6%), prefer tonal shifts
- **Dark mode** - works via CSS custom properties, no separate theme files

### Import Conventions

- **Path alias** - `@/` maps to `src/`. Always use `@/shared/lib/...` not `../../../shared/lib/...`
- **No barrel exports** for large directories (kills tree-shaking). Import directly: `@/shared/components/ui/button`
- **Co-locate types** with the code that uses them. Global types in `src/types/`

### Error Handling

- **Every user action gets feedback** - loading spinner, success toast, or error toast. Zero silent failures.
- **Use `sonner`** for toast notifications (consistent placement, consistent API)
- **API errors** - catch, show user-friendly message, log detailed error server-side
- **Form validation** - show inline errors via React Hook Form + Zod resolver, not alert boxes
- **Never use `window.confirm()`** - always use `ConfirmDialog` component
- **Optimistic updates** - update UI immediately, rollback on error (use `useOptimistic` or TanStack Query mutations)

### Filterable Lists

Every list page must have contextual filters:
- **Status tabs** - shadcn `Tabs` component for status filtering
- **Category/type filters** - shadcn `Select` for dropdown filters
- **Search** - `Input` with debounced search
- **Filter by whatever dimensions make sense** - status, type, client, date range, etc.
- If a page lists items, it must be filterable. No exceptions.

### Full CRUD Lifecycle

Every entity must have a complete lifecycle:
- **Create** - form page or inline creation
- **View** - detail page with all related data
- **Edit** - inline editing on detail page (not separate /edit routes)
- **Delete** - soft delete with `ConfirmDialog` confirmation
- **Connect** - link related entities in both directions (project shows invoices, invoice shows project)

If two entities are related, they must be linked in BOTH directions in the UI.

---

## 1. Infra Stack

### Compute
| Choice | Why |
|--------|-----|
| **Vercel** | Unified compute, Server Actions, Edge Functions, zero ops, perfect Next.js DX |

Add **Cloudflare Workers** only if you need high-volume webhook processing or Durable Objects for real-time state. Don't split compute across two platforms unless you have a concrete reason.

> **Cloudflare Workers as Vercel alternative:** The OpenNext adapter now makes Next.js on Workers production-viable. Sub-5ms cold starts (vs Vercel's ~250ms), 3-5x cheaper at scale. Track as a future option if you hit cost pressure. Vercel remains lower-risk for now due to native Next.js integration and zero-config deploys.

### Database
| Choice | Why |
|--------|-----|
| **Neon Postgres** | Serverless autoscaling, dev branching, Postgres ecosystem, zero lock-in, storage/compute separation |

Alternatives: RDS Postgres (enterprise durability), PlanetScale (massive read scaling), Cloudflare D1 (if going fully Cloudflare-native, but SQLite-based with less ecosystem).

| Add-on | Why |
|--------|-----|
| **Cloudflare Hyperdrive** | Free connection pooling + query caching for Neon Postgres. Reduces latency on regional databases. Works with both Workers and Vercel compute. |

### Auth
| Choice | Why |
|--------|-----|
| **Better Auth** (self-hosted) | No per-user pricing, full session/flow control, works with Postgres + Redis, zero vendor lock-in |

Better Auth runs inside your app (npm install, not a separate service). Built-in: TOTP/MFA, magic links, organizations/multi-tenancy, RBAC, rate limiting, passkeys, SSO/SAML, API keys.


### Storage
| Choice | Why |
|--------|-----|
| **Cloudflare R2** | Zero egress, global edge caching, S3-compatible, cheapest at scale |

Alternatives: S3 (deep AWS integration), Supabase Storage (MVP speed).

### DNS + Domains
| Choice | Why |
|--------|-----|
| **Cloudflare** | Fastest DNS globally, free proxying, built-in WAF, DDoS protection |

Register domains on Cloudflare or Porkbun (best pricing + UX).

### Email
| Choice | Why |
|--------|-----|
| **Resend** | Clean API, great deliverability, perfect for SaaS onboarding flows |

Use a subdomain for sending (e.g., `updates.yourdomain.com`) to protect root domain reputation. Pair with **React Email** for type-safe email templates.

Alternatives: Postmark (enterprise reliability), SendGrid (legacy).

### Cache + Rate Limiting
| Choice | Why |
|--------|-----|
| **Upstash Redis** | Serverless pricing, global, HTTP API works in edge runtimes, perfect for rate limits + session caching |

Required for serverless - in-memory rate limiting doesn't work across instances.

Alternatives: Redis Cloud (enterprise, sub-ms reads), Cloudflare KV (not a Redis replacement).

### Background Jobs
| Choice | Why |
|--------|-----|
| **Inngest** | Step functions, retries, cron, workflows, perfect for Vercel. 50K runs/month free |

Alternatives: Trigger.dev (long-running compute, self-hostable), **Cloudflare Queues** (now GA - auto-scaling consumers, per-message ack/retry, 5K msgs/sec. Best option when already on Cloudflare Workers).

### Real-Time (Optional - add only when needed)
| Need | Use |
|------|-----|
| Don't need it yet | Polling (simplest, works fine for most apps) |
| One-way live updates | **Upstash Redis + SSE** (cheapest, no WebSocket overhead) |
| Chat, presence, reliable messaging | **Ably** (managed, predictable pricing, guaranteed delivery) |
| Collaborative/multiplayer features | **PartyKit** (Cloudflare Durable Objects, stateful edge compute) |

Don't add WebSockets unless you have a feature that needs sub-second updates. Polling and SSE cover 90% of "real-time" use cases.

---

## 2. Application Stack

### Framework
| Choice | Why |
|--------|-----|
| **Next.js** (latest) | Largest ecosystem, RSC maturity, Turbopack, Server Actions, best hiring pool |

SvelteKit is the dark horse (50% smaller bundles, better DX) but React ecosystem is unmatched.

### ORM
| Choice | Why |
|--------|-----|
| **Drizzle ORM** | ~7KB bundle, near-raw SQL performance, full edge support, no codegen, type-safe schema in TypeScript |

Drizzle is the 2026 leader. 33.5K GitHub stars, 4.9M weekly npm downloads. Pre-1.0 (v0.45) but stable in production. ~400ms cold starts on Vercel serverless. Schema defined in pure TypeScript (no separate DSL, no codegen step). When Drizzle reaches v1.0, check the official migration guide for any breaking changes to schema syntax.

### UI Components
| Choice | Why |
|--------|-----|
| **shadcn/ui** | Copy-paste ownership, Radix + Base UI primitives, massive community, AI tooling support |

### CSS
| Choice | Why |
|--------|-----|
| **Tailwind CSS v4** | Zero-runtime CSS, Oxide engine (5x faster builds), CSS-first config via `@theme`, dominant ecosystem |

### Forms
| Choice | Why |
|--------|-----|
| **React Hook Form** | Uncontrolled components minimize re-renders, massive ecosystem, works with Server Actions |

### Validation
| Choice | Why |
|--------|-----|
| **Zod** | 78+ integrations, v4 JIT compilation, Zod Mini for tree-shaking. Overwhelming ecosystem advantage |

### State Management
| Choice | When |
|--------|------|
| **Server Components** | Default for everything (no client state needed) |
| **Zustand** | When you need global client state (3KB, simplest API) |
| **TanStack Query** | When you need client-side server state (caching, mutations, optimistic updates) |

The 2026 consensus: TanStack Query for server state + Zustand for client state + React Hook Form for form state.

### Charts
| Choice | Why |
|--------|-----|
| **Recharts** | React-native, composable API, 3.6M weekly downloads |

Consider **Tremor** for faster dashboard development (built on Recharts + Radix + Tailwind).

### Drag and Drop
| Choice | Why |
|--------|-----|
| **dnd-kit** | Best React DnD with smooth animations, keyboard + screen reader accessibility |

### Icons
| Choice | Why |
|--------|-----|
| **Lucide** | 29M+ weekly downloads, default in shadcn/ui, smallest bundle at scale, 1,500+ consistent icons |

### Fonts
| Choice | Use |
|--------|-----|
| **Inter** | Body text, UI labels |
| **Geist Sans** or **Manrope** or **Satoshi** | Headlines, display text |
| **Geist Mono** | Code blocks |

### PDF Generation
| Choice | Why |
|--------|-----|
| **@react-pdf/renderer** | Lightweight, fast, React components for structured documents (invoices, contracts) |

### Payments
| Choice | Why |
|--------|-----|
| **Stripe** | Best for teams with engineering resources. Cheapest at 2.9% + $0.30. Acquired Lemon Squeezy |

Lemon Squeezy/Paddle are better for solo founders who want tax compliance handled (Merchant of Record).

---

## 3. Developer Tooling

### Testing
| Type | Choice | Why |
|------|--------|-----|
| Unit | **Vitest** | 3-5x faster than Jest, native ESM |
| E2E | **Playwright** | 92% satisfaction, overtook Cypress in downloads |

### Package Manager
| Choice | Why |
|--------|-----|
| **pnpm** | Best balance of speed, disk efficiency (70% less than npm), production-safe |

Bun is faster but still has edge cases. pnpm is the safe choice.

### Error Tracking
| Choice | Why |
|--------|-----|
| **Sentry** | Industry standard, intelligent error grouping, session replay, self-hostable. Free: 5K errors/month |

### Analytics + Feature Flags
| Choice | Why |
|--------|-----|
| **PostHog** | All-in-one: analytics + session replay + feature flags + A/B testing + funnels. 1M events/month free, MIT licensed |

### Logs
| Choice | Why |
|--------|-----|
| **Vercel built-in** | Start here. Upgrade to **Axiom** when you need log search across millions of requests |

### Monorepo (when needed)
| Choice | Why |
|--------|-----|
| **Turborepo + pnpm workspaces** | Lowest friction, excellent caching, native Vercel integration |

Graduate to Nx only for 20+ dev teams or polyglot repos.

---

## 4. AI Tooling + MCP Servers

### AI Code Editors
| Tool | Best For |
|------|----------|
| **Claude Code** (CLI + VS Code) | Complex multi-file refactors, architecture work, terminal workflows. #1 on SWE-bench |
| **Cursor** | Daily IDE work - fastest autocomplete, Composer mode for multi-file edits |

The winning pattern: Cursor for daily coding + Claude Code for complex tasks. Use both.

### MCP Servers (Connect AI to Your Services)
Install with `npx add-mcp <url>` (auto-detects your agents and writes config).

| MCP Server | What It Does | Priority |
|------------|-------------|----------|
| **Vercel** (`https://mcp.vercel.com`) | Deployment logs, project management, search Vercel docs | High |
| **Neon** (`@neondatabase/mcp-server-neon`) | DB queries, branch management, migrations via natural language | High |
| **Stripe** (official) | Payment debugging, search Stripe docs, inspect webhooks | High |
| **GitHub** (official) | Issues, PRs, repo management without leaving editor | Medium |
| **Sentry** | Pull errors, analyze stack traces, correlate with deploys | Medium (when Sentry added) |
| **PostHog** | Query analytics, manage feature flags, create insights | Medium (when PostHog added) |
| **Figma** (official) | Pull design tokens/components into code, push rendered UI back | Medium (if using Figma) |
| **Playwright** | Run and debug E2E tests, capture screenshots | Low |

> **Note:** Drizzle has no separate MCP server. Use the Neon MCP for database operations and `drizzle-kit` CLI for schema management.

### VS Code Extensions (Must-Have)

**Tier 1 - Install immediately:**
| Extension | Purpose |
|-----------|---------|
| **Claude Code** | AI assistant in sidebar |
| **Tailwind CSS IntelliSense** | Autocomplete classes, hover previews, linting |
| **Drizzle** | Schema syntax highlighting, type-safe queries |
| **ESLint** | Real-time linting |
| **Prettier** | Auto-formatting on save |
| **Error Lens** | Shows errors/warnings inline where they occur |
| **GitLens** | Git blame, line-by-line history |

**Tier 2 - Worth adding:**
| Extension | Purpose |
|-----------|---------|
| **Tailwind Fold** | Toggle long class strings to reduce visual noise |
| **Path IntelliSense** | Autocomplete file paths in imports |
| **Import Cost** | Shows bundle size of imported packages inline |
| **Thunder Client** | Lightweight REST client inside VS Code |

### Browser Extensions
| Extension | Purpose |
|-----------|---------|
| **React Developer Tools** | Inspect components, edit props/state, profile performance |
| **Vercel Toolbar** | Comments on production, deployment status |
| **Wappalyzer** | Detect tech stacks on any site (competitive research) |

### Claude Code Hooks (Mechanical Enforcement)

CLAUDE.md rules are suggestions - followed ~80% of the time. Hooks are automatic actions that fire every time Claude edits a file, runs a command, or finishes a task. They're enforcement, not suggestion.

**How hooks work:**
- `PreToolUse` - runs BEFORE Claude does something. Exit code 2 blocks the action.
- `PostToolUse` - runs AFTER Claude does something. Quality control on the output.
- Configured in `.claude/settings.json` (committed to git, shared with team).
- Input arrives via stdin as JSON. Scripts parse it and decide allow/block.

**Universal starter hooks (every project):**

| Hook | Event | What it does |
|------|-------|-------------|
| Block dangerous commands | PreToolUse (Bash) | Blocks `rm -rf /`, `git push --force`, `DROP TABLE`, pipe-to-shell |
| Protect sensitive files | PreToolUse (Write/Edit) | Hard-blocks writes to `.env*`, `*.pem`, `*.key` |
| Log all commands | PreToolUse (Bash, async) | Timestamps every command to audit log outside repo |

These three have zero downside and prevent catastrophic mistakes. Install on every project.

**Project-specific hooks (add based on your stack):**

| If your project has... | Add this hook | Event |
|------------------------|--------------|-------|
| ESLint / Prettier / Biome | Auto-format + lint after edits | PostToolUse (Write/Edit) |
| Drizzle | Auto-generate migrations after schema changes | PostToolUse (Write/Edit) |
| Vitest / Jest (fast unit tests) | Run tests after edits | PostToolUse (Write/Edit) |
| "No AI attribution" rule | `attribution: { commit: "", pr: "" }` setting | Settings, not a hook |

> See `greenfield-hooks.md` for complete, ready-to-copy hook scripts and starter `settings.json` template.

**Hooks to avoid (or be cautious with):**

| Hook | Why to skip |
|------|------------|
| Run tests after every edit | Only viable with fast unit tests (<5s). E2E tests (Playwright, Cypress) add 30-120s per edit. Unusable. |
| Require tests before PR | Same problem with slow suites. CI is the right gate for E2E. |
| Auto-commit on stop | Creates garbage commit messages, pollutes git history, can accidentally commit sensitive files. Intentional commits with meaningful messages are always better. |

**Hook scripts use `node -e` for JSON parsing** (no `jq` dependency needed). Place scripts in `.claude/hooks/`, reference via `$CLAUDE_PROJECT_DIR/.claude/hooks/script.sh` in settings.

**Example settings.json structure:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/block-dangerous.sh\"", "timeout": 5 },
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/log-commands.sh\"", "timeout": 5, "async": true }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/protect-files.sh\"", "timeout": 5 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/eslint-fix.sh\"", "timeout": 30 }
        ]
      }
    ]
  }
}
```

### CI/CD Pipeline (GitHub Actions)

**4-stage pipeline on every PR:**
1. Lint + Type Check (`eslint`, `tsc --noEmit`)
2. Build verification (`next build`)
3. E2E tests against Vercel Preview (Playwright)
4. Auto-deploy on merge to main (Vercel handles this)

**Dependency management:**
- Start with **Dependabot** (built-in, free, handles security patches)
- Upgrade to **Renovate** when you need dependency grouping and automerge rules

### Design-to-Code
| Tool | Use For |
|------|---------|
| **Figma MCP** | Pull design tokens and components directly into IDE |
| **v0 by Vercel** | Quick UI prototyping with React + shadcn + Tailwind |
| **Builder.io Visual Copilot** | One-click Figma to React + Tailwind conversion |

### AI Workflow Tools
| Tool | Use For |
|------|---------|
| **Claude Code Skills** (`.claude/skills/`) | Reusable AI workflows, community skills via `npx skills add` |
| **`npx add-mcp`** | Universal MCP installer (auto-detects agents, writes config) |
| **v0** | UI component prototyping |
| **Claude Agent SDK** | Custom automation agents (when needed) |

---

## 5. Optional Tools (Add When a Feature Demands It)

| Category | Pick | When to Add |
|----------|------|-------------|
| Rich Text Editor | **Tiptap** | Content editing, comments, notes |
| Animation | **Motion** (Framer Motion) | Page transitions, micro-interactions |
| Search | **Meilisearch** (easy) or **Typesense** (scale) | Full-text search across entities |
| AI/LLM | **Vercel AI SDK** | Streaming chat, completions, agent UIs |
| File Upload | **UploadThing** | Managed uploads with S3 + CDN built-in |
| Email Templates | **React Email** | Type-safe email components (pairs with Resend) |
| Data Fetching | **TanStack Query** | Heavy client-side data needs |
| WebSockets | **Ably** (managed) or **PartyKit** (edge) | Real-time chat, collaboration |
| AI-Driven Dynamic UI | **json-render** (Vercel Labs) | Tenant-customizable dashboards, AI-generated layouts |
| Design Ideation | **Google Stitch** | Rapid mockup generation from text prompts |
| Programmatic Video | **Remotion** | Marketing videos, product demos, dynamic content from React components |

### json-render (Vercel Labs)
AI-generated UI from JSON specs. Define a component catalog (your shadcn components via Zod schemas), LLM generates a constrained JSON spec, renderer maps it to real React components.

- **Use for:** tenant dashboard builder, AI-powered custom views, dynamic admin panels, chat with rich UI responses
- **Don't use for:** your core app pages. You lose debugging, IDE support, and developer ergonomics
- **Packages:** `@json-render/next`, `@json-render/shadcn` (36 pre-built components), `@json-render/codegen` (export to standalone code)
- **Status:** experimental (vercel-labs), actively developed, not yet battle-tested
- **Integration:** ~2-3 days for a feature like a customizable dashboard

### Remotion
Programmatic video creation in React. Write videos as React components with props, state, and animations. Render to MP4/WebM server-side.

- **Use for:** marketing videos, product demos, onboarding walkthroughs, dynamic social media content, client-facing video reports, changelog videos
- **Key advantage:** videos are code - version controlled, data-driven, templated. Change the data, re-render the video.
- **Packages:** `remotion`, `@remotion/player` (embed in app), `@remotion/lambda` (render on AWS Lambda), `@remotion/renderer` (local render)
- **Pairs with:** your existing React + Tailwind components, json-render (has a Remotion renderer)
- **Status:** production-ready, widely used, active development
- **Use case for SaaS:** generate personalized demo videos per client, automated changelog videos from git history, marketing content from templates

### Google Stitch
AI design tool from Google Labs (Gemini 2.5). Generate high-fidelity mockups from text prompts, sketches, or images on an infinite canvas.

- **Use for:** rapid design exploration and ideation before building
- **Don't use for:** code generation. Output is presentational only (no state, no interactivity, no shadcn)
- **v0 by Vercel is better for your stack** - produces production-ready React + shadcn + Tailwind code
- **Best workflow:** Stitch for quick visual exploration, then v0 or hand-code for implementation
- **Status:** free (350 generations/month), React + Tailwind export expected May 2026
- **Exports to:** HTML/CSS, Tailwind, Vue, Angular, Flutter, SwiftUI (React coming soon)

---

## Quick Start Summary

### Infra
| Layer | Choice |
|-------|--------|
| **Compute** | Vercel (Cloudflare Workers as future alternative) |
| **Database** | Neon Postgres |
| **DB Pooling** | Cloudflare Hyperdrive (free) |
| **Auth** | Better Auth |
| **Storage** | Cloudflare R2 |
| **DNS** | Cloudflare |
| **Email** | Resend + React Email |
| **Cache** | Upstash Redis |
| **Jobs** | Inngest (or Cloudflare Queues if on Workers) |

### Application
| Layer | Choice |
|-------|--------|
| **Framework** | Next.js |
| **ORM** | Drizzle |
| **UI** | shadcn/ui |
| **CSS** | Tailwind CSS v4 |
| **Forms** | React Hook Form |
| **Validation** | Zod |
| **State** | Zustand (when needed) |
| **Payments** | Stripe |
| **Icons** | Lucide |
| **Charts** | Recharts |
| **DnD** | dnd-kit |
| **PDF** | @react-pdf/renderer |

### Developer Tooling
| Layer | Choice |
|-------|--------|
| **AI Editor** | Claude Code + Cursor |
| **Testing** | Vitest + Playwright |
| **Errors** | Sentry |
| **Analytics** | PostHog |
| **Package Manager** | pnpm |
| **CI/CD** | GitHub Actions + Vercel |
| **Dependencies** | Dependabot (then Renovate) |

### MCP Servers (Day 1)
| Server | Purpose |
|--------|---------|
| **Vercel** | Deployments + logs |
| **Neon** | Database management |
| **Stripe** | Payment debugging |
| **GitHub** | Issues + PRs |

---

*Last updated: April 2026*
*Stack validated against production SaaS (That Fellow Digital LLC agency suite)*
