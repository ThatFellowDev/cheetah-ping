import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// --- User (Better Auth manages core fields, we add custom ones) ---
// Better Auth auto-creates: id, email, emailVerified, name, image, createdAt, updatedAt
// We reference the same table for our custom fields + relations
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  name: text('name').notNull(),
  image: text('image'),
  // Custom fields for Cheetah Ping
  stripeCustomerId: text('stripe_customer_id'),
  plan: text('plan').default('free').notNull(), // free | starter | pro | ultra
  slackWebhookUrl: text('slack_webhook_url'),
  discordWebhookUrl: text('discord_webhook_url'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  referredBy: text('referred_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('user_email_idx').on(t.email),
]);

// --- Session (Better Auth managed) ---
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('session_token_idx').on(t.token),
  index('session_user_idx').on(t.userId),
]);

// --- Account (Better Auth managed - for OAuth providers) ---
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Verification (Better Auth managed - for magic links) ---
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Monitors (Cheetah Ping core entity) ---
export const monitors = pgTable('monitors', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  label: text('label'),
  selector: text('selector'),
  keyword: text('keyword'),
  checkIntervalMinutes: integer('check_interval_minutes').notNull().default(1440),
  lastSnapshot: text('last_snapshot'),
  lastCheckedAt: timestamp('last_checked_at'),
  lastChangedAt: timestamp('last_changed_at'),
  status: text('status').default('active').notNull(), // active | paused | error
  errorMessage: text('error_message'),
  consecutiveErrors: integer('consecutive_errors').default(0).notNull(),
  shareEnabled: boolean('share_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('monitor_user_status_idx').on(t.userId, t.status),
  index('monitor_schedule_idx').on(t.status, t.lastCheckedAt),
]);

// --- Change Log (history of detected changes) ---
export const changeLog = pgTable('change_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  monitorId: text('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  diffSummary: text('diff_summary'),
  aiSummary: text('ai_summary'),
  previousSnapshot: text('previous_snapshot'),
  newSnapshot: text('new_snapshot'),
  notified: boolean('notified').default(false).notNull(),
  shareToken: text('share_token').$defaultFn(() => createId()),
}, (t) => [
  index('changelog_monitor_time_idx').on(t.monitorId, t.detectedAt),
]);

// --- Relations ---
export const userRelations = relations(user, ({ many }) => ({
  monitors: many(monitors),
  sessions: many(session),
}));

export const monitorRelations = relations(monitors, ({ one, many }) => ({
  user: one(user, { fields: [monitors.userId], references: [user.id] }),
  changes: many(changeLog),
}));

export const changeLogRelations = relations(changeLog, ({ one }) => ({
  monitor: one(monitors, { fields: [changeLog.monitorId], references: [monitors.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));
