# Cheetah Ping - Routes & UI Reference

## Page Routes

```
/                    -> Landing page (public, marketing)
/login               -> Auth (magic link)
/dashboard           -> List all monitors with status, last checked, last changed
/monitors/new        -> Create monitor: URL, optional CSS selector, optional keyword, frequency
/monitors/[id]       -> Monitor detail: change history timeline, edit settings, pause/resume, delete
/settings            -> Account, current plan, Stripe billing portal link
/docs                -> Documentation site (Fumadocs, sidebar layout)
/docs/[...slug]      -> Individual doc pages (getting-started, monitors/*, alerts, billing)
/use-cases           -> Use case listing page
/use-cases/[slug]    -> Individual use case pages (30+ pages)
/admin               -> Admin dashboard (admin only)
/admin/users/[id]    -> Admin user detail (admin only)
/changes/[token]     -> Public shared change view (via share token)
/checkout/success    -> Post-checkout success page
/privacy             -> Privacy policy
/terms               -> Terms of service
```

---

## Landing Page Structure

### 1. Hero Section
- **Headline:** "Stop refreshing. We'll watch it for you."
- **Subhead:** "Cheetah Ping monitors any webpage and alerts you the moment something changes."
- **CTA:** URL input field + "Start Watching - Free" button
- CTA creates free account and first monitor in one flow

### 2. Use Cases Section
4 cards, each with icon + pain point + solution:
- **Job seekers** - "Stop refreshing LinkedIn. Get pinged the second a job drops."
- **Apartment hunters** - "That apartment won't last. Get alerted before everyone else."
- **Visa/immigration** - "Visa slots open and close in minutes. Be first to know."
- **Restocks** - "Sold out? We'll watch it. You'll know the second it's back."

### 3. How It Works Section
3 steps:
1. Paste any URL
2. Choose what to watch (whole page, specific section, or a keyword)
3. Get alerted by email the moment it changes

### 4. Pricing Section
4-column table (Free / Starter $9 / Pro $19 / Ultra $49). Highlight Starter as "Most Popular."

### 5. FAQ Section
- How often does it check?
- What websites work? (Any public page. JavaScript-heavy SPAs may not work on MVP.)
- Can I watch just part of a page? (Yes, CSS selector.)
- Can I watch for a specific word? (Yes, keyword monitoring.)
- How fast will I get notified? (Within minutes, depending on plan.)

### 6. Footer (shared `SiteFooter` component)
Two-column layout:
- **Left**: Brand name + tagline
- **Right**: Product links (Use Cases, Pricing, Documentation) + Legal links (Privacy Policy, Terms of Service)
- **Bottom**: Copyright line
- `pb-24` to clear the floating chat widget

---

## Dashboard Page (`/dashboard`)

### Layout
- Header with app name + nav (Dashboard, Settings, Logout)
- Monitor list as cards or table rows

### Monitor Card/Row Shows
- Label (or URL if no label)
- Status badge (active/paused/error) - use `getStatusBadgeClass()`
- URL (truncated, linked)
- Last checked timestamp
- Last changed timestamp (or "No changes yet")
- Check frequency
- Quick actions: pause/resume, delete

### Features
- **Status tabs**: All / Active / Paused / Error
- **Search**: filter by label or URL
- **Empty state**: "No monitors yet. Start watching a page." + link to /monitors/new
- **Plan limit indicator**: "3 of 10 monitors used"

---

## Create Monitor Page (`/monitors/new`)

### Form Fields
1. **URL** (required) - text input with URL validation
2. **Label** (optional) - friendly name, e.g. "Tesla Careers Page"
3. **Watch mode** (radio/tabs):
   - Whole page (default)
   - Specific element (shows CSS selector input)
   - Keyword (shows keyword input)
4. **CSS Selector** (conditional) - text input, shown when "Specific element" selected
5. **Keyword** (conditional) - text input, shown when "Keyword" selected
6. **Check frequency** (select) - only show intervals allowed by user's plan

### Validation
- URL must be valid HTTP/HTTPS
- Frequency must be >= plan's `minIntervalMinutes`
- Total monitor count must be < plan's `maxMonitors` (check before showing form, redirect to upgrade if at limit)

---

## Monitor Detail Page (`/monitors/[id]`)

### Header
- Monitor label (inline-editable)
- Status badge
- URL (linked to external site)
- Pause/Resume button
- Delete button (with ConfirmDialog)

### Settings Section (inline-editable)
- URL
- Label
- Selector
- Keyword
- Check frequency

### Change History Timeline
- Chronological list of changes (newest first)
- Each entry shows: timestamp, diff summary
- Expandable to show full previous/new snapshot diff
- "No changes detected yet" empty state

### Error State
- If status is "error": show error message prominently
- "Resume monitoring" button (resets consecutiveErrors to 0)

---

## Settings Page (`/settings`)

### Account Section
- Email (read-only, or editable if you add that flow)

### Plan Section
- Current plan name + features
- "Manage Billing" button -> Stripe Customer Portal
- Upgrade/downgrade CTAs

---

