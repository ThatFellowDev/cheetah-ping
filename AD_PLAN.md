# Cheetah Ping — Ad Plan

Goal: validate demand and acquire the first 100 paying users on the cheapest channel that shows signal. Not a brand campaign — a **direct-response test** with clear kill criteria.

## Core positioning

**One line:** "Get pinged the second any webpage changes."

**Proof point to lead with:** AI setup (paste URL → done) + every-minute checks starting at $9/mo. This is the Visualping-killer angle: 80% cheaper, better UX, AI included.

## Target audiences (from landing page, ranked by intent)

Ordered by how desperate the buyer is. Desperation = conversion.

1. **Visa appointment hunters** — highest intent. People setting 5am alarms for US/UK/Schengen visa slots. Already losing sleep. Will pay $9 instantly.
2. **Restock hunters** — PS5/Nvidia GPU/Labubu/concert merch/Pokemon card drops. High intent, impulse buyers, social-native.
3. **Price drop hunters** — flights, electronics, furniture. Lower urgency but huge TAM.
4. **Job seekers** — specific company careers pages. Moderate urgency, but many free alternatives (LinkedIn alerts), so conversion will be harder.

**Start with #1 and #2.** They have the most pain, fewest substitutes, and lowest CAC ceiling.

## Channel plan — test cheapest first

### Phase 1: Organic + $0 validation (week 1)
Before spending a dollar, confirm message-market fit.

- [ ] **Reddit organic** — genuine comments (not spam) in r/visas, r/Schengen, r/usvisascheduling, r/nvidia, r/buildapcsales, r/Sneakers. Answer questions, mention Cheetah Ping only when relevant. Track referral traffic in Plausible/GA.
- [ ] **Twitter/X replies** — monitor keywords "visa appointment", "restock alert", "price drop" and reply helpfully. Don't post ads; be useful.
- [ ] **Product Hunt upcoming page** — collect emails before launch, use as a cold list.

**Kill criteria:** if 2 weeks of organic yields <10 signups, the copy/positioning is broken. Fix before spending money.

### Phase 2: Paid, $20-50/day budgets (week 2-3)
Only after organic shows any signal.

| Channel | Budget | Targeting | Why |
|---|---|---|---|
| **Reddit Ads** | $20/day | r/visas, r/usvisascheduling, r/Schengen, r/buildapcsales, r/Sneakers | Niche subs, cheap CPMs, high intent |
| **Google Search** | $30/day | "visa appointment alert", "restock notifier", "price drop alert", "website change monitor" | Capture existing demand |
| **Meta (IG/FB)** | $20/day | Interest: sneakerheads, PC gaming hardware, flight deal hunters | Best place for short video ads from Remotion |

**Don't start with:** TikTok (hard to attribute for SaaS), LinkedIn (wrong audience), YouTube pre-roll (too expensive at this stage).

### Phase 3: Scale what works (week 4+)
Kill anything under 1% CTR or over $15 CAC. Double the budget on anything working.

## Remotion video ads (post-sprint, before paid spend)

Produce **3× 15-second vertical (9:16) videos** using Remotion. One per top audience. Format:

1. **Problem state** (0-3s) — text overlay, real-feeling scenario ("Checked the embassy site. 6am. Gone in 13 seconds.")
2. **Product demo** (3-10s) — screen recording of paste-URL → AI configures → alert fires
3. **Payoff + CTA** (10-15s) — "cheetahping.com — $9/mo"

**Why Remotion:** programmatic means we can A/B test headline copy cheaply by re-rendering. Every variant is a code change, not a reshoot. Also lets us generate per-keyword variants at scale (e.g. auto-insert "visa" vs "PS5" into the same template).

Video specs:
- 1080×1920, 30fps, under 4MB for IG/Reddit
- Subtitles burned in (80% mobile watch with sound off)
- First frame must work as a thumbnail (pause-worthy)

## Landing pages for ad traffic

**Do not drive ad clicks to the homepage.** Build 2-3 audience-specific landing pages under `/use-cases/` before spending:

- `/use-cases/visa-appointments` — headline speaks to appointment slot hunting
- `/use-cases/restock-alerts` — headline speaks to drop culture
- `/use-cases/price-tracking` — headline speaks to deal hunters

Each page keeps the same signup flow but swaps hero copy, hero example URL in the AI intent demo, and testimonial placeholder. Already in v1.1 roadmap — **pull forward, this is a blocker for paid ads.**

## Tracking & measurement

Must have before spending a dollar:
- [ ] Plausible or GA4 with UTM capture
- [ ] Stripe revenue tied to UTM source (at least monthly cohort)
- [ ] Signup → activation → first-paid funnel dashboard (can be a SQL view in Neon)
- [ ] Per-ad-creative attribution (use unique UTMs per ad, not per channel)

## Budget ceiling & kill criteria

- **Total test budget:** $500 over 3 weeks
- **Target CAC:** under $20 for Starter ($9/mo → 2-month payback)
- **Kill:** any channel over $30 CAC after $100 spent. No "give it more time."
- **Winner:** any channel under $15 CAC → 3× budget, same creative, monitor for 2 more weeks before scaling further.

## Critical dependencies (block paid spend until done)

1. Visual screenshot architecture sprint completed (current) — ads must show a working product
2. Use-case landing pages shipped (pull from v1.1 roadmap)
3. Remotion video ads produced (3 variants)
4. Analytics + attribution wired up
5. At least one piece of organic signal (Reddit/Twitter) proving the pitch lands

Only then flip paid on.
