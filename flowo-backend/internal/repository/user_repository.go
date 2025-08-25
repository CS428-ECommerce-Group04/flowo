package repository

import (
	"database/sql"
	"flowo-backend/internal/model"
	"fmt"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	GetUserByFirebaseUID(firebaseUID string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(user *model.User) error
	CheckUserExists(firebaseUID string) (bool, error)
	GetAllUsers() ([]*model.UserWithAddress, error)
	SoftDeleteUser(firebaseUID string) error
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

// CreateUser
func (r *userRepository) CreateUser(user *model.User) error {
	query := `
		INSERT INTO User (firebase_uid, username, email, full_name, gender, role, created_at, updated_at, is_deleted) 
		VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), FALSE)
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

// GetUserByFirebaseUID
func (r *userRepository) GetUserByFirebaseUID(firebaseUID string) (*model.User, error) {
	user := &model.User{}
	query := `
		SELECT firebase_uid, username, email, full_name, gender, role, created_at, updated_at 
		FROM User 
		WHERE firebase_uid = ? AND is_deleted = FALSE
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
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by Firebase UID: %w", err)
	}
	return user, nil
}

// GetUserByEmail
func (r *userRepository) GetUserByEmail(email string) (*model.User, error) {
	user := &model.User{}
	query := `
		SELECT firebase_uid, username, email, full_name, gender, role, created_at, updated_at 
		FROM User 
		WHERE email = ? AND is_deleted = FALSE
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
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return user, nil
}

// UpdateUser
func (r *userRepository) UpdateUser(user *model.User) error {
	query := `
		UPDATE User 
		SET username = ?, email = ?, full_name = ?, gender = ?, role = ?, updated_at = NOW() 
		WHERE firebase_uid = ? AND is_deleted = FALSE
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

// CheckUserExists
func (r *userRepository) CheckUserExists(firebaseUID string) (bool, error) {
	var count int
	query := "SELECT COUNT(*) FROM User WHERE firebase_uid = ? AND is_deleted = FALSE"
	err := r.db.QueryRow(query, firebaseUID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}
	return count > 0, nil
}

// SoftDeleteUser
func (r *userRepository) SoftDeleteUser(firebaseUID string) error {
	query := `
		UPDATE User 
		SET is_deleted = TRUE, updated_at = NOW() 
		WHERE firebase_uid = ?
	`
	_, err := r.db.Exec(query, firebaseUID)
	if err != nil {
		return fmt.Errorf("failed to soft delete user: %w", err)
	}
	return nil
}

// GetAllUsers
func (r *userRepository) GetAllUsers() ([]*model.UserWithAddress, error) {
	query := `
		SELECT 
			u.firebase_uid, u.username, u.email, u.full_name, u.gender, u.role, u.created_at, u.updated_at,
			a.address_id, a.recipient_name, a.phone_number, a.street_address, a.city, a.postal_code, a.country
		FROM User u
		LEFT JOIN Address a 
			ON u.firebase_uid = a.firebase_uid AND a.is_default_shipping = true
		WHERE u.is_deleted = FALSE
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query users with addresses: %w", err)
	}
	defer rows.Close()

	var users []*model.UserWithAddress
	for rows.Next() {
		var user model.UserWithAddress
		var username, fullname sql.NullString
		var addressID sql.NullInt64
		var recipientName, phoneNumber, streetAddress, city, postalCode, country sql.NullString

		err := rows.Scan(
			&user.FirebaseUID,
			&username,
			&user.Email,
			&fullname,
			&user.Gender,
			&user.Role,
			&user.CreatedAt,
			&user.UpdatedAt,
			&addressID,
			&recipientName,
			&phoneNumber,
			&streetAddress,
			&city,
			&postalCode,
			&country,
		)
		if err != nil {
			return nil, err
		}

		if username.Valid {
			user.Username = &username.String
		}
		if fullname.Valid {
			user.FullName = &fullname.String
		}

		if addressID.Valid {
			user.DefaultAddress = &model.Address{
				AddressID:     int(addressID.Int64),
				FirebaseUID:   user.FirebaseUID,
				RecipientName: recipientName.String,
				PhoneNumber:   phoneNumber.String,
				StreetAddress: streetAddress.String,
				City:          city.String,
				PostalCode:    postalCode.String,
				Country:       country.String,
			}
		}

		users = append(users, &user)
	}
	return users, nil
}
