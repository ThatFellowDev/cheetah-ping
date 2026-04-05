# Greenfield Launch Playbook - 2026

Operational checklist for launching a new SaaS project. Covers bootstrapping, account setup, compliance, and regulatory requirements. Companion to `greenfield-stack-2026.md` (technical decisions).

---

## Step 0: Bootstrap the Codebase

Go from empty folder to running app. All commands use `@latest` to avoid version pinning that goes stale.

> **Version note**: These commands install the latest versions at time of execution. If a major version has breaking changes, check the migration guide for that package.

### 0.1 Create Next.js App
```bash
pnpm create next-app@latest my-saas-app \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --turbopack
cd my-saas-app
```

### 0.2 Install Core Dependencies
```bash
# ORM + Database
pnpm add drizzle-orm @neondatabase/serverless @paralleldrive/cuid2
pnpm add -D drizzle-kit

# Auth
pnpm add better-auth

# UI Components
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card dialog input label tabs select toast sonner

# Forms + Validation
pnpm add react-hook-form @hookform/resolvers zod

# Fonts
pnpm add @fontsource-variable/inter @fontsource-variable/manrope
```

### 0.3 Configure Tailwind v4 Fonts
In your CSS entry point (`src/app/globals.css`), add font imports and configure the theme:
```css
@import "@fontsource-variable/inter";
@import "@fontsource-variable/manrope";

@theme {
  --font-sans: "Inter Variable", sans-serif;
  --font-display: "Manrope Variable", sans-serif;
}
```

### 0.4 Create Folder Structure
```bash
mkdir -p src/modules/{auth,payments,invoicing}
mkdir -p src/shared/{components/ui,lib,database}
mkdir -p src/types
mkdir -p .claude/hooks
```

### 0.5 Set Up Environment Validation
Create `src/shared/lib/env.ts`:
```typescript
const required = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL'] as const;
const optional = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'] as const;

type Env = Record<(typeof required)[number], string> & Partial<Record<(typeof optional)[number], string>>;

function validateEnv(): Env {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return Object.fromEntries(
    [...required, ...optional].map((key) => [key, process.env[key]])
  ) as Env;
}

export const env = validateEnv();
```

### 0.6 Set Up Drizzle
Create `src/shared/database/schema.ts` using the starter schema from `greenfield-stack-2026.md` > "Starter Drizzle Schema" section.

Create `src/shared/database/db.ts`:
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '@/shared/lib/env';

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

Create `drizzle.config.ts` at project root:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Push schema to database:
```bash
pnpm drizzle-kit push
```

### 0.7 Set Up Better Auth
Create `src/modules/auth/auth.ts`:
```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins/organization';
import { totp } from 'better-auth/plugins/totp';
import { magicLink } from 'better-auth/plugins/magic-link';
import { db } from '@/shared/database/db';
import { env } from '@/shared/lib/env';

export const auth = betterAuth({
  database: drizzleAdapter(db),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    organization(),
    totp(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Wire up Resend here when ready
        console.log(`Magic link for ${email}: ${url}`);
      },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
```

> **Important:** Verify Better Auth's exact import paths against the official docs at `better-auth.com` before using. Plugin APIs may have changed since this doc was written.

### 0.8 Set Up Claude Code Hooks
```bash
# Copy hook scripts from greenfield-hooks.md into .claude/hooks/
# Copy settings.json template to .claude/settings.json
chmod +x .claude/hooks/*.sh
```
See `greenfield-hooks.md` for complete hook scripts and `settings.json` template.

### 0.9 Create .env.example
```bash
cat > .env.example << 'ENVEOF'
# Required
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=generate-a-64-char-random-string
BETTER_AUTH_URL=http://localhost:3000

# Optional (degrade gracefully if missing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Branding
NEXT_PUBLIC_APP_NAME=My SaaS App
ENVEOF
```

### 0.10 First Run
```bash
cp .env.example .env.local
# Edit .env.local with your Neon connection string + generated secret
pnpm dev
```

---

## Project Isolation Protocol

Every new project gets its own isolated identity. No sharing accounts across projects.

### Step 1: Create a dedicated email
- Create a new **ProtonMail** address for the project (e.g., `myapp-dev@proton.me`)
- Use this email for ALL service signups below
- This keeps credentials, billing, and notifications siloed per project
- Add recovery to your main email

### Step 2: Business formation (if not already done)
- [ ] Form LLC or Delaware C Corp (C Corp if planning to raise VC)
- [ ] Apply for EIN at IRS.gov (free, instant online)
- [ ] Open business bank account (use EIN + formation docs)
- [ ] Get a business mailing address (PO Box or virtual office - needed for CAN-SPAM)

---

## Service Provider Signup Index