## Shared Components

| Component | Location | Used By |
|-----------|----------|---------|
| `StatusBadge` | `shared/components/status-badge.tsx` | Dashboard, monitor detail |
| `ConfirmDialog` | `shared/components/confirm-dialog.tsx` | Monitor delete |
| `InlineEdit` | `shared/components/inline-edit.tsx` | Monitor detail fields |
| `EmptyState` | `shared/components/empty-state.tsx` | Dashboard, change history |
| `PlanLimitBar` | `shared/components/plan-limit-bar.tsx` | Dashboard |

### Page-Specific Components (co-located)

| Component | Location | Purpose |
|-----------|----------|---------|
| `MonitorCard` | `app/(dashboard)/dashboard/monitor-card.tsx` | Monitor list item |
| `MonitorForm` | `app/(dashboard)/monitors/new/monitor-form.tsx` | Create monitor form |
| `ChangeTimeline` | `app/(dashboard)/monitors/[id]/change-timeline.tsx` | Change history display |
| `MonitorSettings` | `app/(dashboard)/monitors/[id]/monitor-settings.tsx` | Inline-editable settings |
| `HeroSection` | `app/(marketing)/hero-section.tsx` | Landing page hero |
| `PricingTable` | `app/(marketing)/pricing-table.tsx` | Landing page + settings upgrade |
| `UseCaseCards` | `app/(marketing)/use-case-cards.tsx` | Landing page use cases |
| `FaqSection` | `app/(marketing)/faq-section.tsx` | Landing page FAQ |

---

## Route Groups

```
src/app/
  (marketing)/           # Public pages: landing, use cases, pricing
    page.tsx             # Landing page (/)
    use-cases/           # Use case pages (listing + 30 individual pages)
    layout.tsx           # Marketing layout (header nav, shared footer)
  (auth)/                # Auth pages
    login/page.tsx       # Login page
  (dashboard)/           # Authenticated pages
    dashboard/page.tsx   # Monitor list
    monitors/
      new/page.tsx       # Create monitor (with AI analysis)
      [id]/page.tsx      # Monitor detail
    settings/page.tsx    # Account settings
    admin/page.tsx       # Admin dashboard (admin only)
    checkout/success/    # Post-checkout
    layout.tsx           # Dashboard layout (header nav, shared footer)
  (docs)/                # Documentation (Fumadocs)
    docs/
      layout.tsx         # DocsLayout with sidebar
      [[...slug]]/page.tsx  # Doc page renderer
    layout.tsx           # RootProvider + Fumadocs CSS
    docs-theme.css       # Theme overrides for amber/dark
  api/                   # API routes
    auth/[...all]/route.ts  # Better Auth catch-all
    chat/route.ts           # AI chat assistant (streaming)
    monitors/route.ts       # GET (list), POST (create)
    monitors/[id]/route.ts  # GET, PATCH, DELETE
    monitors/[id]/pause/route.ts
    monitors/[id]/resume/route.ts
    monitors/[id]/changes/route.ts
    monitors/analyze/route.ts  # AI URL analysis (Groq)
    monitors/pick/route.ts     # CSS selector suggestions
    monitors/preview/route.ts  # URL content preview
    monitors/proxy/route.ts    # Proxy for iframe preview
    monitors/screenshot/route.ts # Screenshot capture
    checkout/route.ts          # Stripe checkout session
    billing/portal/route.ts    # Stripe billing portal
    cron/retention/route.ts    # Daily data retention purge
    settings/                  # Notification + account settings
    admin/                     # Admin stats + user management
    webhooks/stripe/route.ts   # Stripe webhook handler
  privacy/page.tsx       # Privacy policy
  terms/page.tsx         # Terms of service
  changes/[token]/page.tsx # Public shared change view
```

### Documentation Content Structure

```
content/docs/
  index.mdx              # Docs landing page
  meta.json              # Sidebar ordering
  getting-started.mdx    # Quickstart guide
  monitors/
    meta.json
    index.mdx            # Monitor overview
    watch-modes.mdx      # Page vs keyword vs selector
    selectors.mdx        # CSS selector guide
    frequency.mdx        # Check intervals per plan
  alerts.mdx             # Email, Slack, Discord, webhooks
  billing.mdx            # Plans, limits, upgrading
```

---

## Global Components

### AI Chat Widget (`src/shared/components/chat/chat-widget.tsx`)
- Floating button (bottom-right) on all pages via root layout
- Opens to full-screen overlay on mobile, 384x500px panel on desktop
- Powered by Groq `llama-4-scout-17b-16e-instruct` via `/api/chat`
- Uses Vercel AI SDK v6 `useChat()` hook with `DefaultChatTransport`
- Graceful "unavailable" state when GROQ_API_KEY is missing

### Site Footer (`src/shared/components/site-footer.tsx`)
- Shared footer used by marketing and dashboard layouts
- Product links (Use Cases, Pricing, Documentation) + Legal links
- `pb-24` bottom padding clears the floating chat widget

---

*Last updated: April 2026*
*Companion to: cheetah-ping-architecture.md*
