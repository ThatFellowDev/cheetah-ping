export type Plan = {
  name: string;
  subtitle: string;
  price: string;
  period: string;
  valueProp: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge: string | null;
};

export const plans: Plan[] = [
  {
    name: 'Free',
    subtitle: 'Track a few prices',
    price: '$0',
    period: '/mo',
    valueProp: '~150 checks/month on autopilot',
    features: ['5 monitors', 'Unlimited checks', 'Every 24 hours', '7 days history'],
    cta: 'Start for free',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Starter',
    subtitle: 'For serious deal hunters',
    price: '$9',
    period: '/mo',
    valueProp: '~28,800 checks/month on autopilot',
    features: ['10 monitors', 'Unlimited checks', 'Every 15 minutes', '30 days history'],
    cta: 'Get started',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Pro',
    subtitle: 'For power users',
    price: '$19',
    period: '/mo',
    valueProp: '~432,000 checks/month on autopilot',
    features: ['50 monitors', 'Unlimited checks', 'Every 5 minutes', '90 days history'],
    cta: 'Go pro',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Ultra',
    subtitle: "Can't miss a beat",
    price: '$49',
    period: '/mo',
    valueProp: '~2.16M checks/month. Nothing slips past you.',
    features: ['50 monitors', 'Unlimited checks', 'Every minute', '180 days history'],
    cta: 'Go ultra',
    highlighted: false,
    badge: 'Fastest',
  },
];
