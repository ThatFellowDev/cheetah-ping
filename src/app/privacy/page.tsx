import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Cheetah Ping collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p>Last updated: April 12, 2026</p>

        <p>
          Cheetah Ping (&ldquo;we,&rdquo; &ldquo;us&rdquo;) operates
          cheetahping.com. This policy describes what data we collect, why, who
          we share it with, and what rights you have.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">What we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Email address:</strong> for authentication (magic link login) and alert delivery.</li>
          <li><strong>Monitored URLs:</strong> the web addresses you ask us to watch.</li>
          <li><strong>Page snapshots:</strong> HTML content of monitored pages, used to detect changes. May include screenshots stored on Cloudflare R2.</li>
          <li><strong>Payment info:</strong> processed and stored by Stripe. We store only your Stripe customer ID, never card numbers.</li>
          <li><strong>Session data:</strong> IP address and user agent, stored with your login session for security.</li>
          <li><strong>Notification webhooks:</strong> Slack or Discord webhook URLs you optionally provide.</li>
          <li><strong>Attribution data:</strong> if you arrive via a marketing link, we store the referral source (e.g. &ldquo;reddit&rdquo;) in a first-party cookie and in your user record.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-lg mt-6">How we use it</h2>
        <p>
          Your data is used to provide the monitoring service: checking URLs,
          detecting changes, generating AI summaries, sending alerts, and
          processing payments. We also use anonymous analytics to improve the
          product. We do not sell your data.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Cookies and tracking</h2>
        <p>We use the following cookies:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Session cookie</strong> (essential): set by Better Auth for login. HttpOnly, 30-day expiry.</li>
          <li><strong>Attribution cookie</strong> (<code>cp_attr</code>, non-essential): set when you arrive via a marketing link with UTM parameters. Stores referral source. 30-day expiry. You can decline this via the cookie banner.</li>
          <li><strong>Cloudflare Turnstile</strong> (essential): sets cookies during bot verification on the login page.</li>
          <li><strong>Stripe Checkout</strong>: sets cookies during the payment flow on Stripe&apos;s hosted page (governed by Stripe&apos;s privacy policy).</li>
        </ul>
        <p>
          We use PostHog for anonymous product analytics. PostHog stores a random
          identifier in your browser&apos;s localStorage (not a cookie) and does not
          track you across other websites. Session recording is disabled. You can
          opt out of analytics via the cookie consent banner.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Third-party services</h2>
        <p>We share data with the following services to operate Cheetah Ping:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Stripe</strong> (payments): receives your email and payment details. <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>.</li>
          <li><strong>Resend</strong> (email delivery): receives your email address and alert content. <a href="https://resend.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Resend Privacy Policy</a>.</li>
          <li><strong>Groq</strong> (AI analysis): receives page content (HTML text) for AI-powered monitor setup and change summaries. Does not receive your email or personal details.</li>
          <li><strong>PostHog</strong> (analytics): receives anonymous usage events. EU-hosted. <a href="https://posthog.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">PostHog Privacy Policy</a>.</li>
          <li><strong>Cloudflare</strong> (infrastructure): DNS, Turnstile bot protection, R2 screenshot storage, and Workers for monitoring execution.</li>
          <li><strong>Browserless</strong> (page rendering): receives monitored URLs to render JavaScript-heavy pages. No user PII is sent.</li>
          <li><strong>Neon</strong> (database hosting): stores all application data. <a href="https://neon.tech/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Neon Privacy Policy</a>.</li>
          <li><strong>Vercel</strong> (hosting): serves the web application. <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a>.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-lg mt-6">Data retention</h2>
        <p>
          Change history is automatically purged based on your plan: 7 days
          (Free), 30 days (Starter), 90 days (Pro), or 180 days (Ultra). When
          you delete a monitor, all associated change logs and screenshots are
          permanently deleted. When you delete your account, all data (monitors,
          change history, screenshots, sessions, and your Stripe customer
          record) is permanently deleted.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Your rights</h2>
        <p>You can exercise the following rights at any time:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Access and export:</strong> download a copy of all your data via Settings &gt; Export My Data.</li>
          <li><strong>Rectification:</strong> update your name and notification preferences in Settings.</li>
          <li><strong>Erasure:</strong> delete your account and all associated data via Settings &gt; Delete Account.</li>
          <li><strong>Objection:</strong> opt out of analytics via the cookie consent banner, or email us to restrict processing.</li>
          <li><strong>Portability:</strong> your data export is in JSON format, machine-readable and portable.</li>
        </ul>
        <p>
          To exercise any right not covered above, email privacy@cheetahping.com.
          We respond within 30 days.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">California residents (CCPA)</h2>
        <p>
          We do not sell personal information. California residents have the right
          to know what data we collect, request deletion, and opt out of any
          future sale. To exercise these rights, email privacy@cheetahping.com.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Children</h2>
        <p>
          Cheetah Ping is not intended for anyone under 18. We do not knowingly
          collect data from minors. If you believe a minor has created an
          account, contact us and we will delete it.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Changes to this policy</h2>
        <p>
          We may update this policy. Material changes will be communicated via
          email to registered users. The &ldquo;Last updated&rdquo; date at the
          top reflects the latest revision.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Contact</h2>
        <p>
          Questions about this policy? Email us at privacy@cheetahping.com.
        </p>
      </div>
    </div>
  );
}
