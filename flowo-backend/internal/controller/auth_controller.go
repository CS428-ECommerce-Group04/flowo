package controller

import (
	"context"
	"net/http"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"flowo-backend/internal/middleware"
	"flowo-backend/internal/utils"
)

// RegisterRoutes registers all auth routes
func (ac *AuthController) RegisterRoutes(rg *gin.RouterGroup, authMiddleware *middleware.AuthMiddleware) {
	auth := rg.Group("/auth")
	{
		// Public routes
		auth.POST("/signup", ac.SignUpHandler)
		auth.POST("/verify", ac.VerifyToken)
	}
}

// AuthController handles authentication-related operations
type AuthController struct {
	firebaseAuth *auth.Client
}

// NewAuthController creates a new auth controller
func NewAuthController(firebaseAuth *auth.Client) *AuthController {
	return &AuthController{
		firebaseAuth: firebaseAuth,
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
	Success bool   `json:"success"`
	Message string `json:"message"`
	Email   string `json:"email"`
	Password string `json:"password"`
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
		Success: true,
		Message: "Account created successfully. Verification email will be sent.",
		Email:   req.Email,
		Password: tempPassword, // Include password for frontend to use
	}

	c.JSON(http.StatusOK, response)
	log.Info().Str("email", req.Email).Msg("Signup process initiated successfully")
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

// CompleteSignupRequest represents the request for completing signup after email verification
type CompleteSignupRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}
