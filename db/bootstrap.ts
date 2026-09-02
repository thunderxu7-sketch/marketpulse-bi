import { env } from 'cloudflare:workers';
import { defaultAutomationAgents, defaultTeamMembers } from '@/lib/operations';

let initialization: Promise<void> | undefined;

const statements = [
  `CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    chain TEXT NOT NULL,
    price REAL NOT NULL,
    change_24h REAL NOT NULL,
    total_deposits REAL NOT NULL,
    total_borrows REAL NOT NULL,
    bad_debt REAL NOT NULL,
    risk_score INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'watch', 'critical')),
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_markets_status_risk ON markets(status, risk_score)`,
  `CREATE TABLE IF NOT EXISTS risk_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER REFERENCES markets(id),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged')),
    occurred_at TEXT NOT NULL,
    acknowledged_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_risk_events_status_time ON risk_events(status, occurred_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_risk_events_severity_time ON risk_events(severity, occurred_at DESC)`,
  `CREATE TABLE IF NOT EXISTS alert_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    metric TEXT NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN ('gt', 'gte', 'lt', 'lte')),
    threshold REAL NOT NULL,
    unit TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled)`,
  `CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    captured_at TEXT NOT NULL UNIQUE,
    total_deposits REAL NOT NULL,
    total_borrows REAL NOT NULL,
    revenue REAL NOT NULL,
    health_score INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS automation_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mission TEXT NOT NULL,
    scope TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'watch', 'critical', 'paused')),
    success_rate REAL NOT NULL,
    runs_24h INTEGER NOT NULL,
    median_latency_ms INTEGER NOT NULL,
    last_run_at TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_automation_agents_status ON automation_agents(status, enabled)`,
  `CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'risk', 'operator', 'viewer')),
    status TEXT NOT NULL CHECK (status IN ('active', 'invited')),
    last_active_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_team_members_role_status ON team_members(role, status)`,
];

