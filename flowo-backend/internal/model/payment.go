package model

import "time"

type Payment struct {
	PaymentID     int       `json:"payment_id"`
	OrderID       int       `json:"order_id"`
	PaymentMethod string    `json:"payment_method"`
	PaymentStatus string    `json:"payment_status"`
	TransactionID string    `json:"transaction_id"`
	PaymentLinkID string    `json:"payment_link_id"`
	CheckoutUrl   string    `json:"checkout_url"`
	RawWebhook    string    `json:"raw_webhook"`
	AmountPaid    float64   `json:"amount_paid"`
	PaymentDate   time.Time `json:"payment_date"`
}
