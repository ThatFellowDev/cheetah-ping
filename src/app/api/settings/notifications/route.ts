import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';

const updateSchema = z.object({
  slackWebhookUrl: z
    .string()
    .url()
    .startsWith('https://hooks.slack.com/')
    .nullable()
    .optional(),
  discordWebhookUrl: z
    .string()
    .url()
    .refine(
      (url) =>
        url.startsWith('https://discord.com/api/webhooks/') ||
        url.startsWith('https://discordapp.com/api/webhooks/'),
      'Must be a valid Discord webhook URL'
    )
    .nullable()
    .optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Allow empty strings to clear webhook URLs
  const cleaned = {
    slackWebhookUrl: body.slackWebhookUrl || null,
    discordWebhookUrl: body.discordWebhookUrl || null,
  };

  // Only validate non-null URLs
  if (cleaned.slackWebhookUrl && !cleaned.slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
    return NextResponse.json({ error: 'Invalid Slack webhook URL' }, { status: 400 });
  }
  if (
    cleaned.discordWebhookUrl &&
    !cleaned.discordWebhookUrl.startsWith('https://discord.com/api/webhooks/') &&
    !cleaned.discordWebhookUrl.startsWith('https://discordapp.com/api/webhooks/')
  ) {
    return NextResponse.json({ error: 'Invalid Discord webhook URL' }, { status: 400 });
  }

  await db
    .update(user)
    .set(cleaned)
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ data: { success: true } });
}
