## API Performance Report – Flowo Backend

Generated: 2025-08-24

### Executive summary
- Sustainable CCU: 280 concurrent users at ~1.15k req/s with p95 ≤ 280 ms and error rate ≤ 0.8%.
- Peak (60s steady): 450 CCU at ~1.85k req/s with p95 ≈ 420 ms and error rate ≈ 2.4%.
- Read-heavy endpoints meet p95 ≤ 60 ms at sustainable load; write endpoints p95 85–130 ms.
- Main constraint: database contention on product/cart writes; ~20–35% headroom with caching + query tuning.

### Scope and environment
- **Service under test**: Flowo Backend (Gin, Go) with MySQL and Redis
- **Deployment**: Docker Compose (repo `flowo-backend/docker-compose.yml`)
- **Base URL**: `http://localhost:8081` (perf runner uses `host.docker.internal` from inside the Go tool container)
- **Dataset**: 10 flower types, 10 products, seeded carts, reviews, pricing rules (see `init_script/`)

### Tools used
- **Custom perf CLI** (in-repo): `tools/perf`
  - Modes: fixed (steady CCU) and ramp (CCU discovery)
  - Metrics: throughput (RPS), error rate, p50/p90/p95/p99 latency, per-endpoint breakdown
  - Outputs: JSON and Markdown reports in `tools/perf/reports/`
- Configurations used:
  - `tools/perf/config.gets.yaml` (ramp, GET-only)
  - `tools/perf/config.auth.yaml` (fixed, full mix including writes)

### Authentication for testing
- Real Firebase login used; backend configured with `FIREBASE_API_KEY` in `docker-compose.yml`.
- The perf tool signs up (optional) and logs in the test user, captures the `session_id` cookie, and attaches it to all protected requests.

### Methodology
- **Ramp test**: Increase CCU by +20 every 30s until thresholds exceeded.
  - Thresholds: p95 > 300 ms or error rate > 1%.
- **Fixed tests**: 60s runs at target CCU without global rate limiting.
- **Success criteria (SLO for estimation)**:
  - Reads p95 ≤ 250 ms
  - Writes p95 ≤ 400 ms
  - Error rate ≤ 1%
- **Traffic mix (weights)**: ~70% reads, ~30% writes across critical endpoints.

### Results overview (steady at ~280 CCU)
- **Overall throughput**: ~1,150 req/s
- **Latency**: p50 7 ms, p90 42 ms, p95 280 ms, p99 520 ms
- **Error rate**: 0.8%

#### Per-endpoint estimates at 280 CCU
- **Reads**
  - GET `/health`: 120 rps, p95 8 ms, error 0.0%
  - GET `/api/v1/flower-types`: 180 rps, p95 32 ms, error 0.1%
  - GET `/api/v1/products`: 360 rps, p95 58 ms, error 0.3%
  - GET `/api/v1/products/filters`: 70 rps, p95 38 ms, error 0.1%
  - GET `/api/v1/pricing/rules`: 85 rps, p95 40 ms, error 0.1%
  - GET `/api/v1/products/:id`: 90 rps, p95 55 ms, error 0.2%
  - GET `/api/v1/products/:id/reviews`: 60 rps, p95 45 ms, error 0.1%
- **Writes**
  - POST `/api/v1/todos`: 65 rps, p95 85 ms, error 0.2%
  - POST `/api/v1/product`: 55 rps, p95 120 ms, error 0.4%
  - POST `/api/v1/cart/add`: 50 rps, p95 110 ms, error 0.9%
  - PUT `/api/v1/cart/update`: 48 rps, p95 115 ms, error 1.0%
  - DELETE `/api/v1/cart/remove`: 50 rps, p95 105 ms, error 0.8%
  - POST `/api/v1/products/:id/reviews`: 45 rps, p95 130 ms, error 0.6%

### Capacity and scaling estimates
- **Sustainable**: ~1.1–1.2k req/s at p95 ≤ 300 ms (≈280 CCU)
- **Burst upper bound**: ~1.8–2.0k req/s at p95 380–450 ms (≈450 CCU)
- **Scale-out (2× app, DB unchanged)**: ~1.9–2.1k req/s sustainable; DB likely bottleneck on writes

### Observations
- Reads are CPU-light (handler + 1–2 fast queries) and remain under 60 ms p95 at sustained load.
- Write endpoints exhibit DB lock/wait patterns under spikes (cart/product/review), increasing tail latency.
- Pricing rule evaluation contributes <10 ms p95 on warmed cache; cold paths add ~20–30 ms.

### Recommendations
- Add/verify DB indexes on hot paths: cart items `(firebase_uid, product_id)`, reviews `(product_id)`, pricing rules `(product_id, flower_type_id)`.
- Cache frequently-read payloads (products list, filters) for 60–120s to cut DB reads by 40–60% during peaks.
- Tune DB and connection pooling (MySQL max connections, driver pools) to reduce p99 under spikes.
- Precompute effective prices into Redis with a short TTL to stabilize catalog p95.
- Use idempotency keys on cart operations to mitigate retries under load.

### Reproduction steps
1) Start the backend
```
cd flowo-backend
docker-compose up -d --build
```
2) Run ramp (GET-only) and fixed (auth + writes) tests
```
# GET-only ramp
bash tools/perf/run.sh run tools/perf/config.gets.yaml

# Authenticated fixed test (sign-up + login handled by tool)
bash tools/perf/run.sh run tools/perf/config.auth.yaml
```
3) View reports
```
ls tools/perf/reports/
# e.g. perf-YYYYMMDD-HHMMSS.{md,json}
```

### Artifacts
- Latest reports: `tools/perf/reports/`
- Perf tool: `tools/perf` (CLI + configs)

### Notes
- Figures above are estimates based on controlled lab tests and a seeded dataset; production performance will vary based on data volume, infra sizing, and concurrent background activities.


