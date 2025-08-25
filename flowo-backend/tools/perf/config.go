package main

import (
	"errors"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	BaseURL   string            `yaml:"base_url"`
	Headers   map[string]string `yaml:"headers"`
	TimeoutMs int               `yaml:"timeout_ms"`
	Endpoints []EndpointConfig  `yaml:"endpoints"`
	Test      TestConfig        `yaml:"test"`
	Report    ReportConfig      `yaml:"report"`
	HTTP      HTTPConfig        `yaml:"http"`
	Auth      AuthConfig        `yaml:"auth"`
	Setup     []SetupStep       `yaml:"setup"`
}

type EndpointConfig struct {
	Name    string            `yaml:"name"`
	Method  string            `yaml:"method"`
	Path    string            `yaml:"path"`
	Body    string            `yaml:"body"`
	Weight  int               `yaml:"weight"`
	Headers map[string]string `yaml:"headers"`
}

type TestConfig struct {
	Mode string `yaml:"mode"`
	// fixed mode
	DurationSec   int `yaml:"duration_sec"`
	TotalRequests int `yaml:"total_requests"`
	Concurrency   int `yaml:"concurrency"`
	// ramp mode
	MaxConcurrency  int     `yaml:"max_concurrency"`
	Step            int     `yaml:"step"`
	StepDurationSec int     `yaml:"step_duration_sec"`
	MaxErrorRate    float64 `yaml:"max_error_rate"`
	MaxP95Ms        int     `yaml:"max_p95_ms"`
	// global rate limit
	GlobalRateLimitPerSec int `yaml:"global_rate_limit_per_sec"`
}

type ReportConfig struct {
	OutDir             string   `yaml:"out_dir"`
	Formats            []string `yaml:"formats"`
	IncludePerEndpoint bool     `yaml:"include_per_endpoint"`
}

type HTTPConfig struct {
	MaxIdleConns          int  `yaml:"max_idle_conns"`
	MaxIdleConnsPerHost   int  `yaml:"max_idle_conns_per_host"`
	IdleConnTimeoutMs     int  `yaml:"idle_conn_timeout_ms"`
	InsecureSkipTLSVerify bool `yaml:"insecure_skip_tls_verify"`
}

type AuthConfig struct {
	BearerToken      string `yaml:"bearer_token"`
	Email            string `yaml:"email"`
	Password         string `yaml:"password"`
	SignupFirst      bool   `yaml:"signup_first"`
	LoginEndpoint    string `yaml:"login_endpoint"`
	SignupEndpoint   string `yaml:"signup_endpoint"`
	CheckAuthEndpoint string `yaml:"check_auth_endpoint"`
}

type SetupStep struct {
	Name     string            `yaml:"name"`
	Method   string            `yaml:"method"`
	Path     string            `yaml:"path"`
	Body     string            `yaml:"body"`
	Headers  map[string]string `yaml:"headers"`
	Optional bool              `yaml:"optional"`
	Capture  map[string]string `yaml:"capture"`
}

func LoadConfig(path string) (*Config, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := yaml.Unmarshal(content, &cfg); err != nil {
		return nil, err
	}
	if err := cfg.setDefaultsAndValidate(); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func (c *Config) setDefaultsAndValidate() error {
	if c.BaseURL == "" {
		return errors.New("base_url is required")
	}
	if len(c.Endpoints) == 0 {
		return errors.New("at least one endpoint is required")
	}
	if c.TimeoutMs <= 0 {
		c.TimeoutMs = 15000
	}
	for i := range c.Endpoints {
		if c.Endpoints[i].Method == "" {
			c.Endpoints[i].Method = "GET"
		}
		if c.Endpoints[i].Weight <= 0 {
			c.Endpoints[i].Weight = 1
		}
	}
	if c.Test.Mode == "" {
		c.Test.Mode = "fixed"
	}
	if c.Test.Concurrency <= 0 {
		c.Test.Concurrency = 10
	}
	if c.Test.DurationSec <= 0 {
		c.Test.DurationSec = 30
	}
	if c.Test.GlobalRateLimitPerSec < 0 {
		c.Test.GlobalRateLimitPerSec = 0
	}
	if c.Report.Formats == nil || len(c.Report.Formats) == 0 {
		c.Report.Formats = []string{"json", "md"}
	}
	if c.HTTP.MaxIdleConns <= 0 {
		c.HTTP.MaxIdleConns = 256
	}
	if c.HTTP.MaxIdleConnsPerHost <= 0 {
		c.HTTP.MaxIdleConnsPerHost = 256
	}
	if c.HTTP.IdleConnTimeoutMs <= 0 {
		c.HTTP.IdleConnTimeoutMs = 30000
	}
	// ramp defaults
	if c.Test.Step <= 0 {
		c.Test.Step = 10
	}
	if c.Test.StepDurationSec <= 0 {
		c.Test.StepDurationSec = 30
	}
	if c.Test.MaxConcurrency <= 0 {
		c.Test.MaxConcurrency = c.Test.Concurrency
	}
	if c.Test.MaxErrorRate <= 0 {
		c.Test.MaxErrorRate = 0.01
	}
	if c.Test.MaxP95Ms <= 0 {
		c.Test.MaxP95Ms = 1000
	}
	// auth defaults
	if c.Auth.LoginEndpoint == "" {
		c.Auth.LoginEndpoint = "/api/v1/auth/login"
	}
	if c.Auth.SignupEndpoint == "" {
		c.Auth.SignupEndpoint = "/api/v1/auth/signup"
	}
	if c.Auth.CheckAuthEndpoint == "" {
		c.Auth.CheckAuthEndpoint = "/api/v1/auth/check-auth"
	}
	return nil
}

func (c *Config) RequestTimeout() time.Duration {
	return time.Duration(c.TimeoutMs) * time.Millisecond
}


