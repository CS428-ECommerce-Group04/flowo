package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

func main() {
	configPath := flag.String("config", "tools/perf/config.example.yaml", "Path to YAML config file")
	outDir := flag.String("out", "", "Override output directory for reports")
	modeOverride := flag.String("mode", "", "Override test mode: fixed|ramp")
	flag.Parse()

	cfg, err := LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	if *modeOverride != "" {
		cfg.Test.Mode = *modeOverride
	}
	if *outDir != "" {
		cfg.Report.OutDir = *outDir
	}

	if cfg.Report.OutDir == "" {
		cfg.Report.OutDir = filepath.Join("tools", "perf", "reports")
	}

	if err := os.MkdirAll(cfg.Report.OutDir, 0o755); err != nil {
		log.Fatalf("failed to ensure report directory: %v", err)
	}

	runner := NewRunner(cfg)
	start := time.Now()
	var res *RunResult
	if cfg.Test.Mode == "ramp" {
		res, err = runner.RunRamp()
	} else {
		res, err = runner.RunFixed()
	}
	if err != nil {
		log.Fatalf("test run failed: %v", err)
	}
	res.Duration = time.Since(start)

	// Add test notes for reporting
	if res.Notes == nil {
		res.Notes = map[string]string{}
	}
	res.Notes["base_url"] = cfg.BaseURL
	res.Notes["test_mode"] = cfg.Test.Mode
	res.Notes["concurrency"] = fmt.Sprintf("%d", cfg.Test.Concurrency)
	res.Notes["duration_sec"] = fmt.Sprintf("%d", cfg.Test.DurationSec)
	res.Notes["global_rate_limit_per_sec"] = fmt.Sprintf("%d", cfg.Test.GlobalRateLimitPerSec)
	res.Notes["endpoint_count"] = fmt.Sprintf("%d", len(cfg.Endpoints))
	if cfg.Test.Mode == "ramp" {
		res.Notes["max_concurrency"] = fmt.Sprintf("%d", cfg.Test.MaxConcurrency)
		res.Notes["step"] = fmt.Sprintf("%d", cfg.Test.Step)
		res.Notes["step_duration_sec"] = fmt.Sprintf("%d", cfg.Test.StepDurationSec)
		res.Notes["max_error_rate"] = fmt.Sprintf("%.4f", cfg.Test.MaxErrorRate)
		res.Notes["max_p95_ms"] = fmt.Sprintf("%d", cfg.Test.MaxP95Ms)
	}

	// Generate reports
	reporter := NewReporter(cfg)
	timestamp := time.Now().Format("20060102-150405")
	baseName := fmt.Sprintf("perf-%s", timestamp)
	if contains(cfg.Report.Formats, "json") {
		if err := reporter.WriteJSON(res, baseName+".json"); err != nil {
			log.Printf("failed to write JSON report: %v", err)
		}
	}
	if contains(cfg.Report.Formats, "md") || contains(cfg.Report.Formats, "markdown") {
		if err := reporter.WriteMarkdown(res, baseName+".md"); err != nil {
			log.Printf("failed to write Markdown report: %v", err)
		}
	}

	log.Printf("Perf test complete. Reports written to %s", cfg.Report.OutDir)
}


