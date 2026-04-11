# Cheetah Ping - Product Roadmap

## MVP (Now)

- [x] Text-based change detection (Cheerio HTML parsing)
- [x] AI-powered URL analysis (Groq auto-configures monitors)
- [x] AI change summaries (plain-English diffs)
- [x] Email alerts (Resend)
- [x] Slack + Discord webhook notifications
- [x] CSS selector monitoring (watch specific page elements)
- [x] Keyword monitoring (alert on word appear/disappear)
- [x] 4 plan tiers: Free ($0) / Starter ($9) / Pro ($19) / Ultra ($49)
- [x] Every-minute checks on Ultra plan
- [x] Cloudflare Workers monitoring engine (near-zero cost)
- [x] Magic link auth (Better Auth)
- [x] Stripe billing with checkout + customer portal
- [x] Glassmorphic dark UI with particle network hero
- [x] Comparison table vs Visualping & UptimeRobot
- [x] SEO: sitemap, robots.txt, llms.txt, JSON-LD, OpenGraph
- [x] Security: SSRF protection, XSS prevention, auth guards, security headers
- [x] Privacy Policy + Terms of Service with acceptance on signup

## v1.1 - Growth (Weeks 2-3)

- [ ] Annual billing toggle (20% discount)
- [ ] Beast tier ($99/mo): 30-second checks via Cloudflare Durable Objects, 50 monitors, 1 year history
- [ ] Use case landing pages for SEO (/use-cases/job-alerts, /use-cases/price-monitoring, etc.)
- [ ] Onboarding email drip sequence (welcome, setup tips, upgrade nudge)
- [ ] Custom check schedule — choose when checks start (e.g. "check every hour starting at 9 AM")
- [ ] Mobile-responsive polish pass
- [ ] Google Search Console + Analytics setup
- [ ] Referral program ("Give 2 free monitors, get 2")
- [ ] Affiliate portal (dashboard for affiliates, tracking links, payout management)

## v1.2 - Visual Monitoring + JS Support (Month 2)

- [ ] Playwright-based page rendering (Railway or Browserless.io) — enables monitoring JS-rendered sites
- [ ] Visual page screenshot selector (click-to-select elements via real screenshots)
- [ ] Screenshot diff comparison (before/after visual diffs)
- [ ] Screenshot storage on Cloudflare R2
- [ ] **Visual highlight overlay on monitor detail** — capture the selected element's bounding box at monitor creation, store alongside `last_screenshot_url`, and overlay a highlight on the hero screenshot so users can visually confirm what's being tracked at a glance
- [ ] Microsoft Teams integration
- [ ] Google Sheets webhook integration
- [ ] Public monitor pages (shareable change history)
- [ ] Monitor status badges (embed in READMEs/dashboards)
- [ ] **Authenticated page monitoring (tier 1)** — custom HTTP headers (Bearer/API keys), cookie paste, HTTP Basic Auth. Unlocks internal dashboards, API health checks, member-only pages. Includes "auth expired" detection + notification when cookies/tokens go stale.

## v1.3 - Distribution (Month 3)

- [ ] Chrome extension ("Watch this page" button on any site)
- [ ] SMS alerts (Twilio)
- [ ] Public API for programmatic monitor management
- [ ] Webhook notifications (custom HTTP endpoints)
- [ ] Bulk monitor import (CSV upload)
- [ ] Product Hunt launch

## v2.0 - Intelligence (Month 4-6)

- [ ] Custom AI alert filters ("only alert if price drops below $X")
- [ ] Natural language monitoring ("tell me when they announce a sale")
- [ ] Team workspaces (multi-user with roles)
- [ ] JS-rendered page support (Playwright-based checking)
- [ ] Advanced analytics (change frequency, patterns, reports)
- [ ] White-label option for agencies
- [ ] SOC 2 Type II compliance

---

## Differentiation vs Competitors

### What we do that nobody else does:
1. **AI-first setup** - Paste URL, AI auto-configures the monitor
2. **AI change summaries** - "The price dropped from $299 to $249" instead of raw diffs
3. **Simple pricing** - Flat monthly rate, not confusing check-based billing

### What we do better:
- 80% cheaper than Visualping ($9/mo vs $14-70/mo)
- Every-minute checks (vs Visualping's 2-min max)
- AI features included free (Visualping charges extra for "Premium AI")
- Slack + Discord on all plans (Visualping requires $140/mo Business plan)
- Modern, clean UI vs dated enterprise interfaces

### What competitors do that we plan to add:
- Visual screenshot diffs (Visualping) - v1.2
- Chrome extension (Visualping) - v1.3
- Public status pages (UptimeRobot) - v1.2
- SMS alerts (both competitors) - v1.3
- Team workspaces (both competitors) - v2.0

---

*Last updated: April 2026*
