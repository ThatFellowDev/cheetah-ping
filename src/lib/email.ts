import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();

  if (!client) {
    console.log(`\n=== EMAIL (no Resend key, logging to console) ===`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.slice(0, 200)}...`);
    console.log(`=================================================\n`);
    return;
  }

  await client.emails.send({
    from: 'Cheetah Ping <noreply@notify.cheetahping.com>',
    to,
    subject,
    html,
  });
}
