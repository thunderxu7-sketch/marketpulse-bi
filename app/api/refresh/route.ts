import { getDatabase } from '@/db/bootstrap';
import { apiError, assertSameOrigin, json } from '@/lib/http';
import { clamp, healthScore, statusForRiskScore, utilization } from '@/lib/risk';

interface MarketSeed {
  id: number;
  symbol: string;
  price: number;
  totalDeposits: number;
  totalBorrows: number;
  badDebt: number;
  riskScore: number;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const db = await getDatabase();
    const state = await db.prepare(
      `SELECT key, value FROM app_state WHERE key IN ('last_refresh', 'refresh_count')`,
    ).all<{ key: string; value: string }>();
    const stateMap = Object.fromEntries(state.results.map((item) => [item.key, item.value]));
    const lastRefresh = Date.parse(stateMap.last_refresh ?? '0');
    const retryAfter = Math.ceil((10_000 - (Date.now() - lastRefresh)) / 1000);
    if (retryAfter > 0) {
      return json({ error: 'Refresh is rate limited', retryAfter }, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      });
    }

    const count = Number(stateMap.refresh_count ?? 0) + 1;
    const result = await db.prepare(
      `SELECT id, symbol, price, total_deposits AS totalDeposits,
              total_borrows AS totalBorrows, bad_debt AS badDebt, risk_score AS riskScore
       FROM markets ORDER BY id`,
    ).all<MarketSeed>();
    const now = new Date().toISOString();
    const updates = result.results.map((market, index) => {
      const wave = Math.sin((count + index) * 0.77);
      const change = wave * 0.006;
      const deposits = market.totalDeposits * (1 + change * 0.35);
      const borrows = market.totalBorrows * (1 + change * 0.58);
      const nextUtilization = utilization(borrows, deposits);
      const riskScore = Math.round(clamp(market.riskScore + wave * 2.4 + (nextUtilization > 70 ? 1 : -0.3), 4, 94));
      return {
        ...market,
        price: market.price * (1 + change),
        change24h: change * 100,
        totalDeposits: deposits,
        totalBorrows: borrows,
        riskScore,
        status: statusForRiskScore(riskScore),
      };
    });

    const totalDeposits = updates.reduce((total, market) => total + market.totalDeposits, 0);
    const totalBorrows = updates.reduce((total, market) => total + market.totalBorrows, 0);
    const revenue = 122_000 + count * 680 + Math.sin(count / 2) * 5_000;
    const batch = updates.map((market) => db.prepare(
      `UPDATE markets SET price = ?, change_24h = ?, total_deposits = ?, total_borrows = ?,
              risk_score = ?, status = ?, updated_at = ? WHERE id = ?`,
    ).bind(market.price, market.change24h, market.totalDeposits, market.totalBorrows,
      market.riskScore, market.status, now, market.id));

    batch.push(db.prepare(
      `INSERT INTO portfolio_snapshots
       (captured_at, total_deposits, total_borrows, revenue, health_score)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(now, totalDeposits, totalBorrows, revenue, healthScore(updates.map((market) => market.riskScore))));
    batch.push(db.prepare(
      `INSERT INTO app_state (key, value, updated_at) VALUES ('last_refresh', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).bind(now, now));
    batch.push(db.prepare(
      `INSERT INTO app_state (key, value, updated_at) VALUES ('refresh_count', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).bind(String(count), now));

    if (count % 3 === 0) {
      const market = updates[count % updates.length];
      batch.push(db.prepare(
        `INSERT INTO risk_events
         (market_id, event_type, severity, title, detail, status, occurred_at)
         VALUES (?, 'simulation_tick', 'info', ?, ?, 'open', ?)`,
      ).bind(market.id, `${market.symbol} monitoring cycle completed`,
        `Synthetic refresh #${count} recorded a ${market.change24h.toFixed(2)}% price movement`, now));
    }

    await db.batch(batch);
    return json({ refreshedAt: now, refreshCount: count });
  } catch (error) {
    return apiError(error);
  }
}
