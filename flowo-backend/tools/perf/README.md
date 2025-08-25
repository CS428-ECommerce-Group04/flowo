# API Performance & CCU Tester

A simple Go-based load testing tool for the backend. It runs fixed or ramp-mode tests against configured endpoints and outputs JSON and Markdown reports with latency percentiles, error rate, and estimated throughput.

## Features

- Fixed mode: run N concurrent workers for T seconds or until total requests reached
- Ramp mode: automatically step up concurrency until thresholds exceed (p95/error)
- Weighted endpoint mix, custom headers, bearer auth
- Global RPS limiter (optional)
- Connection pooling and timeouts
- JSON and Markdown reports with per-endpoint breakdown

## Quick Start

```bash
cd flowo-backend
# Run with example config
go run ./tools/perf -config tools/perf/config.example.yaml
# Override mode and output dir
go run ./tools/perf -config tools/perf/config.example.yaml -mode ramp -out ./tools/perf/reports
```

## Configuration

See `tools/perf/config.example.yaml` for all options.

Key fields:
- `base_url`: base of your API
- `endpoints`: list of endpoints with `name`, `method`, `path`, `weight`
- `test.mode`: `fixed` or `ramp`
- `test.concurrency`, `test.duration_sec` for fixed
- `test.max_concurrency`, `test.step`, `test.step_duration_sec`, `test.max_error_rate`, `test.max_p95_ms` for ramp
- `report.formats`: `json`, `md`

## Output

Reports are written to `report.out_dir` as timestamped files, e.g.:
- `perf-20250101-120000.json`
- `perf-20250101-120000.md`

The Markdown includes overall metrics and optionally per-endpoint metrics. JSON contains raw values for automation.

## Notes

- Ensure the backend is running and reachable at `base_url`.
- For authenticated endpoints, set `auth.bearer_token`.
- Use the global rate limiter to avoid overwhelming local or shared environments.
