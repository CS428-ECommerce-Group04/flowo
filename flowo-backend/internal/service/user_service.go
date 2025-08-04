package service

import (
	"context"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
	"fmt"

	"firebase.google.com/go/v4/auth"
)

type UserService interface {
	CreateUserFromFirebase(firebaseUID string, email string) (*model.User, error)
	GetUserByFirebaseUID(firebaseUID string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	GetCompleteUserInfo(firebaseUID string) (*CompleteUserInfo, error)
	UpdateUserFromFirebase(firebaseUID string) (*model.User, error)
	UpdateUserProfile(firebaseUID string, updateData *dto.UpdateProfileRequest) (*model.User, error)
}

type userService struct {
	userRepo     repository.UserRepository
	firebaseAuth *auth.Client
}

// CompleteUserInfo combines local database info with Firebase user data
type CompleteUserInfo struct {
	LocalUser    *model.User      `json:"local_user"`
	FirebaseUser *auth.UserRecord `json:"firebase_user"`
}

func NewUserService(userRepo repository.UserRepository, firebaseAuth *auth.Client) UserService {
	return &userService{
		userRepo:     userRepo,
		firebaseAuth: firebaseAuth,
	}
}

// CreateUserFromFirebase creates a local user record from Firebase user data
func (s *userService) CreateUserFromFirebase(firebaseUID string, email string) (*model.User, error) {
	// Check if user already exists in local database
	existingUser, err := s.userRepo.GetUserByFirebaseUID(firebaseUID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	if existingUser != nil {
		return existingUser, nil // User already exists
	}

	// Get additional info from Firebase if needed
	firebaseUser, err := s.firebaseAuth.GetUser(context.Background(), firebaseUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get Firebase user: %w", err)
	}

	// Create minimal user record in local database
	user := &model.User{
		FirebaseUID: firebaseUID,
		Email:       email,
		Username:    nil,               // Will be set later if user chooses a username
		FullName:    nil,               // Will be extracted from Firebase DisplayName if available
		Gender:      "Other",           // Default value
		Role:        "RegisteredBuyer", // Default role
	}

	// Set display name from Firebase if available
	if firebaseUser.DisplayName != "" {
		user.FullName = &firebaseUser.DisplayName
	}

	// Create user in database
	err = s.userRepo.CreateUser(user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user in database: %w", err)
	}

	return user, nil
}

// GetUserByFirebaseUID retrieves user from local database
func (s *userService) GetUserByFirebaseUID(firebaseUID string) (*model.User, error) {
	return s.userRepo.GetUserByFirebaseUID(firebaseUID)
}

// GetUserByEmail retrieves user from local database by email
func (s *userService) GetUserByEmail(email string) (*model.User, error) {
	return s.userRepo.GetUserByEmail(email)
}

// GetCompleteUserInfo retrieves both local and Firebase user information
func (s *userService) GetCompleteUserInfo(firebaseUID string) (*CompleteUserInfo, error) {
	// Get local user data
	localUser, err := s.userRepo.GetUserByFirebaseUID(firebaseUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get local user: %w", err)
	}

	if localUser == nil {
		return nil, fmt.Errorf("user not found in local database")
	}

	// Get Firebase user data
	firebaseUser, err := s.firebaseAuth.GetUser(context.Background(), firebaseUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get Firebase user: %w", err)
	}

	return &CompleteUserInfo{
		LocalUser:    localUser,
		FirebaseUser: firebaseUser,
	}, nil
}

// UpdateUserFromFirebase updates local user data from Firebase
func (s *userService) UpdateUserFromFirebase(firebaseUID string) (*model.User, error) {
	// Get current local user
	localUser, err := s.userRepo.GetUserByFirebaseUID(firebaseUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get local user: %w", err)
	}

	if localUser == nil {
		return nil, fmt.Errorf("user not found in local database")
	}

	// Get updated Firebase data
	firebaseUser, err := s.firebaseAuth.GetUser(context.Background(), firebaseUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get Firebase user: %w", err)
	}

	// Update local user with Firebase data
	if firebaseUser.Email != "" {
		localUser.Email = firebaseUser.Email
	}
	if firebaseUser.DisplayName != "" {
		localUser.FullName = &firebaseUser.DisplayName
	}

	// Save updated user
	err = s.userRepo.UpdateUser(localUser)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return localUser, nil
}

// UpdateUserProfile updates user profile information in the local database
func (s *userService) UpdateUserProfile(firebaseUID string, updateData *dto.UpdateProfileRequest) (*model.User, error) {
	// Get current local user
	localUser, err := s.userRepo.GetUserByFirebaseUID(firebaseUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get local user: %w", err)
	}

	if localUser == nil {
		return nil, fmt.Errorf("user not found in local database")
	}

	// Update fields if provided
	if updateData.Username != nil {
		localUser.Username = updateData.Username
	}
	if updateData.FullName != nil {
		localUser.FullName = updateData.FullName
	}
	if updateData.Gender != nil {
		localUser.Gender = *updateData.Gender
	}

	// Save updated user
	err = s.userRepo.UpdateUser(localUser)
	if err != nil {
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}

	return localUser, nil
}
