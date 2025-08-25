package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/url"
	"sync"
	"sync/atomic"
	"time"
)

type RunResult struct {
	Config      *Config                 `json:"-"`
	StartedAt   time.Time               `json:"started_at"`
	Duration    time.Duration           `json:"duration"`
	Overall     MetricsSnapshot         `json:"overall"`
	PerEndpoint map[string]MetricsSnapshot `json:"per_endpoint"`
	Notes       map[string]string       `json:"notes,omitempty"`
}

type Runner struct {
	cfg           *Config
	client        *http.Client
	pool          []weightedEndpoint
	sessionCookie string
}

type weightedEndpoint struct {
	Name    string
	Method  string
	URL     string
	Body    []byte
	Headers map[string]string
	Weight  int
}

func NewRunner(cfg *Config) *Runner {
	tr := &http.Transport{
		MaxIdleConns:        cfg.HTTP.MaxIdleConns,
		MaxIdleConnsPerHost: cfg.HTTP.MaxIdleConnsPerHost,
		IdleConnTimeout:     time.Duration(cfg.HTTP.IdleConnTimeoutMs) * time.Millisecond,
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: cfg.HTTP.InsecureSkipTLSVerify},
	}
	client := &http.Client{Transport: tr, Timeout: cfg.RequestTimeout()}

	pool := make([]weightedEndpoint, 0, len(cfg.Endpoints))
	base, _ := url.Parse(cfg.BaseURL)
	for _, e := range cfg.Endpoints {
		u := *base
		u.Path = joinURLPath(u.Path, e.Path)
		pool = append(pool, weightedEndpoint{
			Name:    e.Name,
			Method:  e.Method,
			URL:     u.String(),
			Body:    []byte(e.Body),
			Headers: e.Headers,
			Weight:  e.Weight,
		})
	}
	return &Runner{cfg: cfg, client: client, pool: pool}
}

func (r *Runner) RunFixed() (*RunResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(r.cfg.Test.DurationSec)*time.Second)
	defer cancel()

	// Attempt auth if configured
	if r.sessionCookie == "" {
		if cookie, err := performAuth(r.cfg, r.client); err == nil && cookie != "" {
			r.sessionCookie = cookie
		}
	}

	limiter := newRateLimiter(r.cfg.Test.GlobalRateLimitPerSec)
	metrics := NewMetrics()
	perEp := map[string]*Metrics{}
	for _, e := range r.pool {
		perEp[e.Name] = NewMetrics()
	}

	var wg sync.WaitGroup
	var issued int64
	cc := r.cfg.Test.Concurrency
	if cc <= 0 {
		cc = 1
	}
	for i := 0; i < cc; i++ {
		wg.Add(1)
		go func(workerId int) {
			defer wg.Done()
			for ctx.Err() == nil {
				if limiter != nil {
					limiter.Take()
				}
				e := r.pickEndpoint()
				start := time.Now()
				status, bytesRead, err := r.doRequest(ctx, e)
				latency := time.Since(start)
				atomic.AddInt64(&issued, 1)
				isErr := err != nil || status >= 400
				metrics.Record(latency, bytesRead, isErr)
				perEp[e.Name].Record(latency, bytesRead, isErr)
				if r.cfg.Test.TotalRequests > 0 && int(atomic.LoadInt64(&issued)) >= r.cfg.Test.TotalRequests {
					return
				}
			}
		}(i)
	}
	wg.Wait()

	res := &RunResult{Config: r.cfg, StartedAt: time.Now()}
	res.Overall = metrics.Snapshot()
	res.PerEndpoint = make(map[string]MetricsSnapshot, len(perEp))
	for name, m := range perEp {
		res.PerEndpoint[name] = m.Snapshot()
	}
	return res, nil
}

