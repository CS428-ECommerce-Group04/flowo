package database

import (
	"database/sql"
	"fmt"
	"os"
	"flowo-backend/config"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func NewDB(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=latin1&parseTime=true&loc=Local&multiStatements=true",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
	)

	// Get retry configuration from environment or use defaults
	retryAttempts := 5
	retryDelay := 5

	if val, exists := os.LookupEnv("RETRY_ATTEMPTS"); exists {
		if num, err := strconv.Atoi(val); err == nil && num > 0 {
			retryAttempts = num
		}
	}

	if val, exists := os.LookupEnv("RETRY_DELAY"); exists {
		if num, err := strconv.Atoi(val); err == nil && num > 0 {
			retryDelay = num
		}
	}

	// Open DB once and ping with retries
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open DB: %v", err)
	}

	for attempt := 1; attempt <= retryAttempts; attempt++ {
		err = db.Ping()
		if err == nil {
			fmt.Printf("Successfully connected to database on attempt %d\n", attempt)
			return db, nil
		}

		fmt.Printf("[%s] Database connection attempt %d failed: %v. Retrying in %d seconds...\n",
			time.Now().Format(time.RFC3339), attempt, err, retryDelay)

		if attempt < retryAttempts {
			time.Sleep(time.Duration(retryDelay) * time.Second)
		}
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %v", retryAttempts, err)
}
