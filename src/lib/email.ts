import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const EMAIL_FOOTER = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;font-size:12px;color:#666;">
  <p>Cheetah Ping | cheetahping.com</p>
  <p>
    <a href="https://cheetahping.com/settings" style="color:#888;">Manage notification settings</a>
     |
    <a href="https://cheetahping.com/settings" style="color:#888;">Unsubscribe from alerts</a>
  </p>
</div>
`;

export async function sendEmail({
  to,
  subject,
  html,
  includeFooter = true,
}: {
  to: string;
  subject: string;
  html: string;
  includeFooter?: boolean;
}) {
  const client = getResend();
  const body = includeFooter ? html + EMAIL_FOOTER : html;

  if (!client) {
    console.log(`\n=== EMAIL (no Resend key, logging to console) ===`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body.slice(0, 200)}...`);
    console.log(`=================================================\n`);
    return;
  }

  await client.emails.send({
    from: 'Cheetah Ping <noreply@notify.cheetahping.com>',
    to,
    subject,
    html: body,
  });
}
