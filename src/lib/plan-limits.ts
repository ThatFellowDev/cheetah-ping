export const PLAN_LIMITS = {
  free: { maxMonitors: 5, minIntervalMinutes: 1440, historyDays: 7 },
  starter: { maxMonitors: 10, minIntervalMinutes: 15, historyDays: 30 },
  pro: { maxMonitors: 50, minIntervalMinutes: 5, historyDays: 90 },
  ultra: { maxMonitors: 50, minIntervalMinutes: 1, historyDays: 180 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export const PLAN_DISPLAY = {
  free: { name: 'Free', price: '$0/mo' },
  starter: { name: 'Starter', price: '$9/mo' },
  pro: { name: 'Pro', price: '$19/mo' },
  ultra: { name: 'Ultra', price: '$49/mo' },
} as const;

export const FREQUENCY_OPTIONS = [
  { value: 1, label: 'Every minute' },
  { value: 5, label: 'Every 5 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every hour' },
  { value: 360, label: 'Every 6 hours' },
  { value: 1440, label: 'Every 24 hours' },
] as const;
