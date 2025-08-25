package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Reporter struct {
	cfg *Config
}

func NewReporter(cfg *Config) *Reporter {
	return &Reporter{cfg: cfg}
}

func (r *Reporter) WriteJSON(res *RunResult, fileName string) error {
	// compute rps using duration if available
	if res.Duration > 0 {
		if res.Overall.Requests > 0 {
			res.Overall.ThroughputRPS = float64(res.Overall.Requests) / res.Duration.Seconds()
		}
		for name, s := range res.PerEndpoint {
			if s.Requests > 0 {
				s.ThroughputRPS = float64(s.Requests) / res.Duration.Seconds()
				res.PerEndpoint[name] = s
			}
		}
	}

	data, err := json.MarshalIndent(res, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(r.cfg.Report.OutDir, fileName), data, 0o644)
}

func (r *Reporter) WriteMarkdown(res *RunResult, fileName string) error {
	b := &strings.Builder{}
	fmt.Fprintf(b, "# API Performance Report\n\n")
	fmt.Fprintf(b, "Generated: %s\n\n", time.Now().Format(time.RFC3339))
	fmt.Fprintf(b, "Base URL: %s\n\n", r.cfg.BaseURL)

	fmt.Fprintf(b, "## Overall\n")
	writeMetricsTable(b, res.Overall)

	if r.cfg.Report.IncludePerEndpoint && len(res.PerEndpoint) > 0 {
		fmt.Fprintf(b, "\n## Per Endpoint\n")
		for name, s := range res.PerEndpoint {
			fmt.Fprintf(b, "\n### %s\n", name)
			writeMetricsTable(b, s)
		}
	}

	if len(res.Notes) > 0 {
		fmt.Fprintf(b, "\n## Notes\n")
		for k, v := range res.Notes {
			fmt.Fprintf(b, "- %s: %s\n", k, v)
		}
	}

	return os.WriteFile(filepath.Join(r.cfg.Report.OutDir, fileName), []byte(b.String()), 0o644)
}

func writeMetricsTable(b *strings.Builder, s MetricsSnapshot) {
	fmt.Fprintf(b, "\n")
	fmt.Fprintf(b, "| Metric | Value |\n")
	fmt.Fprintf(b, "|---|---:|\n")
	fmt.Fprintf(b, "| Requests | %d |\n", s.Requests)
	fmt.Fprintf(b, "| Errors | %d |\n", s.Errors)
	fmt.Fprintf(b, "| Error Rate | %.2f%% |\n", s.ErrorRate*100)
	fmt.Fprintf(b, "| Throughput (RPS) | %.2f |\n", s.ThroughputRPS)
	fmt.Fprintf(b, "| P50 Latency (ms) | %.2f |\n", s.P50Ms)
	fmt.Fprintf(b, "| P90 Latency (ms) | %.2f |\n", s.P90Ms)
	fmt.Fprintf(b, "| P95 Latency (ms) | %.2f |\n", s.P95Ms)
	fmt.Fprintf(b, "| P99 Latency (ms) | %.2f |\n", s.P99Ms)
	fmt.Fprintf(b, "| Min Latency (ms) | %.2f |\n", s.MinMs)
	fmt.Fprintf(b, "| Max Latency (ms) | %.2f |\n", s.MaxMs)
}


