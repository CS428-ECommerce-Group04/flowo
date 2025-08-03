package model

import "time"

type Order struct {
	OrderID           int       `json:"order_id"`
	UserID            int       `json:"user_id"`
	ShippingAddressID int       `json:"shipping_address_id"`
	BillingAddressID  int       `json:"billing_address_id"`
	OrderDate         time.Time `json:"order_date"`
	Status            string    `json:"status"`
	SubtotalAmount    float64   `json:"subtotal_amount"`
	DiscountAmount    float64   `json:"discount_amount"`
	ShippingCost      float64   `json:"shipping_cost"`
	FinalTotalAmount  float64   `json:"final_total_amount"`
	ShippingMethod    string    `json:"shipping_method"`
	Notes             string    `json:"notes"`
}

type OrderItem struct {
	OrderItemID            int     `json:"order_item_id"`
	OrderID                int     `json:"order_id"`
	ProductID              int     `json:"product_id"`
	Quantity               int     `json:"quantity"`
	PricePerUnitAtPurchase float64 `json:"price_per_unit_at_purchase"`
	ItemSubtotal           float64 `json:"item_subtotal"`
}
