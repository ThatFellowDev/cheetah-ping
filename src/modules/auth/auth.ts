import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { magicLink } from 'better-auth/plugins/magic-link';
import { db } from '@/shared/database/db';
import * as schema from '@/shared/database/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      stripeCustomerId: {
        type: 'string',
        required: false,
      },
      plan: {
        type: 'string',
        required: false,
        defaultValue: 'free',
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // In production, this sends via Resend
        // For local dev, logs to console
        if (process.env.RESEND_API_KEY) {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Cheetah Ping <noreply@notify.cheetahping.com>',
            to: email,
            subject: 'Your login link for Cheetah Ping',
            html: `
              <h2>Log in to Cheetah Ping</h2>
              <p>Click the link below to log in. This link expires in 5 minutes.</p>
              <a href="${url}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;">
                Log in to Cheetah Ping
              </a>
              <p style="color:#666;font-size:14px;margin-top:16px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            `,
          });
        } else {
          console.log(`\n=== MAGIC LINK ===`);
          console.log(`Email: ${email}`);
          console.log(`URL: ${url}`);
          console.log(`==================\n`);
        }
      },
    }),
  ],
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
  },
});
