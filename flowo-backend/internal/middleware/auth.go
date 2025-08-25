package middleware

import (
	"context"
	"net/http"
	"strings"
	"os"

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
		// Test bypass: allow setting a fake user via header when AUTH_BYPASS=1 (non-production only)
		if os.Getenv("AUTH_BYPASS") == "1" {
			uid := c.GetHeader("X-Test-UID")
			if uid == "" {
				uid = "firebase_uid_john_doe"
			}
			c.Set("firebase_uid", uid)
			c.Set("user_email", "")
			c.Next()
			return
		}

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
		c.Set("firebase_uid", token.UID)
		c.Set("user_email", token.Claims["email"])
		c.Set("firebase_token", token)

		c.Next()
	}
}

// GetFirebaseUserID gets the Firebase user ID from the context
func GetFirebaseUserID(c *gin.Context) (string, bool) {
	firebaseUID, exists := c.Get("firebase_uid")
	if !exists {
		return "", false
	}

	uid, ok := firebaseUID.(string)
	return uid, ok
}
