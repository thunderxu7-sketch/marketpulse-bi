# MarketPulse BI

MarketPulse BI is a full-stack financial risk observatory built as a public
portfolio project. It combines an executive analytics dashboard, operational
risk workflows, a typed API, and durable edge storage in one deployable app.

[Open the stable GitHub Pages demo](https://thunderxu7-sketch.github.io/marketpulse-bi/)

> All assets, balances, events, and revenue figures are synthetic. This project
> was independently built for demonstration and contains no proprietary source
> code or production data.

![MarketPulse BI social preview](./public/og.png)

## What it demonstrates

- **Executive BI dashboard** — deposits, borrows, utilization, protocol health,
  bad-debt exposure, and revenue composition.
- **Bilingual interface** — persistent Chinese and English switching across
  dashboards, tables, charts, filters, events, rules, and service status.
- **Interactive analytics** — responsive ECharts visualizations and a 30-day
  portfolio history.
- **Market explorer** — server-side search, filtering, sorting, risk scoring,
  and CSV export.
- **Risk operations** — filterable event stream with persistent acknowledgement.
- **Alert management** — editable, persistent alert-rule enablement.
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
| `GET` | `/api/events` | Filter the risk-event stream |
| `PATCH` | `/api/events/:id` | Persist event acknowledgement |
| `GET` | `/api/rules` | List configured alert rules |
| `PATCH` | `/api/rules/:id` | Persist rule enablement |
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
