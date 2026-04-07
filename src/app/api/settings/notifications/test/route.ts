import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { channel, webhookUrl } = await request.json();

  if (!webhookUrl || !channel || (channel !== 'slack' && channel !== 'discord')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Strict URL validation - only allow known webhook domains
  if (channel === 'slack' && !webhookUrl.startsWith('https://hooks.slack.com/')) {
    return NextResponse.json({ error: 'Invalid Slack webhook URL' }, { status: 400 });
  }
  if (
    channel === 'discord' &&
    !webhookUrl.startsWith('https://discord.com/api/webhooks/') &&
    !webhookUrl.startsWith('https://discordapp.com/api/webhooks/')
  ) {
    return NextResponse.json({ error: 'Invalid Discord webhook URL' }, { status: 400 });
  }

  try {
    if (channel === 'slack') {
      await fetch(webhookUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test notification from Cheetah Ping',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Cheetah Ping* - Test notification\nIf you see this, Slack notifications are working.',
              },
            },
          ],
        }),
      });
    } else {
      await fetch(webhookUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: 'Cheetah Ping - Test Notification',
              description: 'If you see this, Discord notifications are working.',
              color: 0xffb700,
              footer: { text: 'Cheetah Ping' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
