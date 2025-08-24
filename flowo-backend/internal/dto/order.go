package dto

import "time"

type OrderResponse struct {
	OrderID        int     `json:"order_id"`
	Status         string  `json:"status"`
	OrderDate      string  `json:"order_date"`
	TotalAmount    float64 `json:"total_amount"`
	ShippingMethod string  `json:"shipping_method"`
}

type UpdateOrderStatusRequest struct {
	Status         string `json:"status" binding:"required"`
	ShippingMethod string `json:"shipping_method,omitempty"`
}

type CreateOrderRequest struct {
	//ShippingAddressID int  `json:"shipping_address_id" binding:"required"`
	BillingAddressID *int   `json:"billing_address_id,omitempty"` // optional
	ShippingMethod   string `json:"shipping_method" binding:"required"`
	Notes            string `json:"notes"`
}

type OrderItemRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required"`
}

type OrderDetailResponse struct {
	OrderID        int               `json:"order_id"`
	Status         string            `json:"status"`
	OrderDate      time.Time         `json:"order_date"`
	TotalAmount    float64           `json:"total_amount"`
	ShippingMethod string            `json:"shipping_method"`
	Items          []OrderItemDetail `json:"items"`

	ShippingAddress *AddressResponse `json:"shipping_address,omitempty"`
}

type OrderItemDetail struct {
	ProductID int     `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	Subtotal  float64 `json:"subtotal"`
}

type AdminOrderResponse struct {
	OrderID     int       `json:"order_id"`
	FirebaseUID string    `json:"firebase_uid"`
	TotalAmount float64   `json:"total_amount"`
	Status      string    `json:"status"`
	OrderDate   time.Time `json:"order_date"`
}

type AdminOrderDetailResponse struct {
	OrderID        int       `json:"order_id"`
	Status         string    `json:"status"`
	OrderDate      time.Time `json:"order_date"`
	TotalAmount    float64   `json:"total_amount"`
	ShippingMethod string    `json:"shipping_method"`

	CustomerName  string `json:"customer_name"`
	CustomerEmail string `json:"customer_email"`

	Items []OrderItemDetail `json:"items"`
}

// OrderStatusResponse is a minimal response used by frontend to poll order status
type OrderStatusResponse struct {
	OrderID int    `json:"order_id"`
	Status  string `json:"status"`
}
