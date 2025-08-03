package model

import "time"

// User represents a user in the local database with minimal information
// Most user data is stored in Firebase and retrieved as needed
type User struct {
	UserID      int       `json:"user_id" db:"user_id"`
	FirebaseUID string    `json:"firebase_uid" db:"firebase_uid"` // Link to Firebase user
	Email       string    `json:"email" db:"email"`               // Cached for quick lookups
	Username    *string   `json:"username" db:"username"`         // Optional local username
	FullName    *string   `json:"full_name" db:"full_name"`       // Optional display name
	Gender      string    `json:"gender" db:"gender"`             // Default: 'Other'
	Role        string    `json:"role" db:"role"`                 // Default: 'RegisteredBuyer'
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
