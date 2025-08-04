package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"flowo-backend/config"
	"flowo-backend/internal/middleware"
	"flowo-backend/internal/service"
	"flowo-backend/internal/utils"
)

// RegisterRoutes registers all auth routes
func (ac *AuthController) RegisterRoutes(rg *gin.RouterGroup, authMiddleware *middleware.AuthMiddleware) {
	auth := rg.Group("/auth")
	{
		// Public routes
		auth.POST("/signup", ac.SignUpHandler)
		auth.POST("/login", ac.LoginHandler)
		auth.GET("/check-auth", ac.CheckAuthHandler)
		auth.POST("/forgot-password", ac.ForgotPasswordHandler)

		// Protected routes - require authentication
		protected := auth.Group("/")
		protected.Use(authMiddleware.RequireAuth()) // This will check session cookie first, then Bearer token
		{
			protected.POST("/logout", ac.LogoutHandler)
		}
	}
}

// AuthController handles authentication-related operations
type AuthController struct {
	firebaseAuth   *auth.Client
	firebaseAPIKey string
	IsProduction   bool
	userService    service.UserService
}

// NewAuthController creates a new auth controller
func NewAuthController(firebaseAuth *auth.Client, cfg *config.Config, userService service.UserService) *AuthController {
	return &AuthController{
		firebaseAuth:   firebaseAuth,
		firebaseAPIKey: cfg.Firebase.APIKey,
		IsProduction:   cfg.IsProduction,
		userService:    userService,
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
	Session SessionInfo `json:"session"`
}

// ForgotPasswordRequest represents the request body for forgot password
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ForgotPasswordResponse represents the response for forgot password
type ForgotPasswordResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Email   string `json:"email"`
}

// SignUpHandler handles user signup process
// @Summary Sign up a new user
// @Description Validates email, creates Firebase user with temporary password, and automatically sends password reset email
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

	firebaseUser, err := ac.firebaseAuth.CreateUser(ctx, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to create user account",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to create user")
		return
	}

	// Create user record in local database with minimal Firebase information
	localUser, err := ac.userService.CreateUserFromFirebase(firebaseUser.UID, req.Email)
	if err != nil {
		// Attempt to clean up the Firebase user to maintain consistency
		cleanupErr := ac.firebaseAuth.DeleteUser(ctx, firebaseUser.UID)
		if cleanupErr != nil {
			log.Error().Err(err).Str("email", req.Email).Str("firebase_uid", firebaseUser.UID).Msg("Failed to create user in local database")
			log.Error().Err(cleanupErr).Str("email", req.Email).Str("firebase_uid", firebaseUser.UID).Msg("Failed to clean up Firebase user after local DB creation failure")
		} else {
			log.Error().Err(err).Str("email", req.Email).Str("firebase_uid", firebaseUser.UID).Msg("Failed to create user in local database; Firebase user deleted for cleanup")
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to create user account",
		})
		return
	} else {
		log.Info().Str("email", req.Email).Str("firebase_uid", firebaseUser.UID).Int("user_id", localUser.UserID).Msg("User created successfully in both Firebase and local database")
	}

	// Send password reset email using Firebase REST API
	if err := ac.sendPasswordResetEmail(req.Email); err != nil {
		// User is created but email failed - log warning but don't fail the signup
		log.Warn().Err(err).Str("email", req.Email).Msg("Failed to send password reset email after signup")

		// Still return success but with a different message
		response := SignUpResponse{
			Success:  true,
			Message:  "Account created successfully. Please try to reset your password using the forgot password option.",
			Email:    req.Email,
			Password: tempPassword, // Include password for reference
		}
		c.JSON(http.StatusOK, response)
		log.Info().Str("email", req.Email).Msg("Signup completed but password reset email failed")
		return
	}

	response := SignUpResponse{
		Success:  true,
		Message:  "Account created successfully. Password reset email has been sent to your email address.",
		Email:    req.Email,
		Password: tempPassword, // Include password for reference, but user should use email reset
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
	expiresIn := time.Hour * 24 * 5 // 5 days

	idToken, ok := firebaseResp["idToken"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_response",
			"message": "Invalid or missing idToken in authentication response",
		})
		log.Error().Str("email", req.Email).Msg("idToken is missing or not a string in Firebase response")
		return
	}
	sessionCookie, err := ac.firebaseAuth.SessionCookie(c, idToken, expiresIn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to generate session cookie",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to create session cookie")
		return
	}

	// Set secure cookie
	secure := ac.IsProduction                                                                 // Use config to determine if secure flag should be set
	c.SetCookie("session_id", sessionCookie, int(expiresIn.Seconds()), "/", "", secure, true) // Set secure flag based on environment

	// Return response without tokens (security best practice)
	response := LoginResponse{
		Success: true,
		Message: "Login successful",
		Session: SessionInfo{
			SessionID: "",
			ExpiresAt: time.Now().Add(expiresIn).Unix(),
			CreatedAt: time.Now().Unix(),
		},
	}

	c.JSON(http.StatusOK, response)
	log.Info().Str("email", req.Email).Msg("User logged in successfully")

}

