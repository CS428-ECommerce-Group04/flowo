package middleware

import (
	"context"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"

)

// AuthMiddleware represents the authentication middleware
type AuthMiddleware struct {
	firebaseAuth *auth.Client
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(firebaseAuth *auth.Client) *AuthMiddleware {
	return &AuthMiddleware{
		firebaseAuth: firebaseAuth,
	}
}

// RequireAuth middleware that requires valid Firebase authentication
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Extract the token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		idToken := tokenParts[1]

		// Verify the Firebase ID token
		token, err := m.firebaseAuth.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store user information in the context
		c.Set("user_id", token.UID)
		c.Set("user_email", token.Claims["email"])
		c.Set("firebase_token", token)

		c.Next()
	}
}

// OptionalAuth middleware that optionally verifies Firebase authentication
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.Next()
			return
		}

		idToken := tokenParts[1]
		token, err := m.firebaseAuth.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			c.Next()
			return
		}

		// Store user information in the context if token is valid
		c.Set("user_id", token.UID)
		c.Set("user_email", token.Claims["email"])
		c.Set("firebase_token", token)

		c.Next()
	}
}

// GetUserID gets the user ID from the context
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}

	uid, ok := userID.(string)
	return uid, ok
}

// GetUserEmail gets the user email from the context
func GetUserEmail(c *gin.Context) (string, bool) {
	userEmail, exists := c.Get("user_email")
	if !exists {
		return "", false
	}

	email, ok := userEmail.(string)
	return email, ok
}

// GetFirebaseToken gets the Firebase token from the context
func GetFirebaseToken(c *gin.Context) (*auth.Token, bool) {
	token, exists := c.Get("firebase_token")
	if !exists {
		return nil, false
	}

	firebaseToken, ok := token.(*auth.Token)
	return firebaseToken, ok
}
