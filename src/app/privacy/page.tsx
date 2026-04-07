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
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-foreground font-semibold text-lg mt-6">What we collect</h2>
        <p>
          We collect your email address for authentication and alert delivery. We store
          the URLs you monitor and snapshots of their content to detect changes.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">How we use it</h2>
        <p>
          Your data is used solely to provide the monitoring service: checking URLs,
          detecting changes, and sending you email alerts. We do not sell your data.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Cookies</h2>
        <p>
          We use essential cookies only for authentication and session management.
          No tracking cookies or third-party analytics cookies are used.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Data retention</h2>
        <p>
          Change history is retained based on your plan (7, 30, or 90 days).
          When you delete a monitor, all associated data is permanently deleted.
          You can delete your account at any time.
        </p>

        <h2 className="text-foreground font-semibold text-lg mt-6">Contact</h2>
        <p>
          Questions about this policy? Email us at privacy@cheetahping.com.
        </p>
      </div>
    </div>
  );
}