// CheckAuthHandler verifies the session cookie and returns user information
// @Summary Check authentication status
// @Description Verify session cookie and return user information if authenticated
// @Tags auth
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/auth/check-auth [get]
func (ac *AuthController) CheckAuthHandler(c *gin.Context) {
	// Get session cookie
	sessionCookie, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":         "unauthorized",
			"message":       "No session found",
			"authenticated": false,
		})
		return
	}

	// Verify session cookie
	decoded, err := ac.firebaseAuth.VerifySessionCookie(context.Background(), sessionCookie)
	if err != nil {
		// Clear invalid cookie
		c.SetCookie("session_id", "", -1, "/", "", false, true)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":         "unauthorized",
			"message":       "Invalid or expired session",
			"authenticated": false,
		})
		log.Warn().Err(err).Msg("Invalid session cookie")
		return
	}

	// Get user information from Firebase
	userRecord, err := ac.firebaseAuth.GetUser(context.Background(), decoded.UID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":         "internal_server_error",
			"message":       "Failed to get user information",
			"authenticated": false,
		})
		log.Error().Err(err).Str("uid", decoded.UID).Msg("Failed to get user record")
		return
	}

	// Ensure user exists in local database (create if doesn't exist)
	localUser, err := ac.userService.GetUserByFirebaseUID(decoded.UID)
	if err != nil {
		log.Error().Err(err).Str("uid", decoded.UID).Msg("Failed to get local user record")
	} else if localUser == nil {
		// User doesn't exist in local database, create them
		localUser, err = ac.userService.CreateUserFromFirebase(decoded.UID, userRecord.Email)
		if err != nil {
			log.Error().Err(err).Str("uid", decoded.UID).Str("email", userRecord.Email).Msg("Failed to create user in local database during auth check")
		} else {
			log.Info().Str("uid", decoded.UID).Str("email", userRecord.Email).Int("user_id", localUser.UserID).Msg("Created local user record during auth check")
		}
	}

	log.Info().Str("uid", decoded.UID).Str("email", userRecord.Email).Msg("User session verified successfully")

	// Build response with both Firebase and local user information
	userResponse := gin.H{
		"uid":            decoded.UID,
		"email":          userRecord.Email,
		"display_name":   userRecord.DisplayName,
		"email_verified": userRecord.EmailVerified,
	}

	// Add local user ID if available
	if localUser != nil {
		userResponse["local_user_id"] = localUser.UserID
		userResponse["role"] = localUser.Role
	}

	c.JSON(http.StatusOK, gin.H{
		"authenticated": true,
		"user":          userResponse,
		"session": gin.H{
			"expires_at": decoded.Expires,
			"issued_at":  decoded.IssuedAt,
		},
	})
}

// LogoutHandler clears the session cookie
// @Summary Logout user
// @Description Clear session cookie and logout user (requires authentication)
// @Tags auth
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/auth/logout [post]
func (ac *AuthController) LogoutHandler(c *gin.Context) {
	// Get user information from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if exists {
		log.Info().Str("user_id", userID.(string)).Msg("User initiated logout")
	}

	// Clear the session cookie
	c.SetCookie("session_id", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})

	log.Info().Msg("User logged out successfully")
}

