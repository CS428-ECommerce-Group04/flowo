package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"flowo-backend/config"
	"flowo-backend/internal/middleware"
	"flowo-backend/internal/utils"
)

// RegisterRoutes registers all auth routes
func (ac *AuthController) RegisterRoutes(rg *gin.RouterGroup, authMiddleware *middleware.AuthMiddleware) {
	auth := rg.Group("/auth")
	{
		// Public routes
		auth.POST("/signup", ac.SignUpHandler)
		auth.POST("/login", ac.LoginHandler)
		auth.POST("/verify", ac.VerifyToken)
	}
}

// AuthController handles authentication-related operations
type AuthController struct {
	firebaseAuth   *auth.Client
	firebaseAPIKey string
}

// NewAuthController creates a new auth controller
func NewAuthController(firebaseAuth *auth.Client, cfg *config.Config) *AuthController {
	return &AuthController{
		firebaseAuth:   firebaseAuth,
		firebaseAPIKey: cfg.Firebase.APIKey,
	}
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	Email       string `json:"email,omitempty"`
	DisplayName string `json:"display_name,omitempty"`
	PhoneNumber string `json:"phone_number,omitempty"`
	Disabled    *bool  `json:"disabled,omitempty"`
}

// UserResponse represents the user response
type UserResponse struct {
	UID         string `json:"uid"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	PhoneNumber string `json:"phone_number"`
	Disabled    bool   `json:"disabled"`
	CreatedAt   int64  `json:"created_at"`
}

// SignUpRequest represents the request body for signing up a user
type SignUpRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// SignUpResponse represents the response for signup
type SignUpResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest represents the request body for logging in a user
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// SessionInfo represents session information
type SessionInfo struct {
	SessionID string `json:"session_id"`
	ExpiresAt int64  `json:"expires_at"`
	CreatedAt int64  `json:"created_at"`
}

// LoginResponse represents the response for login
type LoginResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Token   string      `json:"token"`
	Session SessionInfo `json:"session"`
}

// SignUpHandler handles user signup process
// @Summary Sign up a new user
// @Description Validates email, checks if user exists, and sends password reset email for verification
// @Tags auth
// @Accept json
// @Produce json
// @Param user body SignUpRequest true "User signup data"
// @Success 200 {object} SignUpResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/v1/auth/signup [post]
func (ac *AuthController) SignUpHandler(c *gin.Context) {
	var req SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "bad_request",
			"message": err.Error(),
		})
		log.Error().Err(err).Msg("Failed to bind JSON for user signup")
		return
	}

	// Validate email format
	if err := utils.ValidateEmail(req.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "bad_request",
			"message": "Invalid email format",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Invalid email format")
		return
	}

	// Check if user already exists
	ctx := context.Background()
	existingUser, err := ac.firebaseAuth.GetUserByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		// User already exists
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "user_exists",
			"message": "User with this email already exists",
		})
		log.Warn().Str("email", req.Email).Msg("Attempted to signup with existing email")
		return
	}

	// Check if error is something other than user not found
	if err != nil && !auth.IsUserNotFound(err) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to check user existence",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Error checking user existence")
		return
	}

	// User doesn't exist, create a temporary user with a random password
	// and generate verification link (frontend will handle email sending)
	tempPassword, err := utils.GenerateSecurePassword(16)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to generate temporary password",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to generate temporary password")
		return
	}

	// Create user with temporary password and disabled state
	params := (&auth.UserToCreate{}).
		Email(req.Email).
		Password(tempPassword).
		EmailVerified(false).
		Disabled(false)

	_, err = ac.firebaseAuth.CreateUser(ctx, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to create user account",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to create user")
		return
	}
	response := SignUpResponse{
		Success:  true,
		Message:  "Account created successfully. Verification email will be sent.",
		Email:    req.Email,
		Password: tempPassword, // Include password for frontend to use
	}

	c.JSON(http.StatusOK, response)
	log.Info().Str("email", req.Email).Msg("Signup process initiated successfully")
}

// LoginHandler handles user login process using Firebase REST API
// @Summary Login user
// @Description Authenticates user with email and password using Firebase REST API and returns user information with session
// @Tags auth
// @Accept json
// @Produce json
// @Param user body LoginRequest true "User login data"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/v1/auth/login [post]
func (ac *AuthController) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "bad_request",
			"message": err.Error(),
		})
		log.Error().Err(err).Msg("Failed to bind JSON for user login")
		return
	}

	// Get Firebase API key from config
	if ac.firebaseAPIKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "configuration_error",
			"message": "Firebase API key not configured",
		})
		log.Error().Msg("Firebase API key not configured in application config")
		return
	}

	loginPayload := map[string]interface{}{
		"email":             req.Email,
		"password":          req.Password,
		"returnSecureToken": true,
	}

	loginData, err := json.Marshal(loginPayload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to prepare authentication request",
		})
		log.Error().Err(err).Msg("Failed to marshal login payload")
		return
	}

	firebaseLoginURL := "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + ac.firebaseAPIKey

	// Make HTTP request to Firebase
	resp, err := http.Post(firebaseLoginURL, "application/json", bytes.NewBuffer(loginData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to authenticate with Firebase",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to send request to Firebase")
		return
	}
	defer resp.Body.Close()

	// Parse Firebase response
	var firebaseResp map[string]interface{}

	if err := json.NewDecoder(resp.Body).Decode(&firebaseResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to parse authentication response",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to decode Firebase response")
		return
	}
	// Log response
	log.Debug().Interface("firebase_response", firebaseResp).Msg("Firebase authentication response")

	// Handle authentication errors
	if resp.StatusCode != http.StatusOK {
		errorMessage := "Authentication failed"
		if errorObj, ok := firebaseResp["error"]; ok {
			if errorMap, ok := errorObj.(map[string]interface{}); ok {
				if message, ok := errorMap["message"].(string); ok {
					switch message {
					case "EMAIL_NOT_FOUND":
						errorMessage = "Invalid email or password"
					case "INVALID_PASSWORD":
						errorMessage = "Invalid email or password"
					case "USER_DISABLED":
						errorMessage = "User account is disabled"
					case "TOO_MANY_ATTEMPTS_TRY_LATER":
						errorMessage = "Too many failed attempts. Please try again later"
					default:
						errorMessage = "Authentication failed"
					}
				}
			}
		}

		statusCode := http.StatusUnauthorized
		if resp.StatusCode >= 500 {
			statusCode = http.StatusInternalServerError
		}

		c.JSON(statusCode, gin.H{
			"error":   "authentication_failed",
			"message": errorMessage,
		})
		log.Warn().Str("email", req.Email).Int("firebase_status", resp.StatusCode).Msg("Firebase authentication failed")
		return
	}


	// Generate session cookie
	expiresIn := time.Hour * 24
	sessionCookie, err := ac.firebaseAuth.SessionCookie(c, firebaseResp["idToken"].(string), expiresIn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to generate session cookie",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to create session cookie")
		return
	}


	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("session_id", sessionCookie, int(expiresIn.Seconds()), "/", "", true, true)


	response := make(map[string]string)
	response["message"] = "Login successful"
	response["authorized"] = "true"
	response["email"] = req.Email

	response["token"] = firebaseResp["idToken"].(string)
	response["session_id"] = sessionCookie

	c.JSON(http.StatusOK, response)

}

// VerifyToken verifies a Firebase ID token
// @Summary Verify Firebase ID token
// @Description Verify the provided Firebase ID token
// @Tags auth
// @Accept json
// @Produce json
// @Param token body map[string]string true "Token to verify"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/auth/verify [post]
func (ac *AuthController) VerifyToken(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "bad_request",
			"message": "Invalid request body",
		})
		return
	}

	idToken, exists := req["token"]
	if !exists || idToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "bad_request",
			"message": "Token is required",
		})
		return
	}

	token, err := ac.firebaseAuth.VerifyIDToken(context.Background(), idToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "Invalid or expired token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":  true,
		"uid":    token.UID,
		"claims": token.Claims,
	})
}
