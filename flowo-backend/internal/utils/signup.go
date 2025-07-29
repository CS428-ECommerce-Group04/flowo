package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"time"
)

// GenerateSecurePassword generates a secure password of the specified length.
func GenerateSecurePassword(length int) (string, error) {
	if length < 8 {
		return "", errors.New("password length must be at least 8")
	}

	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

// ValidateEmail check email condition
func ValidateEmail(email string) error {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return errors.New("invalid email format")
	}
	if len(email) > 254 {
		return errors.New("email too long")
	}
	return nil
}

// ValidatePassword checks password strength
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasDigit := regexp.MustCompile(`\d`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[@$!%*?&]`).MatchString(password)

	if !hasLower {
		return errors.New("password must contain at least one lowercase letter")
	}
	if !hasUpper {
		return errors.New("password must contain at least one uppercase letter")
	}
	if !hasDigit {
		return errors.New("password must contain at least one digit")
	}
	if !hasSpecial {
		return errors.New("password must contain at least one special character (@$!%*?&)")
	}

	// Check for invalid characters
	validChars := regexp.MustCompile(`^[A-Za-z\d@$!%*?&]+$`)
	if !validChars.MatchString(password) {
		return errors.New("password contains invalid characters. Only letters, digits, and @$!%*?& are allowed")
	}

	return nil
}

// GenerateSessionID generates a unique session ID
func GenerateSessionID() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	// Add timestamp for uniqueness
	timestamp := time.Now().UnixNano()
	sessionData := fmt.Sprintf("%s-%d", base64.URLEncoding.EncodeToString(bytes), timestamp)

	// Hash the session data for security
	hash := sha256.Sum256([]byte(sessionData))
	return base64.URLEncoding.EncodeToString(hash[:]), nil
}

// GetSessionExpiration returns the session expiration time (24 hours from now)
func GetSessionExpiration() int64 {
	return time.Now().Add(24 * time.Hour).Unix()
}