// sendPasswordResetEmail sends a password reset email using Firebase REST API
func (ac *AuthController) sendPasswordResetEmail(email string) error {
	// Prepare the password reset request payload
	resetPayload := map[string]interface{}{
		"requestType": "PASSWORD_RESET",
		"email":       email,
	}

	resetData, err := json.Marshal(resetPayload)
	if err != nil {
		return fmt.Errorf("failed to marshal password reset payload: %w", err)
	}

	// Firebase REST API endpoint for sending password reset email
	firebaseResetURL := "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" + ac.firebaseAPIKey

	// Make HTTP request to Firebase
	resp, err := http.Post(firebaseResetURL, "application/json", bytes.NewBuffer(resetData))
	if err != nil {
		return fmt.Errorf("failed to send request to Firebase: %w", err)
	}
	defer resp.Body.Close()

	// Check for successful response
	if resp.StatusCode == http.StatusOK {
		log.Info().Str("email", email).Msg("Password reset email sent successfully")
		return nil
	}

	// Handle Firebase API errors
	var firebaseResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&firebaseResp); err != nil {
		return fmt.Errorf("failed to decode Firebase response, status: %d", resp.StatusCode)
	}

	// Extract error message from Firebase response
	errorMessage := "Failed to send password reset email"
	if errorObj, ok := firebaseResp["error"]; ok {
		if errorMap, ok := errorObj.(map[string]interface{}); ok {
			if message, ok := errorMap["message"].(string); ok {
				errorMessage = message
			}
		}
	}

	return fmt.Errorf("firebase API error (status %d): %s", resp.StatusCode, errorMessage)
}

// ForgotPasswordHandler handles forgot password requests
// @Summary Send password reset email
// @Description Send a password reset email to the user's email address
// @Tags auth
// @Accept json
// @Produce json
// @Param user body ForgotPasswordRequest true "Forgot password data"
// @Success 200 {object} ForgotPasswordResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/v1/auth/forgot-password [post]
func (ac *AuthController) ForgotPasswordHandler(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "bad_request",
			"message": err.Error(),
		})
		log.Error().Err(err).Msg("Failed to bind JSON for forgot password")
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

	// Check if user exists
	ctx := context.Background()
	userRecord, err := ac.firebaseAuth.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if auth.IsUserNotFound(err) {
			// For security reasons, don't reveal if email exists or not
			// Return success message even if user doesn't exist
			response := ForgotPasswordResponse{
				Success: true,
				Message: "If an account with this email exists, a password reset email has been sent.",
				Email:   req.Email,
			}
			c.JSON(http.StatusOK, response)
			log.Info().Str("email", req.Email).Msg("Password reset requested for non-existent user")
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "Failed to check user existence",
		})
		log.Error().Err(err).Str("email", req.Email).Msg("Error checking user existence")
		return
	}

	// Send password reset email using the helper method
	if err := ac.sendPasswordResetEmail(req.Email); err != nil {
		// Log the actual error for debugging
		log.Error().Err(err).Str("email", req.Email).Msg("Failed to send password reset email")

		// For security, still return success for EMAIL_NOT_FOUND errors
		if strings.Contains(err.Error(), "EMAIL_NOT_FOUND") {
			response := ForgotPasswordResponse{
				Success: true,
				Message: "If an account with this email exists, a password reset email has been sent.",
				Email:   req.Email,
			}
			c.JSON(http.StatusOK, response)
			log.Info().Str("email", req.Email).Msg("Password reset requested for non-existent user (Firebase)")
			return
		}

		// For other errors, return appropriate error response
		statusCode := http.StatusBadRequest
		if strings.Contains(err.Error(), "status 5") { // 5xx errors
			statusCode = http.StatusInternalServerError
		}

		c.JSON(statusCode, gin.H{
			"error":   "password_reset_failed",
			"message": "Failed to send password reset email",
		})
		return
	}

	// Success - password reset email sent
	response := ForgotPasswordResponse{
		Success: true,
		Message: "Password reset email sent successfully. Please check your inbox and follow the instructions.",
		Email:   req.Email,
	}

	c.JSON(http.StatusOK, response)
	log.Info().Str("email", req.Email).Str("user_id", userRecord.UID).Msg("Password reset email sent successfully")
}