function atOffset(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function seedStatements(db: D1Database) {
  const now = new Date().toISOString();
  const markets = [
    [1, 'BTC', 'Bitcoin', 'Bitcoin', 111820, 1.8, 124_800_000, 72_400_000, 18_200, 18, 'healthy'],
    [2, 'ETH', 'Ethereum', 'Ethereum', 4328, -0.7, 116_200_000, 81_900_000, 126_400, 58, 'watch'],
    [3, 'USDT', 'Tether', 'TRON', 1, 0.02, 98_400_000, 66_100_000, 4_200, 22, 'healthy'],
    [4, 'USDC', 'USD Coin', 'Ethereum', 1, -0.01, 73_900_000, 45_800_000, 3_100, 17, 'healthy'],
    [5, 'TRX', 'TRON', 'TRON', 0.34, 2.4, 46_800_000, 21_900_000, 1_600, 15, 'healthy'],
    [6, 'wstETH', 'Wrapped stETH', 'Ethereum', 5285, -1.3, 22_500_000, 13_300_000, 248_000, 76, 'critical'],
  ];

  const events = [
    [1, 2, 'utilization', 'critical', 'ETH utilization crossed 70%', 'Threshold 68% · Current 70.5%', 'open', atOffset(4)],
    [2, 1, 'oracle_deviation', 'warning', 'Price feed deviation detected', 'BTC oracle spread reached 1.8%', 'open', atOffset(16)],
    [3, 6, 'bad_debt', 'critical', 'wstETH bad debt increased', 'Exposure rose by $42,800 in 30 minutes', 'open', atOffset(31)],
    [4, 3, 'liquidity', 'warning', 'USDT liquidity buffer narrowed', 'Coverage ratio moved below 1.35×', 'open', atOffset(48)],
    [5, null, 'revenue', 'info', 'Revenue snapshot completed', '24h protocol revenue $128,420', 'open', atOffset(65)],
    [6, 4, 'volume', 'info', 'Large USDC repayment confirmed', '$2.8M repayment reduced market utilization', 'open', atOffset(103)],
    [7, 5, 'oracle_recovery', 'info', 'TRX feed recovered', 'All configured sources are back within tolerance', 'open', atOffset(144)],
  ];

  const rules = [
    [1, 'High utilization', 'utilization', 'gte', 68, '%', 'critical', 1],
    [2, 'Oracle deviation', 'oracleDeviation', 'gte', 1.5, '%', 'warning', 1],
    [3, 'Bad debt increase', 'badDebtDelta', 'gte', 25_000, 'USD', 'critical', 1],
    [4, 'Liquidity coverage', 'liquidityCoverage', 'lt', 1.35, 'ratio', 'warning', 1],
    [5, 'Risk concentration', 'topMarketShare', 'gte', 35, '%', 'warning', 0],
  ];

  const agents = defaultAutomationAgents(new Date(now));
  const members = defaultTeamMembers(new Date(now));

  const prepared = [
    ...markets.map((row) => db.prepare(
      `INSERT OR IGNORE INTO markets
       (id, symbol, name, chain, price, change_24h, total_deposits, total_borrows, bad_debt, risk_score, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(...row, now)),
    ...events.map((row) => db.prepare(
      `INSERT OR IGNORE INTO risk_events
       (id, market_id, event_type, severity, title, detail, status, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(...row)),
    ...rules.map((row) => db.prepare(
      `INSERT OR IGNORE INTO alert_rules
       (id, name, metric, operator, threshold, unit, severity, enabled, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(...row, now)),
    ...agents.map((agent) => db.prepare(
      `INSERT OR IGNORE INTO automation_agents
       (id, name, mission, scope, status, success_rate, runs_24h, median_latency_ms,
        last_run_at, enabled, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(agent.id, agent.name, agent.mission, agent.scope, agent.status, agent.successRate,
      agent.runs24h, agent.medianLatencyMs, agent.lastRunAt, agent.enabled ? 1 : 0, agent.updatedAt)),
    ...members.map((member) => db.prepare(
      `INSERT OR IGNORE INTO team_members
       (id, name, email, role, status, last_active_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(member.id, member.name, member.email, member.role, member.status,
      member.lastActiveAt, member.createdAt)),
  ];

  for (let day = 29; day >= 0; day -= 1) {
    const index = 29 - day;
    const date = new Date(Date.now() - day * 86_400_000);
    date.setUTCHours(0, 0, 0, 0);
    const deposits = 420_000_000 + index * 2_150_000 + Math.sin(index / 2.7) * 8_000_000;
    const borrows = 246_000_000 + index * 1_520_000 + Math.cos(index / 3.2) * 5_500_000;
    const revenue = 96_000 + index * 950 + Math.sin(index / 2) * 7_500;
    const health = Math.round(86 + Math.sin(index / 4) * 3);
    prepared.push(db.prepare(
      `INSERT OR IGNORE INTO portfolio_snapshots
       (captured_at, total_deposits, total_borrows, revenue, health_score)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(date.toISOString(), deposits, borrows, revenue, health));
  }

  prepared.push(db.prepare(
    `INSERT OR IGNORE INTO app_state (key, value, updated_at) VALUES ('refresh_count', '0', ?)`,
  ).bind(now));
  prepared.push(db.prepare(
    `INSERT OR IGNORE INTO app_state (key, value, updated_at) VALUES ('last_refresh', ?, ?)`,
  ).bind(atOffset(5), now));
  return prepared;
}

async function initialize(db: D1Database) {
  await db.batch(statements.map((sql) => db.prepare(sql)));
  await db.batch(seedStatements(db));
  await db.prepare('PRAGMA optimize').run();
}

export async function getDatabase() {
  const db = env.DB;
  if (!db) throw new Error('D1 binding DB is unavailable');
  initialization ??= initialize(db);
  await initialization;
  return db;
}
