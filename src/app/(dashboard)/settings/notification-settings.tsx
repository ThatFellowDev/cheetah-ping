'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MessageSquare, Hash, Loader2, Send } from 'lucide-react';

interface NotificationSettingsProps {
  slackWebhookUrl: string | null;
  discordWebhookUrl: string | null;
}

export function NotificationSettings({
  slackWebhookUrl: initialSlack,
  discordWebhookUrl: initialDiscord,
}: NotificationSettingsProps) {
  const [slack, setSlack] = useState(initialSlack || '');
  const [discord, setDiscord] = useState(initialDiscord || '');
  const [saving, setSaving] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slackWebhookUrl: slack || null,
          discordWebhookUrl: discord || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('Notification settings saved');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(channel: 'slack' | 'discord') {
    const webhookUrl = channel === 'slack' ? slack : discord;
    if (!webhookUrl) {
      toast.error(`Enter a ${channel} webhook URL first`);
      return;
    }

    const setter = channel === 'slack' ? setTestingSlack : setTestingDiscord;
    setter(true);

    try {
      const res = await fetch('/api/settings/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, webhookUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Test notification sent to ${channel}`);
    } catch {
      toast.error(`Failed to send test to ${channel}`);
    } finally {
      setter(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Slack Webhook URL
        </Label>
        <div className="flex gap-2">
          <Input
            value={slack}
            onChange={(e) => setSlack(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTest('slack')}
            disabled={testingSlack || !slack}
            title="Send test"
          >
            {testingSlack ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">How to create a Slack webhook</a>
        </p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          Discord Webhook URL
        </Label>
        <div className="flex gap-2">
          <Input
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTest('discord')}
            disabled={testingDiscord || !discord}
            title="Send test"
          >
            {testingDiscord ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Server Settings &gt; Integrations &gt; Webhooks &gt; New Webhook &gt; Copy URL
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Email alerts are always sent. Slack and Discord are additional channels.
      </p>

      <button
        onClick={handleSave}
        disabled={saving}
        className="glow-button h-8 px-4 rounded-xl text-sm w-full"
      >
        {saving ? 'Saving...' : 'Save notification settings'}
      </button>
    </div>
  );
}
