# MarketPulse BI

MarketPulse BI is a full-stack financial risk observatory built as a public
portfolio project. It combines an executive command center, 11 specialist
workspaces, operational workflows, a typed API, and durable edge storage in one
deployable app.

[Open the stable GitHub Pages demo](https://thunderxu7-sketch.github.io/marketpulse-bi/)

> All assets, balances, events, and revenue figures are synthetic. This project
> was independently built for demonstration and contains no proprietary source
> code or production data.

![MarketPulse BI social preview](./public/og.png)

## What it demonstrates

- **Executive command center** — deposits, borrows, utilization, protocol
  health, revenue composition, and direct access to six operational modules.
- **Bilingual interface** — persistent Chinese and English switching across
  dashboards, tables, charts, filters, events, rules, and service status.
- **Price-feed operations** — primary/fallback source registry, 24-hour
  deviation trend, heartbeat, latency, confidence, and feed drill-down.
- **Bad-debt operations** — version/network segmentation, provision coverage,
  root-cause attribution, and recovery case queue.
- **Automation control** — five monitored agents, persistent pause/resume
  controls, success/latency SLAs, and an execution log.
- **Fund-flow intelligence** — deposit, withdrawal, borrow, and repayment
  trends with network/direction filters, large-transfer review, and CSV export.
- **Revenue intelligence** — 7/30-day, USD/TRX, network, source, cumulative,
  margin, share, and trend analysis.
- **Liquidation intelligence** — network and token filters, repay/reward views,
  execution-route analysis, and settlement status.
- **Market explorer** — server-side search, filtering, sorting, risk scoring,
  and CSV export.
- **Alert center** — searchable, filterable event stream with response SLA,
  rule coverage, contextual drill-down, and persistent acknowledgement.
- **Alert management** — editable, persistent alert-rule enablement.
- **Access administration** — role capability matrix, searchable directory,
  access audit feed, and persistent member-role assignment.
- **Synthetic monitoring cycle** — rate-limited backend refresh that updates
  markets, stores a new snapshot, and periodically emits an event.
- **Platform transparency** — live database/API health and documented endpoints.

## Architecture

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Vinext, Lucide |
| Visualization | Apache ECharts |
| API | App Router-compatible server routes |
| Persistence | Cloudflare D1 (SQLite) |
| Data access | Drizzle schema and generated SQL migration |
| Validation | Zod |
| Runtime | Cloudflare Workers-compatible edge deployment |
| Quality | ESLint, TypeScript, Vitest, GitHub Actions |

The full-stack application calls real API routes, and all workflow mutations
are stored in D1 rather than mocked in local component state. The GitHub Pages
mirror reuses the same typed UI and API contract, with state persisted in the
visitor's browser because GitHub Pages is a static hosting service.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Runtime and database health |
| `GET` | `/api/dashboard` | Aggregated KPIs, charts, markets, and recent events |
| `GET` | `/api/markets` | Search, filter, and sort market exposure |
| `GET` | `/api/operations` | All specialist operational analytics and records |
| `GET` | `/api/events` | Filter the risk-event stream |
| `PATCH` | `/api/events/:id` | Persist event acknowledgement |
| `GET` | `/api/rules` | List configured alert rules |
| `PATCH` | `/api/rules/:id` | Persist rule enablement |
| `PATCH` | `/api/agents/:id` | Persist automation-agent pause/resume state |
| `PATCH` | `/api/team/:id` | Persist member role assignment |
| `POST` | `/api/refresh` | Run a rate-limited synthetic monitoring cycle |

Write routes validate payloads and enforce same-origin browser requests. JSON
responses disable caching and include content-type hardening.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
nvm use
npm install
npm run dev
```

Open `http://localhost:3000`. The development runtime provisions a local D1
database automatically and seeds it on the first request.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

To update the generated migration after a schema change:

```bash
npm run db:generate
```

## Deployment

The stable public entry point is deployed automatically by GitHub Actions:

**[thunderxu7-sketch.github.io/marketpulse-bi](https://thunderxu7-sketch.github.io/marketpulse-bi/)**

The Cloudflare-compatible full-stack deployment with managed D1 storage remains
available as a secondary endpoint:

**[marketpulse-bi.gray-xu.chatgpt.site](https://marketpulse-bi.gray-xu.chatgpt.site)**

## License

[MIT](./LICENSE)
