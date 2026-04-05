# PagePing — Product Spec & Claude Code Prompt

## What It Is

A consumer-focused website change monitor. Paste a URL, pick what to watch, get an alert when it changes. Dead simple. $9/mo.

---

## Market Position

Visualping (market leader) charges $100/mo for business, $10/mo personal tier is crippled (5 pages, 1x/day checks). Users complain about pricing escalation and cluttered UX. Distill.io is a browser extension, not a SaaS. ChangeTower is enterprise-only.

**PagePing undercuts on price and wins on simplicity.** No enterprise features. No workspace management. One screen, paste a URL, done.

| | Visualping | Distill.io | PagePing |
|--|-----------|-----------|---------|
| Price | $10-100/mo | Free extension + $8/mo cloud | $9-19/mo |
| Target | Enterprise/compliance | Developers | Consumers |
| UX | Complex, feature-heavy | Browser extension | One-screen web app |
| Check speed | 1x/day on cheap plan | Varies | 15min on $9, 5min on $19 |

---

## Target Users & Ad Angles

1. **Job seekers** — "Alert me when [company] posts a new role on their careers page"
   - Ad: "Stop refreshing LinkedIn. Get pinged the second a job drops."

2. **Apartment hunters** — "Alert me when a unit opens up at [building/complex]"
   - Ad: "That apartment won't last. Get alerted before everyone else."

3. **Visa/immigration** — "Alert me when appointment slots open at [consulate site]"
   - Ad: "Visa slots open and close in minutes. Be first to know."

4. **Restocks** — "Alert me when [product] is back in stock on [non-Amazon site]"
   - Ad: "Sold out? We'll watch it. You'll know the second it's back."

5. **Price drops** — "Alert me when the price changes on [any website]"
   - Ad: "Stop overpaying. Get alerted when the price finally drops."

---

## Plan Tiers

| Plan | Price | Monitors | Check Frequency | Change History |
|------|-------|----------|----------------|----------------|
| Free | $0 | 2 | Every 24 hours | 7 days |
| Starter | $9/mo | 10 | Every 15 minutes | 30 days |
| Pro | $19/mo | 50 | Every 5 minutes | 90 days |

---

## Data Model (schema-agnostic — adapt to your ORM)

### users
- id (primary key)
- email
- stripe_customer_id (nullable)
- plan: enum [free, starter, pro]
- created_at

### monitors
- id (primary key)
- user_id (FK → users)
- url (the page to watch)
- label (user-friendly name, e.g. "Tesla Careers Page")
- selector (nullable — CSS selector to watch a specific part of the page)
- keyword (nullable — only alert if this specific word appears or disappears)
- check_interval_minutes (integer: 5, 15, 30, 60, 360, 1440)
- last_snapshot (text — the extracted content from last check)
- last_checked_at (timestamp)
- last_changed_at (timestamp, nullable)
- status: enum [active, paused, error]
- error_message (nullable — last error if status=error)
- created_at

### change_log
- id (primary key)
- monitor_id (FK → monitors)
- detected_at (timestamp)
- diff_summary (text — human-readable description of what changed)
- previous_snapshot (text)
- new_snapshot (text)
- notified (boolean)

---

## Pages / Routes

```
/                    → Landing page (hero, use cases, how-it-works, pricing, FAQ)
/login               → Auth (magic link or OAuth, whatever your auth setup is)
/dashboard           → List of all monitors with status, last checked, last changed
/monitors/new        → Create: URL input, optional CSS selector, optional keyword, frequency picker
/monitors/[id]       → Detail: change history timeline, edit settings, pause/resume, delete
/settings            → Account, current plan, Stripe billing portal link
```

---

## Monitor Check Logic (the core product loop)

This runs on a scheduled worker (cron, queue, whatever your infra uses):