func (r *Runner) RunRamp() (*RunResult, error) {
	maxCC := r.cfg.Test.MaxConcurrency
	if maxCC < 1 {
		maxCC = 1
	}
	step := r.cfg.Test.Step
	if step < 1 {
		step = 1
	}
	stepDur := time.Duration(r.cfg.Test.StepDurationSec) * time.Second

	// Attempt auth if configured
	if r.sessionCookie == "" {
		if cookie, err := performAuth(r.cfg, r.client); err == nil && cookie != "" {
			r.sessionCookie = cookie
		}
	}

	var bestCC int
	var lastGood MetricsSnapshot

	for cc := step; cc <= maxCC; cc += step {
		metrics := NewMetrics()
		perEp := map[string]*Metrics{}
		for _, e := range r.pool {
			perEp[e.Name] = NewMetrics()
		}
		limiter := newRateLimiter(r.cfg.Test.GlobalRateLimitPerSec)

		ctx, cancel := context.WithTimeout(context.Background(), stepDur)
		var wg sync.WaitGroup
		for i := 0; i < cc; i++ {
			wg.Add(1)
			go func(workerId int) {
				defer wg.Done()
				for ctx.Err() == nil {
					if limiter != nil {
						limiter.Take()
					}
					e := r.pickEndpoint()
					start := time.Now()
					status, bytesRead, err := r.doRequest(ctx, e)
					latency := time.Since(start)
					isErr := err != nil || status >= 400
					metrics.Record(latency, bytesRead, isErr)
					perEp[e.Name].Record(latency, bytesRead, isErr)
				}
			}(i)
		}
		wg.Wait()
		cancel()

		s := metrics.Snapshot()
		if s.ErrorRate <= r.cfg.Test.MaxErrorRate && s.P95Ms <= float64(r.cfg.Test.MaxP95Ms) {
			bestCC = cc
			lastGood = s
		} else {
			break
		}
	}

	res := &RunResult{Config: r.cfg, StartedAt: time.Now()}
	res.Overall = lastGood
	res.PerEndpoint = map[string]MetricsSnapshot{}
	if res.Notes == nil {
		res.Notes = map[string]string{}
	}
	res.Notes["max_sustained_concurrency"] = fmt.Sprintf("%d", bestCC)
	return res, nil
}

func (r *Runner) pickEndpoint() weightedEndpoint {
	// simple weighted random pick
	total := 0
	for _, e := range r.pool {
		total += e.Weight
	}
	x := rand.Intn(total)
	acc := 0
	for _, e := range r.pool {
		acc += e.Weight
		if x < acc {
			return e
		}
	}
	return r.pool[0]
}

func (r *Runner) doRequest(ctx context.Context, ep weightedEndpoint) (status int, bytesRead int64, err error) {
	req, err := http.NewRequestWithContext(ctx, ep.Method, ep.URL, bytes.NewReader(ep.Body))
	if err != nil {
		return 0, 0, err
	}
	for k, v := range r.cfg.Headers {
		req.Header.Set(k, v)
	}
	for k, v := range ep.Headers {
		req.Header.Set(k, v)
	}
	if r.cfg.Auth.BearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+r.cfg.Auth.BearerToken)
	}
	if r.sessionCookie != "" {
		req.Header.Add("Cookie", r.sessionCookie)
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()
	status = resp.StatusCode
	// drain body to reuse connection
	var buf [4096]byte
	var n int
	for {
		n, err = resp.Body.Read(buf[:])
		bytesRead += int64(n)
		if n == 0 || err != nil {
			break
		}
	}
	return status, bytesRead, nil
}

// Utilities

func contains(xs []string, q string) bool {
	for _, x := range xs {
		if x == q {
			return true
		}
	}
	return false
}

func joinURLPath(base, p string) string {
	if base == "" || base == "/" {
		return p
	}
	if p == "" || p == "/" {
		return base
	}
	if base[len(base)-1] == '/' && p[0] == '/' {
		return base + p[1:]
	}
	if base[len(base)-1] != '/' && p[0] != '/' {
		return base + "/" + p
	}
	return base + p
}

// Optional: JSON helper for debugging
func toJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}


