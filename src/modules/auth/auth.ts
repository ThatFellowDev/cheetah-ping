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
  trustedOrigins: [
    'https://cheetahping.com',
    'https://www.cheetahping.com',
  ],
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
  // Better Auth built-in rate limiting (defense in depth with our Upstash layer)
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/api/auth/magic-link/sign-in': { window: 60, max: 3 },
      '/api/auth/sign-in/email': { window: 60, max: 5 },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 300, // 5 minutes
      sendMagicLink: async ({ email, url }) => {
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
    updateAge: 24 * 60 * 60, // refresh session token every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min cache
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
    },
  },
});
