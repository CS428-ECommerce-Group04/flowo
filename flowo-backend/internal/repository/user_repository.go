package repository

import (
	"database/sql"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"fmt"
	"strings"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	GetUserByFirebaseUID(firebaseUID string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(user *model.User) error
	CheckUserExists(firebaseUID string) (bool, error)
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

// CreateUser creates a new user record in the database with minimal Firebase info
func (r *userRepository) CreateUser(user *model.User) error {
	query := `
		INSERT INTO User (firebase_uid, username, email, full_name, gender, role, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
	`

	_, err := r.db.Exec(query,
		user.FirebaseUID,
		user.Username,
		user.Email,
		user.FullName,
		user.Gender,
		user.Role,
	)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByFirebaseUID retrieves a user by their Firebase UID
func (r *userRepository) GetUserByFirebaseUID(firebaseUID string) (*model.User, error) {
	user := &model.User{}
	query := `
		SELECT firebase_uid, username, email, full_name, gender, role, created_at, updated_at 
		FROM User 
		WHERE firebase_uid = ?
	`

	err := r.db.QueryRow(query, firebaseUID).Scan(
		&user.FirebaseUID,
		&user.Username,
		&user.Email,
		&user.FullName,
		&user.Gender,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // User not found
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user by Firebase UID: %w", err)
	}

	return user, nil
}

// GetUserByEmail retrieves a user by their email address
func (r *userRepository) GetUserByEmail(email string) (*model.User, error) {
	user := &model.User{}
	query := `
		SELECT firebase_uid, username, email, full_name, gender, role, created_at, updated_at 
		FROM User 
		WHERE email = ?
	`

	err := r.db.QueryRow(query, email).Scan(
		&user.FirebaseUID,
		&user.Username,
		&user.Email,
		&user.FullName,
		&user.Gender,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // User not found
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return user, nil
}

// UpdateUser updates user information in the database
func (r *userRepository) UpdateUser(user *model.User) error {
	query := `
		UPDATE User 
		SET username = ?, email = ?, full_name = ?, gender = ?, role = ?, updated_at = NOW() 
		WHERE firebase_uid = ?
	`

	_, err := r.db.Exec(query,
		user.Username,
		user.Email,
		user.FullName,
		user.Gender,
		user.Role,
		user.FirebaseUID,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// CheckUserExists checks if a user exists by Firebase UID
func (r *userRepository) CheckUserExists(firebaseUID string) (bool, error) {
	var count int
	query := "SELECT COUNT(*) FROM User WHERE firebase_uid = ?"

	err := r.db.QueryRow(query, firebaseUID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}

	return count > 0, nil
}
