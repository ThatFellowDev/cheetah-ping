import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Cheetah Ping website monitoring service.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p>Last updated: April 12, 2026</p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Agreement</h2>
        <p>
          By creating an account or using Cheetah Ping (operated by That Fellow
          Digital LLC), you agree to these Terms and our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          If you do not agree, do not use the service.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Eligibility</h2>
        <p>
          You must be at least 18 years old to use Cheetah Ping. By using the
          service, you represent that you meet this age requirement.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Service description</h2>
        <p>
          Cheetah Ping monitors publicly accessible webpages for changes and
          sends notifications via email, Slack, or Discord. We use AI to analyze
          page content and generate change summaries. We do not guarantee uptime,
          detection accuracy, or notification delivery.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Monitor pages you do not have permission to access.</li>
          <li>Use the service to overload, scrape, or attack target websites.</li>
          <li>Use the service for any illegal purpose.</li>
          <li>Attempt to circumvent plan limits, rate limits, or security measures.</li>
          <li>Share your account credentials or API keys with others.</li>
          <li>Upload or submit malicious content, including harmful URLs or code.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules without
          notice.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Billing and cancellation</h2>
        <p>
          Paid plans are billed monthly via Stripe. You can cancel anytime from
          your Settings page. Cancellation takes effect at the end of the current
          billing period. No partial refunds are issued for unused time. Refunds
          for other circumstances are handled case by case. Contact
          cheetahping@protonmail.com.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Data processing</h2>
        <p>
          By using Cheetah Ping, you authorize us to fetch, store, and analyze
          the content of the URLs you monitor. Page content may be sent to
          third-party AI providers (currently Groq) for analysis. See our
          Privacy Policy for the full list of third-party services.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Intellectual property and DMCA</h2>
        <p>
          Cheetah Ping does not claim ownership of the content on pages you
          monitor. If you believe content displayed by our service infringes
          your copyright, send a DMCA takedown notice to
          cheetahping@protonmail.com with: (1) the copyrighted work, (2) the
          infringing URL or content, (3) your contact information, and (4) a
          statement of good faith belief that the use is unauthorized. We will
          respond within 10 business days.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Limitation of liability</h2>
        <p>
          Cheetah Ping is provided &ldquo;as is&rdquo; without warranty. To the
          maximum extent permitted by law, our total liability for any claim
          arising from the service is limited to the amount you paid us in the
          12 months preceding the claim, or $100, whichever is greater. We are
          not liable for missed changes, false positives, data loss, lost
          revenue, or any indirect, incidental, or consequential damages.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Dispute resolution</h2>
        <p>
          Any dispute arising from these Terms will be resolved through binding
          arbitration administered by the American Arbitration Association under
          its Consumer Arbitration Rules. Arbitration will be conducted
          individually (no class actions). The arbitration will take place in
          the United States. Either party may seek injunctive relief in any
          court of competent jurisdiction.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Changes to these terms</h2>
        <p>
          We may update these Terms. Material changes will be communicated via
          email to registered users at least 14 days before they take effect.
          Continued use after the effective date constitutes acceptance.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Contact</h2>
        <p>
          Questions? Email us at cheetahping@protonmail.com.
        </p>
      </div>
    </div>
  );
}
