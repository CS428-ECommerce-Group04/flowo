package dto

import "time"

// UserResponse represents the response structure for user information
type UserResponse struct {
	FirebaseUID string    `json:"firebase_uid"`
	Email       string    `json:"email"`
	Username    *string   `json:"username"`
	FullName    *string   `json:"full_name"`
	Gender      string    `json:"gender"`
	Role        string    `json:"role"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// UpdateProfileRequest represents the request structure for updating user profile
type UpdateProfileRequest struct {
	Username *string `json:"username"`
	FullName *string `json:"full_name"`
	Gender   *string `json:"gender" binding:"omitempty,oneof=Male Female Other"`
}

// CompleteUserResponse combines local and Firebase user information
type CompleteUserResponse struct {
	LocalUser    *UserResponse     `json:"local_user"`
	FirebaseInfo *FirebaseUserInfo `json:"firebase_info"`
}

// FirebaseUserInfo represents Firebase user information
type FirebaseUserInfo struct {
	UID           string `json:"uid"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	DisplayName   string `json:"display_name,omitempty"`
	PhotoURL      string `json:"photo_url,omitempty"`
	Disabled      bool   `json:"disabled"`
	CreatedAt     string `json:"created_at"`
	LastLoginAt   string `json:"last_login_at,omitempty"`
}
