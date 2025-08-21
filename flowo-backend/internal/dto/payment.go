package dto

import "encoding/json"

type CreatePaymentLinkRequest struct {
	OrderID   int    `json:"order_id" binding:"required"`
	ReturnURL string `json:"return_url" binding:"required"`
	CancelURL string `json:"cancel_url" binding:"required"`
}

type PaymentLinkResponse struct {
	CheckoutUrl   string `json:"checkout_url"`
	PaymentLinkId string `json:"payment_link_id"`
}

// PayOSWebhookRequest represents the structure PayOS posts to the webhook.
type PayOSWebhookRequest struct {
	Code      int             `json:"code"`
	Desc      string          `json:"desc"`
	Success   bool            `json:"success"`
	Data      json.RawMessage `json:"data"`
	Signature string          `json:"signature"`
}
