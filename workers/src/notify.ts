export async function sendSlackNotification(
  webhookUrl: string,
  data: { label: string; url: string; summary: string; changeHistoryUrl: string }
) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `Change detected on "${data.label}"`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: 'Change Detected', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${data.label}*\n${data.summary}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Page' },
              url: data.url,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Change History' },
              url: data.changeHistoryUrl,
            },
          ],
        },
      ],
    }),
  });
}

export async function sendDiscordNotification(
  webhookUrl: string,
  data: { label: string; url: string; summary: string; changeHistoryUrl: string }
) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: `Change Detected: ${data.label}`,
          description: data.summary,
          url: data.url,
          color: 0xffb700, // amber/gold brand color
          fields: [
            { name: 'View Page', value: `[Open](${data.url})`, inline: true },
            { name: 'History', value: `[Open](${data.changeHistoryUrl})`, inline: true },
          ],
          footer: { text: 'Cheetah Ping' },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
}
