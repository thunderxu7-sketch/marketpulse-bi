import { clamp, healthScore, statusForRiskScore, utilization } from '@/lib/risk';
import type { AlertRule, DashboardData, Market, RiskEvent, Snapshot } from '@/lib/types';

interface LocalState {
  markets: Market[];
  events: RiskEvent[];
  rules: AlertRule[];
  snapshots: Snapshot[];
  lastRefresh: string;
  refreshCount: number;
}

const storageKey = 'marketpulse-pages-db-v1';

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function createSeedState(): LocalState {
  const now = new Date().toISOString();
  const marketSeeds = [
    [1, 'BTC', 'Bitcoin', 'Bitcoin', 111_820, 1.8, 124_800_000, 72_400_000, 18_200, 18, 'healthy'],
    [2, 'ETH', 'Ethereum', 'Ethereum', 4_328, -0.7, 116_200_000, 81_900_000, 126_400, 58, 'watch'],
    [3, 'USDT', 'Tether', 'TRON', 1, 0.02, 98_400_000, 66_100_000, 4_200, 22, 'healthy'],
    [4, 'USDC', 'USD Coin', 'Ethereum', 1, -0.01, 73_900_000, 45_800_000, 3_100, 17, 'healthy'],
    [5, 'TRX', 'TRON', 'TRON', 0.34, 2.4, 46_800_000, 21_900_000, 1_600, 15, 'healthy'],
    [6, 'wstETH', 'Wrapped stETH', 'Ethereum', 5_285, -1.3, 22_500_000, 13_300_000, 248_000, 76, 'critical'],
  ] as const;
  const markets: Market[] = marketSeeds.map(([id, symbol, name, chain, price, change24h, totalDeposits, totalBorrows, badDebt, riskScore, status]) => ({
    id, symbol, name, chain, price, change24h, totalDeposits, totalBorrows, badDebt, riskScore, status,
    utilization: utilization(totalBorrows, totalDeposits),
    updatedAt: now,
  }));
  const events: RiskEvent[] = [
    [1, 2, 'ETH', 'utilization', 'critical', 'ETH utilization crossed 70%', 'Threshold 68% · Current 70.5%', 4],
    [2, 1, 'BTC', 'oracle_deviation', 'warning', 'Price feed deviation detected', 'BTC oracle spread reached 1.8%', 16],
    [3, 6, 'wstETH', 'bad_debt', 'critical', 'wstETH bad debt increased', 'Exposure rose by $42,800 in 30 minutes', 31],
    [4, 3, 'USDT', 'liquidity', 'warning', 'USDT liquidity buffer narrowed', 'Coverage ratio moved below 1.35×', 48],
    [5, null, null, 'revenue', 'info', 'Revenue snapshot completed', '24h protocol revenue $128,420', 65],
    [6, 4, 'USDC', 'volume', 'info', 'Large USDC repayment confirmed', '$2.8M repayment reduced market utilization', 103],
    [7, 5, 'TRX', 'oracle_recovery', 'info', 'TRX feed recovered', 'All configured sources are back within tolerance', 144],
  ].map(([id, marketId, symbol, eventType, severity, title, detail, offset]) => ({
    id: id as number,
    marketId: marketId as number | null,
    symbol: symbol as string | null,
    eventType: eventType as string,
    severity: severity as RiskEvent['severity'],
    title: title as string,
    detail: detail as string,
    status: 'open',
    occurredAt: minutesAgo(offset as number),
    acknowledgedAt: null,
  }));
  const rules: AlertRule[] = [
    [1, 'High utilization', 'utilization', 'gte', 68, '%', 'critical', true],
    [2, 'Oracle deviation', 'oracleDeviation', 'gte', 1.5, '%', 'warning', true],
    [3, 'Bad debt increase', 'badDebtDelta', 'gte', 25_000, 'USD', 'critical', true],
    [4, 'Liquidity coverage', 'liquidityCoverage', 'lt', 1.35, 'ratio', 'warning', true],
    [5, 'Risk concentration', 'topMarketShare', 'gte', 35, '%', 'warning', false],
  ].map(([id, name, metric, operator, threshold, unit, severity, enabled]) => ({
    id: id as number,
    name: name as string,
    metric: metric as string,
    operator: operator as AlertRule['operator'],
    threshold: threshold as number,
    unit: unit as string,
    severity: severity as AlertRule['severity'],
    enabled: enabled as boolean,
    updatedAt: now,
  }));
  const snapshots: Snapshot[] = [];
  for (let day = 29; day >= 0; day -= 1) {
    const index = 29 - day;
    const date = new Date(Date.now() - day * 86_400_000);
    date.setHours(0, 0, 0, 0);
    snapshots.push({
      capturedAt: date.toISOString(),
      totalDeposits: 420_000_000 + index * 2_150_000 + Math.sin(index / 2.7) * 8_000_000,
      totalBorrows: 246_000_000 + index * 1_520_000 + Math.cos(index / 3.2) * 5_500_000,
      revenue: 96_000 + index * 950 + Math.sin(index / 2) * 7_500,
      healthScore: Math.round(86 + Math.sin(index / 4) * 3),
    });
  }
  return { markets, events, rules, snapshots, lastRefresh: minutesAgo(5), refreshCount: 0 };
}

