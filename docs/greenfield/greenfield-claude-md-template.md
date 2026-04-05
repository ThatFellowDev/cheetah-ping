# CLAUDE.md Template for Greenfield SaaS Projects

Copy everything below the divider as `CLAUDE.md` into your new project root and customize the `[bracketed]` sections.

---

```markdown
@AGENTS.md  <!-- Tells Claude to read AGENTS.md for framework-specific warnings (see starter AGENTS.md at bottom of this doc) -->

# [Project Name] - Project Rules

## Codebase Reference (read on demand, NOT auto-loaded)
- `docs/brain/entity-map.md` - Entity relationships, status lifecycles
- `docs/brain/api-surface.md` - Complete API endpoint reference
- `docs/brain/ui-map.md` - Page routes, shared components
[Add more as your project grows]

## Greenfield Reference Docs
- `docs/greenfield-stack-2026.md` - Tech stack, architecture patterns, design system, starter schema
- `docs/greenfield-launch-playbook-2026.md` - Bootstrap, service signups, compliance
- `docs/greenfield-claude-optimization-2026.md` - Token efficiency, hooks vs rules
- `docs/greenfield-hooks.md` - Hook scripts, settings.json template

## Quality Standards (NON-NEGOTIABLE)
- **No gaps** - every button does something or does not exist
- **No fake data** - real DB data or clean empty states
- **No assuming** - ask if unclear
- **No hallucinating** - verify before referencing
- **Notify on limitations** - never silently skip
- **Complete workflows** - create -> view -> edit -> delete for every entity
- **Every link resolves** - no `href="#"`
- **Full-stack delivery** - backend AND frontend connected, no orphan backends

## End-to-End Thinking (CRITICAL)
- Trace the full user journey before building any feature
- Related entities linked in BOTH directions in UI
- When creating entity A that references B, allow creating B inline
- Think in workflows, not isolated pages

## Code Conventions
- **Next.js**: `params` is a Promise - always `const { id } = await params;`
- **Database**: Import `db` from `@/shared/database/db`, never raw client
- **Multi-tenancy**: Always scope queries with `organizationId` from session
- **Validation**: Zod schemas for all API input. No exceptions.
- **Errors**: `sonner` toasts for user feedback. No silent failures.
- **Deletes**: `ConfirmDialog` component. Never `window.confirm()`.
- **Semantic tokens only**: `bg-primary`, `text-muted-foreground`. Never `bg-blue-500`.
- **Path alias**: `@/` maps to `src/`. Always use it.
- **No em dashes** - use regular hyphens, commas, or rephrase

## UX Principles
- **Inline editing** - click fields to edit in place. No separate /edit pages.
- **Delete confirmation modals** - always use `ConfirmDialog`, never `window.confirm()`
- **Visual feedback** - every action shows loading, success, or error
- **Empty states** - helpful message with link to create first item
- **Filterable lists** - every list page has status tabs, search, and relevant filters
- **Status colors from shared config** - use `getStatusBadgeClass()`, never hardcode colors

## File Organization
- Dashboard: `src/app/(dashboard)/`
- Auth: `src/app/(auth)/`
- Portal: `src/app/portal/` [if client-facing portal needed]
- API: `src/app/api/`
- Modules: `src/modules/{feature}/`
- Shared: `src/shared/lib/` (utilities), `src/shared/components/` (components)
- Database: `src/shared/database/` (schema.ts, db.ts)

## Infrastructure
- **Compute**: Vercel | **Database**: Neon PostgreSQL | **Auth**: Better Auth
- **Email**: Resend | **Payments**: Stripe | **Cache**: Upstash Redis
- **ORM**: Drizzle | **UI**: shadcn/ui | **CSS**: Tailwind v4
- **Storage**: Cloudflare R2 | **DNS**: Cloudflare | **Jobs**: Inngest

## White-Label / Multi-Tenant
- All branding pulled from Organization model via `getOrg()`, never hardcoded
- Login page uses `NEXT_PUBLIC_APP_NAME` env var
- Every query scoped by `organizationId` from session

## Security (NON-NEGOTIABLE)
- API routes: always check session + verify org ownership before returning data
- Sensitive endpoints require OWNER/ADMIN role
- Never store API keys in the database - use env vars
- Never return secrets to the frontend
- Rate limit auth endpoints

## [Project-Specific Rules]
[Add rules unique to this project, e.g.:]
[- "Invoice numbers use org prefix + sequential counter"]
[- "Client portal uses magic link auth only"]

## Autonomy
- Minimize human intervention - run commands yourself
- Produce full working output - no stubs, TODOs, or placeholders
- Create helper files proactively for repeatable workflows

## Research First
- Use web search for library versions, API behavior, pricing
- Never answer from stale training data alone for external services
```

---

## Usage Notes

1. Copy the content between the markdown code fences above into your project's `CLAUDE.md`
2. Replace all `[bracketed]` sections with your project-specific values
3. Delete the `[Project-Specific Rules]` placeholder once you add real rules
4. Keep it under 150 lines - every line costs tokens every session
5. Reference docs on demand (the `docs/brain/` pattern) instead of inlining details
6. Rules that can be mechanically enforced should be hooks, not CLAUDE.md rules (see `greenfield-hooks.md`)

## Companion Files

This template works best when paired with:
- `greenfield-hooks.md` - Hook scripts for `.claude/hooks/` directory
- `AGENTS.md` - Create this file to instruct Claude to read framework docs before writing code

### Starter AGENTS.md

```markdown
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
```