Sign up for these services using your project email. Organized by when you need them.

### Day 1 - Before Writing Code

| Service | Purpose | Free Tier | Signup URL |
|---------|---------|-----------|------------|
| **GitHub** | Code repository | Yes (unlimited private repos) | github.com |
| **Vercel** | Hosting + deployment | Yes (Hobby plan) | vercel.com |
| **Neon** | PostgreSQL database | Yes (0.5 GB) | neon.tech |
| **Cloudflare** | DNS + CDN + WAF | Yes | cloudflare.com |
| **Resend** | Transactional email | Yes (100 emails/day) | resend.com |
| **Stripe** | Payments | No monthly fee (2.9% + $0.30 per tx) | stripe.com |
| **ProtonMail** | Project email | Yes | proton.me |

### Day 1 - Claude Code Hooks Setup

| Task | Details |
|------|---------|
| Create `.claude/hooks/` directory | `mkdir -p .claude/hooks` |
| Add `block-dangerous.sh` | Blocks `rm -rf`, `git push --force`, `DROP TABLE` |
| Add `protect-files.sh` | Hard-blocks writes to `.env*`, `*.pem`, `*.key` |
| Add `log-commands.sh` | Timestamps every command to audit log |
| Add linter hook (if applicable) | ESLint/Prettier/Biome auto-fix after edits |
| Add ORM hook (if applicable) | Drizzle migration generation after schema changes |
| Configure `.claude/settings.json` | Wire up hooks + set `attribution: { commit: "", pr: "" }` |
| Make scripts executable | `chmod +x .claude/hooks/*.sh` |
| Commit hooks to git | Team gets the same safety nets automatically |

See `greenfield-hooks.md` for complete hook scripts and starter `settings.json` template.

### Day 1 - Domain Setup

| Task | Where |
|------|-------|
| Register domain | Cloudflare or Porkbun |
| Point nameservers to Cloudflare | Domain registrar |
| Add domain to Vercel | Vercel dashboard |
| Add sending subdomain to Resend | Resend dashboard (e.g., `updates.yourdomain.com`) |
| Configure SPF, DKIM, DMARC | Cloudflare DNS (Resend auto-configures SPF + DKIM) |

**DMARC record** (add manually to Cloudflare):
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```
Start with `p=none` (monitoring), move to `p=quarantine` after verifying legitimate emails pass.

### Week 1 - Before First User

| Service | Purpose | Free Tier | Signup URL |
|---------|---------|-----------|------------|
| **Upstash** | Redis (rate limiting + cache) | Yes (10K commands/day) | upstash.com |
| **Sentry** | Error tracking | Yes (5K errors/month) | sentry.io |
| **PostHog** | Analytics + feature flags | Yes (1M events/month) | posthog.com |
| **Inngest** | Background jobs | Yes (50K runs/month) | inngest.com |
| **Termly** or **GetTerms.io** | Privacy Policy + ToS generator | Yes (basic) | termly.io / getterms.io |

### Before First Paying Customer

| Service | Purpose | Free Tier | Signup URL |
|---------|---------|-----------|------------|
| **Cloudflare R2** | File storage | Yes (10 GB) | cloudflare.com |
| **Insureon** or **Founder Shield** | Business insurance (GL + Tech E&O) | No (~$100-150/mo) | insureon.com |

### Before Enterprise Sales (~$500K+ ARR)

| Service | Purpose | Cost |
|---------|---------|------|
| **Vanta** or **Drata** | SOC 2 compliance automation | ~$10-15K/yr |
| **Cyber liability insurance** | Data breach coverage | ~$100-200/mo |
| **Lawyer** | ToS + Privacy Policy review | $500-1,500 one-time |

---

## MCP Server Setup (Day 1)

After signing up for services, connect them to your AI coding tools:

```bash
# Universal installer (auto-detects your agents)
npx add-mcp https://mcp.vercel.com        # Vercel
npx add-mcp @neondatabase/mcp-server-neon  # Neon DB
npx add-mcp @anthropic/mcp-server-github   # GitHub

# After Stripe setup
# Add Stripe MCP via stripe.com/docs/mcp

