package main

import (
	"sort"
	"sync"
	"time"
)

type Metrics struct {
	mu           sync.Mutex
	count        int64
	errors       int64
	latencies    []time.Duration
	bytesTotal   int64
	minLatency   time.Duration
	maxLatency   time.Duration
}

func NewMetrics() *Metrics {
	return &Metrics{minLatency: time.Duration(1<<63 - 1)}
}

func (m *Metrics) Record(latency time.Duration, bytes int64, isError bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.count++
	m.bytesTotal += bytes
	m.latencies = append(m.latencies, latency)
	if isError {
		m.errors++
	}
	if latency < m.minLatency {
		m.minLatency = latency
	}
	if latency > m.maxLatency {
		m.maxLatency = latency
	}
}

type MetricsSnapshot struct {
	Requests    int64   `json:"requests"`
	Errors      int64   `json:"errors"`
	ErrorRate   float64 `json:"error_rate"`
	BytesTotal  int64   `json:"bytes_total"`
	ThroughputRPS float64 `json:"throughput_rps"`
	P50Ms       float64 `json:"p50_ms"`
	P90Ms       float64 `json:"p90_ms"`
	P95Ms       float64 `json:"p95_ms"`
	P99Ms       float64 `json:"p99_ms"`
	MinMs       float64 `json:"min_ms"`
	MaxMs       float64 `json:"max_ms"`
}

func (m *Metrics) Snapshot() MetricsSnapshot {
	m.mu.Lock()
	defer m.mu.Unlock()

	if len(m.latencies) == 0 {
		return MetricsSnapshot{}
	}
	lat := append([]time.Duration(nil), m.latencies...)
	sort.Slice(lat, func(i, j int) bool { return lat[i] < lat[j] })

	get := func(p float64) time.Duration {
		idx := int(float64(len(lat)-1) * p)
		if idx < 0 {
			idx = 0
		}
		if idx >= len(lat) {
			idx = len(lat) - 1
		}
		return lat[idx]
	}

	return MetricsSnapshot{
		Requests:    m.count,
		Errors:      m.errors,
		ErrorRate:   percent(float64(m.errors), float64(m.count)),
		BytesTotal:  m.bytesTotal,
		ThroughputRPS: 0, // computed in reporter with actual wall time
		P50Ms:       float64(get(0.50).Milliseconds()),
		P90Ms:       float64(get(0.90).Milliseconds()),
		P95Ms:       float64(get(0.95).Milliseconds()),
		P99Ms:       float64(get(0.99).Milliseconds()),
		MinMs:       float64(m.minLatency.Milliseconds()),
		MaxMs:       float64(m.maxLatency.Milliseconds()),
	}
}

func percent(n, d float64) float64 {
	if d == 0 {
		return 0
	}
	return n / d
}


