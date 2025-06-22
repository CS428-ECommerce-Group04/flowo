package cache

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

type RedisCache struct {
	Client *redis.Client
}

func NewRedisCache(addr string, password string, db int) *RedisCache {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	if err := rdb.Ping(Ctx).Err(); err != nil {
		log.Fatalf(" Redis connection failed: %v", err)
	}

	log.Println(" Connected to Redis")
	return &RedisCache{Client: rdb}
}

func (r *RedisCache) Set(key string, value string, ttl time.Duration) error {
	return r.Client.Set(Ctx, key, value, ttl).Err()
}

func (r *RedisCache) Get(key string) (string, error) {
	return r.Client.Get(Ctx, key).Result()
}

func (r *RedisCache) Delete(key string) error {
	return r.Client.Del(Ctx, key).Err()
}
func ProvideRedisCache() *RedisCache {
	addr := os.Getenv("REDIS_ADDR")
	password := os.Getenv("REDIS_PASSWORD")
	return NewRedisCache(addr, password, 0)
}
