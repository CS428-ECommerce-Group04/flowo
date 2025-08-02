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
		var token *auth.Token
		var err error

		// Try session cookie first
		if sessionCookie, cookieErr := c.Cookie("session_id"); cookieErr == nil && sessionCookie != "" {
			token, err = m.firebaseAuth.VerifySessionCookie(context.Background(), sessionCookie)
			if err != nil {
				// Clear invalid cookie
				c.SetCookie("session_id", "", -1, "/", "", false, true)
			}
		}

		// If session cookie failed, try Authorization header
		if token == nil {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":   "unauthorized",
					"message": "Authentication required",
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
			token, err = m.firebaseAuth.VerifyIDToken(context.Background(), idToken)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":   "unauthorized",
					"message": "Invalid or expired token",
				})
				c.Abort()
				return
			}
		}

		// If we still don't have a valid token
		if token == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Authentication required",
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

// RequireSessionAuth middleware that requires valid session cookie authentication
func (m *AuthMiddleware) RequireSessionAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get session cookie
		sessionCookie, err := c.Cookie("session_id")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Session cookie required",
			})
			c.Abort()
			return
		}

		// Verify session cookie
		token, err := m.firebaseAuth.VerifySessionCookie(context.Background(), sessionCookie)
		if err != nil {
			// Clear invalid cookie
			c.SetCookie("session_id", "", -1, "/", "", false, true)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Invalid or expired session",
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