function loadState() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) as LocalState : createSeedState();
  } catch {
    return createSeedState();
  }
}

function saveState(state: LocalState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function dashboard(state: LocalState): DashboardData {
  const markets = [...state.markets].sort((a, b) => b.riskScore - a.riskScore);
  const totalDeposits = markets.reduce((total, market) => total + market.totalDeposits, 0);
  const totalBorrows = markets.reduce((total, market) => total + market.totalBorrows, 0);
  const totalBadDebt = markets.reduce((total, market) => total + market.badDebt, 0);
  const openEvents = state.events.filter((event) => event.status === 'open');
  const revenue24h = state.snapshots.at(-1)?.revenue ?? 0;
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalDeposits,
      totalBorrows,
      utilization: utilization(totalBorrows, totalDeposits),
      openEvents: openEvents.length,
      criticalEvents: openEvents.filter((event) => event.severity === 'critical').length,
      badDebtRatio: utilization(totalBadDebt, totalBorrows),
      healthScore: healthScore(markets.map((market) => market.riskScore)),
      revenue24h,
    },
    markets,
    events: [...state.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 7),
    snapshots: [...state.snapshots].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).slice(-60),
    revenueMix: [
      { name: 'Lending markets', value: Math.round(revenue24h * 0.54) },
      { name: 'Energy services', value: Math.round(revenue24h * 0.29) },
      { name: 'Staking', value: Math.round(revenue24h * 0.17) },
    ],
  };
}

function refresh(state: LocalState) {
  const elapsed = Date.now() - Date.parse(state.lastRefresh);
  const retryAfter = Math.ceil((10_000 - elapsed) / 1000);
  if (retryAfter > 0) return json({ error: 'Refresh is rate limited', retryAfter }, 429, { 'Retry-After': String(retryAfter) });

  const count = state.refreshCount + 1;
  const now = new Date().toISOString();
  state.markets = state.markets.map((market, index) => {
    const wave = Math.sin((count + index) * 0.77);
    const change = wave * 0.006;
    const totalDeposits = market.totalDeposits * (1 + change * 0.35);
    const totalBorrows = market.totalBorrows * (1 + change * 0.58);
    const nextUtilization = utilization(totalBorrows, totalDeposits);
    const riskScore = Math.round(clamp(market.riskScore + wave * 2.4 + (nextUtilization > 70 ? 1 : -0.3), 4, 94));
    return {
      ...market,
      price: market.price * (1 + change),
      change24h: change * 100,
      totalDeposits,
      totalBorrows,
      utilization: nextUtilization,
      riskScore,
      status: statusForRiskScore(riskScore),
      updatedAt: now,
    };
  });
  const totalDeposits = state.markets.reduce((total, market) => total + market.totalDeposits, 0);
  const totalBorrows = state.markets.reduce((total, market) => total + market.totalBorrows, 0);
  state.snapshots.push({
    capturedAt: now,
    totalDeposits,
    totalBorrows,
    revenue: 122_000 + count * 680 + Math.sin(count / 2) * 5_000,
    healthScore: healthScore(state.markets.map((market) => market.riskScore)),
  });
  state.snapshots = state.snapshots.slice(-60);
  if (count % 3 === 0) {
    const market = state.markets[count % state.markets.length];
    state.events.push({
      id: Math.max(0, ...state.events.map((event) => event.id)) + 1,
      marketId: market.id,
      symbol: market.symbol,
      eventType: 'simulation_tick',
      severity: 'info',
      title: `${market.symbol} monitoring cycle completed`,
      detail: `Synthetic refresh #${count} recorded a ${market.change24h.toFixed(2)}% price movement`,
      status: 'open',
      occurredAt: now,
      acknowledgedAt: null,
    });
  }
  state.refreshCount = count;
  state.lastRefresh = now;
  saveState(state);
  return json({ refreshedAt: now, refreshCount: count });
}