```
Every cycle:
  1. Query monitors WHERE status='active'
     AND now() > last_checked_at + check_interval_minutes
     AND user's plan allows this check frequency

  2. For each monitor:
     a. HTTP GET the URL (10s timeout, reasonable user-agent string)
     
     b. If selector is set → parse HTML, extract only that element's text
        If no selector → extract full page text (strip script, style, nav, footer)
     
     c. If keyword is set →
          Check if keyword is now present or absent compared to last snapshot
          Only trigger alert if the keyword STATUS changed (appeared or disappeared)
        If no keyword →
          Diff extracted text vs last_snapshot
          Ignore whitespace-only or timestamp-only changes
          If meaningful diff detected → trigger alert
     
     d. On alert trigger:
        - Insert row into change_log
        - Send email notification
        - Update monitor.last_changed_at
     
     e. Always update:
        - monitor.last_snapshot = new extracted text
        - monitor.last_checked_at = now()
     
     f. On fetch error:
        - Set monitor.status = 'error'
        - Set monitor.error_message = error details
        - After 3 consecutive errors, auto-pause and notify user
```

---

## Email Alert Format

**Subject:** 🔔 [monitor label] just changed

**Body:**
- One-line diff summary (what changed, in plain language)
- Direct link to the monitored URL
- Link to view full change history in PagePing dashboard
- One-click "Pause this monitor" link
- Unsubscribe link (required for email compliance)

---

## Landing Page Structure

1. **Hero**
   - Headline: "Stop refreshing. We'll watch it for you."
   - Subhead: "PagePing monitors any webpage and alerts you the moment something changes."
   - CTA: URL input field + "Start Watching — Free" button (creates free account)

2. **Use Cases**
   - 4 cards: Jobs, Apartments, Restocks, Visa Slots
   - Each card: icon + one-line pain point + one-line solution

3. **How It Works**
   - Step 1: Paste any URL
   - Step 2: Choose what to watch (whole page, specific section, or a keyword)
   - Step 3: Get alerted by email the moment it changes

4. **Pricing**
   - 3-column table (Free / Starter $9 / Pro $19)
   - Highlight Starter as "Most Popular"

5. **FAQ**
   - How often does it check?
   - What websites work? (Any public page. JavaScript-heavy SPAs may not work on MVP.)
   - Can I watch just part of a page? (Yes, use a CSS selector.)
   - Can I watch for a specific word? (Yes, keyword monitoring.)
   - How fast will I get notified? (Within minutes of the change, depending on your plan.)

6. **Footer** — minimal

---

## Stripe Integration Requirements

- Two products: Starter ($9/mo), Pro ($19/mo)
- Checkout: redirect to Stripe Checkout from pricing CTA
- Webhooks to handle:
  - `checkout.session.completed` → set user plan
  - `customer.subscription.updated` → update plan
  - `customer.subscription.deleted` → downgrade to free
- Customer Portal: link in /settings so users manage their own billing

---

## Ad Strategy (launch day)

### Google Ads — $15/day
**Keywords:**
- "website change alert"
- "page monitor"
- "notify me when page changes"
- "job posting alert"
- "apartment listing alert"
- "restock notification"
- "website monitor tool"

**Ad copy:**
"Stop Refreshing. Get Alerted. | Monitor any webpage. Get notified when it changes. From $9/mo. Try free."

### Meta Ads — $10/day
**Audience:** 25-45, interests in job searching, apartment hunting, online shopping
**Creative:** Split screen — left: person refreshing a page repeatedly. Right: person getting a ping notification while relaxing.
**Copy:** "That apartment. That job. That sold-out item. Stop checking. We'll tell you when it changes. Free to start."

---

## Post-Launch Checklist

- [ ] Ship MVP
- [ ] Stripe products + webhooks live
- [ ] Email provider configured for alerts
- [ ] Deploy to production
- [ ] Buy domain (pageping.io, pageping.app, watchpage.io, or similar)
- [ ] Google Ads campaign live
- [ ] Meta Ads campaign live
- [ ] Product Hunt launch (schedule for a Tuesday)
- [ ] Post on r/SideProject, r/InternetIsBeautiful, r/Entrepreneur
- [ ] Post on X with screen recording demo

---

## MVP Scope Boundaries (what to NOT build this weekend)

- ❌ No SMS/push notifications (email only for MVP)
- ❌ No JavaScript rendering (Cheerio/server-side HTML parsing only — note in FAQ)
- ❌ No screenshot diffs (text-based diffing only)
- ❌ No team/workspace features
- ❌ No API
- ❌ No webhook integrations
- ❌ No mobile app
- ❌ No Slack/Discord integrations

All of these are expansion features for after you validate demand with paying users.
