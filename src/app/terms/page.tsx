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
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Service</h2>
        <p>
          Cheetah Ping monitors publicly accessible webpages for changes and sends
          email notifications. We do not guarantee uptime or detection accuracy.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Acceptable use</h2>
        <p>
          You agree not to use the service to monitor pages you do not have permission
          to access, to overload target websites, or for any illegal purpose.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Billing</h2>
        <p>
          Paid plans are billed monthly via Stripe. You can cancel anytime.
          Refunds are handled on a case-by-case basis.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Limitations</h2>
        <p>
          The service monitors server-rendered HTML only. JavaScript-heavy single-page
          applications may not be fully supported. We are not responsible for missed
          changes or false positives.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Contact</h2>
        <p>
          Questions? Email us at support@cheetahping.com.
        </p>
      </div>
    </div>
  );
}
