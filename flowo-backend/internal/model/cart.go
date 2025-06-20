package model

import "time"

type Cart struct {
	CartID    int       `json:"cart_id"`
	UserID    int       `json:"user_id"`
	SessionID string    `json:"session_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CartItem struct {
	CartItemID int       `json:"cart_item_id"`
	CartID     int       `json:"cart_id"`
	ProductID  int       `json:"product_id"`
	Quantity   int       `json:"quantity"`
	AddedAt    time.Time `json:"added_at"`
}
