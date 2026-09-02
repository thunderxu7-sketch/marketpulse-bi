import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const markets = sqliteTable(
  'markets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    symbol: text('symbol').notNull(),
    name: text('name').notNull(),
    chain: text('chain').notNull(),
    price: real('price').notNull(),
    change24h: real('change_24h').notNull(),
    totalDeposits: real('total_deposits').notNull(),
    totalBorrows: real('total_borrows').notNull(),
    badDebt: real('bad_debt').notNull(),
    riskScore: integer('risk_score').notNull(),
    status: text('status', { enum: ['healthy', 'watch', 'critical'] }).notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_markets_symbol').on(table.symbol),
    index('idx_markets_status_risk').on(table.status, table.riskScore),
  ],
);

export const riskEvents = sqliteTable(
  'risk_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    marketId: integer('market_id').references(() => markets.id),
    eventType: text('event_type').notNull(),
    severity: text('severity', { enum: ['info', 'warning', 'critical'] }).notNull(),
    title: text('title').notNull(),
    detail: text('detail').notNull(),
    status: text('status', { enum: ['open', 'acknowledged'] }).notNull().default('open'),
    occurredAt: text('occurred_at').notNull(),
    acknowledgedAt: text('acknowledged_at'),
  },
  (table) => [
    index('idx_risk_events_status_time').on(table.status, table.occurredAt),
    index('idx_risk_events_severity_time').on(table.severity, table.occurredAt),
  ],
);

export const alertRules = sqliteTable(
  'alert_rules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    metric: text('metric').notNull(),
    operator: text('operator', { enum: ['gt', 'gte', 'lt', 'lte'] }).notNull(),
    threshold: real('threshold').notNull(),
    unit: text('unit').notNull(),
    severity: text('severity', { enum: ['info', 'warning', 'critical'] }).notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_alert_rules_enabled').on(table.enabled)],
);

export const portfolioSnapshots = sqliteTable(
  'portfolio_snapshots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    capturedAt: text('captured_at').notNull(),
    totalDeposits: real('total_deposits').notNull(),
    totalBorrows: real('total_borrows').notNull(),
    revenue: real('revenue').notNull(),
    healthScore: integer('health_score').notNull(),
  },
  (table) => [uniqueIndex('idx_snapshots_captured_at').on(table.capturedAt)],
);

export const appState = sqliteTable('app_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const automationAgents = sqliteTable(
  'automation_agents',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    mission: text('mission').notNull(),
    scope: text('scope').notNull(),
    status: text('status', { enum: ['healthy', 'watch', 'critical', 'paused'] }).notNull(),
    successRate: real('success_rate').notNull(),
    runs24h: integer('runs_24h').notNull(),
    medianLatencyMs: integer('median_latency_ms').notNull(),
    lastRunAt: text('last_run_at').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_automation_agents_status').on(table.status, table.enabled)],
);

export const teamMembers = sqliteTable(
  'team_members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    role: text('role', { enum: ['owner', 'risk', 'operator', 'viewer'] }).notNull(),
    status: text('status', { enum: ['active', 'invited'] }).notNull(),
    lastActiveAt: text('last_active_at').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_team_members_email').on(table.email),
    index('idx_team_members_role_status').on(table.role, table.status),
  ],
);
