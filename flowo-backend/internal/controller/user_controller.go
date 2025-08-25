package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/middleware"
	"flowo-backend/internal/model"
	"flowo-backend/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	UserService service.UserService
}

func NewUserController(userService service.UserService) *UserController {
	return &UserController{
		UserService: userService,
	}
}

func (ctrl *UserController) RegisterRoutes(rg *gin.RouterGroup, authMiddleware *middleware.AuthMiddleware) {
	userRoutes := rg.Group("/users")
	{
		// Protected routes that require authentication
		userRoutes.Use(authMiddleware.RequireAuth())
		userRoutes.GET("/profile", ctrl.GetUserProfile)
		userRoutes.PUT("/profile", ctrl.UpdateUserProfile)

		// Admin or specific access routes
		userRoutes.GET("/email/:email", ctrl.GetUserByEmail)
		userRoutes.GET("/uid/:uid", ctrl.GetUserByUID)
	}
	adminRoutes := rg.Group("/admin")
	{
		adminRoutes.Use(authMiddleware.RequireAuth())
		adminRoutes.GET("/users", ctrl.GetAllUsers)
		adminRoutes.DELETE("/users/:uid", ctrl.SoftDeleteUser)
	}
}

// GetUserProfile godoc
// @Summary Get current user profile
// @Description Get the profile information of the currently authenticated user
// @Tags users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} model.Response{data=dto.CompleteUserResponse}
// @Failure 401 {object} model.Response
// @Failure 404 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/users/profile [get]
func (ctrl *UserController) GetUserProfile(c *gin.Context) {
	// Get Firebase UID from the authenticated context
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, model.Response{
			Message: "Unauthorized: Firebase UID not found",
			Data:    nil,
		})
		return
	}

	// Get complete user information
	completeUserInfo, err := ctrl.UserService.GetCompleteUserInfo(firebaseUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Message: "Failed to get user profile: " + err.Error(),
			Data:    nil,
		})
		return
	}

	// Convert to response DTO
	response := ctrl.convertToCompleteUserResponse(completeUserInfo)

	c.JSON(http.StatusOK, model.Response{
		Message: "User profile retrieved successfully",
		Data:    response,
	})
}

// GetUserByEmail godoc
// @Summary Get user information by email
// @Description Get user information using email address
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param email path string true "User email"
// @Success 200 {object} model.Response{data=dto.UserResponse}
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 404 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/users/email/{email} [get]
func (ctrl *UserController) GetUserByEmail(c *gin.Context) {
	email := c.Param("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, model.Response{
			Message: "Email parameter is required",
			Data:    nil,
		})
		return
	}

	user, err := ctrl.UserService.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Message: "Failed to get user by email: " + err.Error(),
			Data:    nil,
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, model.Response{
			Message: "User not found",
			Data:    nil,
		})
		return
	}

	response := ctrl.convertToUserResponse(user)

	c.JSON(http.StatusOK, model.Response{
		Message: "User retrieved successfully",
		Data:    response,
	})
}

// GetUserByUID godoc
// @Summary Get user information by Firebase UID
// @Description Get user information using Firebase UID
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param uid path string true "Firebase UID"
// @Success 200 {object} model.Response{data=dto.UserResponse}
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 404 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/users/uid/{uid} [get]
func (ctrl *UserController) GetUserByUID(c *gin.Context) {
	uid := c.Param("uid")
	if uid == "" {
		c.JSON(http.StatusBadRequest, model.Response{
			Message: "UID parameter is required",
			Data:    nil,
		})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Message: "Failed to get user by UID: " + err.Error(),
			Data:    nil,
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, model.Response{
			Message: "User not found",
			Data:    nil,
		})
		return
	}

	response := ctrl.convertToUserResponse(user)

	c.JSON(http.StatusOK, model.Response{
		Message: "User retrieved successfully",
		Data:    response,
	})
}

