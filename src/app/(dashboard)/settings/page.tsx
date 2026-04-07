import { eq } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { requireAuth } from '@/lib/require-auth';
import { PLAN_LIMITS, PLAN_DISPLAY, type Plan } from '@/lib/plan-limits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { UpgradeButton } from './upgrade-button';
import { NotificationSettings } from './notification-settings';
import { DeleteAccount } from './delete-account';

const planFeatures: Record<Plan, string[]> = {
  free: ['5 monitors', 'Check every 24 hours', '7 days change history'],
  starter: ['10 monitors', 'Check every 15 minutes', '30 days change history'],
  pro: ['50 monitors', 'Check every 5 minutes', '90 days change history'],
  ultra: ['50 monitors', 'Check every minute', '180 days change history'],
};

const RECOMMENDED_PLAN: Plan = 'pro';

export default async function SettingsPage() {
  const authUser = await requireAuth();

  // Query full user record for webhook URLs
  const userData = await db.query.user.findFirst({
    where: eq(user.id, authUser.userId),
  });

  const plans = Object.keys(PLAN_LIMITS) as Plan[];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{authUser.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plan</span>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {PLAN_DISPLAY[authUser.plan].name} - {PLAN_DISPLAY[authUser.plan].price}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base">Your Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = authUser.plan === plan;
              const isRecommended = plan === RECOMMENDED_PLAN && !isCurrent;
              const price = PLAN_DISPLAY[plan].price;
              const priceNum = price.replace(/[^0-9]/g, '');

              return (
                <div
                  key={plan}
                  className={`
                    relative rounded-xl p-5 transition-all duration-300
                    ${isCurrent
                      ? 'glass glow-border border-primary/30'
                      : isRecommended
                        ? 'glass border-primary/20 hover:border-primary/30'
                        : 'glass glass-hover border-white/5 hover:border-white/10'
                    }
                  `}
                >
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {isCurrent && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        Current
                      </Badge>
                    )}
                    {isRecommended && (
                      <Badge className="bg-primary text-primary-foreground text-[10px]">
                        <Zap className="h-2.5 w-2.5 mr-0.5" />
                        Popular
                      </Badge>
                    )}
                  </div>

                  {/* Plan name + price */}
                  <div className="mb-4">
                    <h3 className="font-heading text-lg font-semibold">
                      {PLAN_DISPLAY[plan].name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-heading text-2xl font-bold">
                        {priceNum === '0' ? 'Free' : `$${priceNum}`}
                      </span>
                      {priceNum !== '0' && (
                        <span className="text-sm text-muted-foreground">/mo</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {planFeatures[plan].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {!isCurrent && plan !== 'free' && (
                    <UpgradeButton plan={plan} className="w-full" />
                  )}
                  {isCurrent && (
                    <div className="text-center text-xs text-muted-foreground py-2">
                      Your current plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSettings
            slackWebhookUrl={(userData as any)?.slackWebhookUrl || null}
            discordWebhookUrl={(userData as any)?.discordWebhookUrl || null}
          />
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base">Billing</CardTitle>
        </CardHeader>
        <CardContent>
          {authUser.plan === 'free' ? (
            <p className="text-sm text-muted-foreground">
              You're on the free plan. Upgrade to unlock more monitors and faster checks.
            </p>
          ) : (
            <UpgradeButton plan={authUser.plan} variant="outline" label="Manage billing" />
          )}
        </CardContent>
      </Card>

      <Card className="glass border-0 border border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <DeleteAccount />
        </CardContent>
      </Card>
    </div>
  );
}