async function handleApi(url: URL, method: string, init?: RequestInit) {
  const state = loadState();
  if (method === 'GET' && url.pathname === '/api/health') {
    return json({ status: 'ok', database: 'browser-storage', markets: state.markets.length, timestamp: new Date().toISOString() });
  }
  if (method === 'GET' && url.pathname === '/api/dashboard') return json(dashboard(state));
  if (method === 'GET' && url.pathname === '/api/markets') {
    const status = url.searchParams.get('status') ?? 'all';
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const sort = url.searchParams.get('sort') ?? 'risk';
    const markets = state.markets
      .filter((market) => status === 'all' || market.status === status)
      .filter((market) => !search || `${market.symbol} ${market.name} ${market.chain}`.toLowerCase().includes(search))
      .sort((a, b) => sort === 'deposits' ? b.totalDeposits - a.totalDeposits : sort === 'utilization' ? b.utilization - a.utilization : b.riskScore - a.riskScore);
    return json({ markets, filters: { status, search, sort } });
  }
  if (method === 'GET' && url.pathname === '/api/events') {
    const status = url.searchParams.get('status') ?? 'all';
    const severity = url.searchParams.get('severity') ?? 'all';
    const events = state.events
      .filter((event) => status === 'all' || event.status === status)
      .filter((event) => severity === 'all' || event.severity === severity)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return json({ events, filters: { status, severity } });
  }
  const eventMatch = url.pathname.match(/^\/api\/events\/(\d+)$/);
  if (method === 'PATCH' && eventMatch) {
    const event = state.events.find((item) => item.id === Number(eventMatch[1]) && item.status === 'open');
    if (!event) return json({ error: 'Open event not found' }, 404);
    event.status = 'acknowledged';
    event.acknowledgedAt = new Date().toISOString();
    saveState(state);
    return json({ id: event.id, status: event.status, acknowledgedAt: event.acknowledgedAt });
  }
  if (method === 'GET' && url.pathname === '/api/rules') return json({ rules: state.rules });
  const ruleMatch = url.pathname.match(/^\/api\/rules\/(\d+)$/);
  if (method === 'PATCH' && ruleMatch) {
    const rule = state.rules.find((item) => item.id === Number(ruleMatch[1]));
    if (!rule) return json({ error: 'Rule not found' }, 404);
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) as { enabled?: unknown } : {};
    if (typeof body.enabled !== 'boolean') return json({ error: 'Invalid request' }, 400);
    rule.enabled = body.enabled;
    rule.updatedAt = new Date().toISOString();
    saveState(state);
    return json({ id: rule.id, enabled: rule.enabled, updatedAt: rule.updatedAt });
  }
  if (method === 'POST' && url.pathname === '/api/refresh') return refresh(state);
  return json({ error: 'Not found' }, 404);
}

export function installLocalApi() {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(rawUrl, window.location.href);
    if (url.pathname.startsWith('/api/')) {
      const requestMethod = typeof input === 'string' || input instanceof URL ? undefined : input.method;
      return handleApi(url, (init?.method ?? requestMethod ?? 'GET').toUpperCase(), init);
    }
    return nativeFetch(input, init);
  };
}