// UpdateUserProfile godoc
// @Summary Update user profile
// @Description Update the profile information of the currently authenticated user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param profile body dto.UpdateProfileRequest true "Profile update data"
// @Success 200 {object} model.Response{data=dto.UserResponse}
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/users/profile [put]
func (ctrl *UserController) UpdateUserProfile(c *gin.Context) {
	// Get Firebase UID from the authenticated context
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, model.Response{
			Message: "Unauthorized: Firebase UID not found",
			Data:    nil,
		})
		return
	}

	var updateData dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, model.Response{
			Message: "Invalid request body: " + err.Error(),
			Data:    nil,
		})
		return
	}

	// Update user profile
	updatedUser, err := ctrl.UserService.UpdateUserProfile(firebaseUID, &updateData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Message: "Failed to update user profile: " + err.Error(),
			Data:    nil,
		})
		return
	}

	response := ctrl.convertToUserResponse(updatedUser)

	c.JSON(http.StatusOK, model.Response{
		Message: "User profile updated successfully",
		Data:    response,
	})
}

// GetAllUsers godoc
// @Summary Get all users with default address (admin only)
// @Description Retrieve all users and their default shipping address
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Success 200 {object} model.Response{data=[]model.UserWithAddress}
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/admin/users [get]
func (ctrl *UserController) GetAllUsers(c *gin.Context) {
	users, err := ctrl.UserService.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Message: "Failed to get users: " + err.Error(),
			Data:    nil,
		})
		return
	}

	c.JSON(http.StatusOK, model.Response{
		Message: "Users retrieved successfully",
		Data:    users,
	})
}

// SoftDeleteUser godoc
// @Summary Soft delete a user (admin only)
// @Description Mark user as deleted without removing data from DB
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param uid path string true "Firebase UID"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 404 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/admin/users/{uid} [delete]
func (ctrl *UserController) SoftDeleteUser(c *gin.Context) {
	uid := c.Param("uid")
	if uid == "" {
		c.JSON(http.StatusBadRequest, model.Response{
			Message: "UID parameter is required",
			Data:    nil,
		})
		return
	}

	err := ctrl.UserService.SoftDeleteUser(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Message: "Failed to soft delete user: " + err.Error(),
			Data:    nil,
		})
		return
	}

	c.JSON(http.StatusOK, model.Response{
		Message: "User soft deleted successfully",
		Data:    nil,
	})
}

// Helper function to convert model.User to dto.UserResponse
func (ctrl *UserController) convertToUserResponse(user *model.User) *dto.UserResponse {
	return &dto.UserResponse{
		FirebaseUID: user.FirebaseUID,
		Email:       user.Email,
		Username:    user.Username,
		FullName:    user.FullName,
		Gender:      user.Gender,
		Role:        user.Role,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
}

// Helper function to convert service.CompleteUserInfo to dto.CompleteUserResponse
func (ctrl *UserController) convertToCompleteUserResponse(info *service.CompleteUserInfo) *dto.CompleteUserResponse {
	var firebaseInfo *dto.FirebaseUserInfo
	if info.FirebaseUser != nil {
		firebaseInfo = &dto.FirebaseUserInfo{
			UID:           info.FirebaseUser.UID,
			Email:         info.FirebaseUser.Email,
			EmailVerified: info.FirebaseUser.EmailVerified,
			DisplayName:   info.FirebaseUser.DisplayName,
			PhotoURL:      info.FirebaseUser.PhotoURL,
			Disabled:      info.FirebaseUser.Disabled,
			CreatedAt:     time.Unix(info.FirebaseUser.UserMetadata.CreationTimestamp/1000, 0).Format("2006-01-02T15:04:05Z07:00"),
		}
		if info.FirebaseUser.UserMetadata.LastLogInTimestamp != 0 {
			lastLoginTime := time.Unix(info.FirebaseUser.UserMetadata.LastLogInTimestamp/1000, 0)
			firebaseInfo.LastLoginAt = lastLoginTime.Format("2006-01-02T15:04:05Z07:00")
		}
	}

	return &dto.CompleteUserResponse{
		LocalUser:    ctrl.convertToUserResponse(info.LocalUser),
		FirebaseInfo: firebaseInfo,
	}
}
