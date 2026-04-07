import { Resend } from 'resend';

export async function sendEmail(
  resendKey: string | undefined,
  { to, subject, html }: { to: string; subject: string; html: string }
) {
  if (!resendKey) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  const resend = new Resend(resendKey);
  await resend.emails.send({
    from: 'Cheetah Ping <noreply@updates.cheetahping.com>',
    to,
    subject,
    html,
  });
}