# Drizzle has no separate MCP - use Neon MCP for DB operations
# and drizzle-kit CLI for schema management
```

---

## Regulatory Compliance Checklist

### Day 1 - Before Launch

#### Privacy + Legal
- [ ] Privacy Policy published (use Termly or GetTerms.io)
- [ ] Terms of Service published
- [ ] Physical mailing address in footer or legal pages (CAN-SPAM requirement)
- [ ] Data deletion capability built in (GDPR/CCPA right to erasure)
- [ ] GPC (Global Privacy Control) browser signal support
- [ ] Document which cookies your app uses and why

#### Email Compliance
- [ ] SPF record configured (Resend handles during domain verification)
- [ ] DKIM record configured (Resend handles during domain verification)
- [ ] DMARC record added to DNS (`v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`)
- [ ] Every commercial email includes unsubscribe link
- [ ] Every commercial email includes physical mailing address
- [ ] Use a sending subdomain (e.g., `updates.yourdomain.com`)

#### Payments
- [ ] Use Stripe Checkout or Elements (never handle raw card data)
- [ ] Complete SAQ A via Stripe dashboard (~30 min)
- [ ] Never log, store, or transmit card numbers

#### Accessibility (WCAG 2.1 AA)
- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, proper heading hierarchy)
- [ ] 4.5:1 color contrast ratio (text to background)
- [ ] All interactive elements keyboard-accessible
- [ ] ARIA labels on icons and non-text elements
- [ ] Focus management for modals and dynamic content
- [ ] Alt text on all images
- [ ] Form labels and error messages associated with inputs
- [ ] Run Lighthouse accessibility audit on every page
- [ ] Add axe-core or Pa11y to CI/CD pipeline

#### Security Basics
- [ ] HTTPS everywhere (Vercel handles this)
- [ ] RBAC (role-based access control) implemented
- [ ] MFA available for admin accounts
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection
- [ ] Input validation on all API endpoints (Zod)
- [ ] SQL injection prevention (ORM handles this)
- [ ] XSS prevention (React handles most, sanitize user HTML)
- [ ] Secrets in environment variables, never in code

#### Cookie Consent
- [ ] If using ONLY essential cookies (auth, CSRF, session) - no banner needed, just document them
- [ ] If adding analytics/tracking - add cookie consent banner before enabling (use CookieYes or Termly)

### Before First Enterprise Customer

- [ ] Lawyer review of ToS + Privacy Policy ($500-1,500)
- [ ] SOC 2 Type II prep (start 6 months ahead with Vanta/Drata)
- [ ] Cyber liability insurance
- [ ] Data Processing Agreement (DPA) template for customers
- [ ] Formal WCAG 2.1 AA accessibility audit
- [ ] Cookie consent banner (if you added analytics/tracking)
- [ ] Incident response plan documented

### When Scaling Internationally

- [ ] EU data residency (provision EU Neon region, pin Vercel compute to EU)
- [ ] Multi-state US privacy law compliance audit
- [ ] ISO 27001 (if selling to EU enterprise)
- [ ] Appoint Data Protection Officer (DPO) if required
- [ ] Standard Contractual Clauses (SCCs) for EU data transfers
- [ ] Translate privacy policy for key markets

---

## Insurance Checklist

| Policy | What It Covers | When to Get | Cost |
|--------|---------------|-------------|------|
| **General Liability** | Physical injury, property damage claims | Before first customer | ~$31/mo |
| **Tech E&O** | Software failures, outages, lost data | Before first customer | ~$91/mo |
| **Cyber Liability** | Data breaches, ransomware, regulatory fines | Before enterprise sales | ~$100-200/mo |
| **Combined Tech E&O + Cyber** | Bundle (cheaper) | When scaling | ~$100-150/mo |

Companies with SOC 2 Type II get 10-25% lower cyber insurance premiums.

---

## Key Thresholds to Watch

| Threshold | What It Triggers |
|-----------|-----------------|
| **Any EU user data** | GDPR applies (no revenue minimum) |
| **100K California users/yr** | CCPA applies |
| **$26.6M annual revenue** | CCPA applies |
| **35K Rhode Island users** | Rhode Island privacy law applies |
| **5K+ emails/day** | Google/Yahoo one-click unsubscribe required |
| **1M transactions/yr** | PCI DSS Level 1 (requires external audit) |
| **Enterprise sales** | SOC 2 expected by 83% of buyers |
| **Series A fundraising** | VCs expect security posture documentation |

---

## Quick Reference: What Costs Money

| Item | Cost | When |
|------|------|------|
| LLC formation | $50-500 (varies by state) | Day 1 |
| Domain registration | $10-15/yr | Day 1 |
| Insurance (GL + Tech E&O) | ~$120/mo | Before first customer |
| Lawyer review (ToS + PP) | $500-1,500 | Within first year |
| SOC 2 audit | $15-50K | Before enterprise sales |
| Compliance automation (Vanta) | ~$10-15K/yr | Before enterprise sales |
| Cyber insurance | ~$100-200/mo | Before enterprise sales |
| **Everything else** | **Free tier** | Day 1 |

Total to launch: ~$200-700 upfront + ~$120/mo insurance. Everything else is free until you scale.

---

*Last updated: April 2026*
*Companion to: greenfield-stack-2026.md*
