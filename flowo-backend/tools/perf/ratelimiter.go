package main

import (
	"time"
)

type rateLimiter struct {
	ticker *time.Ticker
}

func newRateLimiter(rps int) *rateLimiter {
	if rps <= 0 {
		return nil
	}
	interval := time.Second / time.Duration(rps)
	if interval <= 0 {
		interval = time.Microsecond
	}
	return &rateLimiter{ticker: time.NewTicker(interval)}
}

func (rl *rateLimiter) Take() {
	if rl == nil {
		return
	}
	<-rl.ticker.C
}


