package model

import "time"

type Payment struct {
	PaymentID     int       `json:"payment_id"`
	OrderID       int       `json:"order_id"`
	PaymentMethod string    `json:"payment_method"` // 'COD', 'Paypal', 'VNPAY'
	PaymentStatus string    `json:"payment_status"` // 'Pending', 'Success', 'Failed', 'Refunded'
	TransactionID string    `json:"transaction_id"`
	AmountPaid    float64   `json:"amount_paid"`
	PaymentDate   time.Time `json:"payment_date"`
}

// VNPay transaction details
type VNPayTransaction struct {
	TxnRef     string  `json:"txn_ref"`     // Unique transaction reference
	Amount     float64 `json:"amount"`      // Amount in VND
	OrderInfo  string  `json:"order_info"`  // Order description
	ReturnURL  string  `json:"return_url"`  // Return URL after payment
	IPAddr     string  `json:"ip_addr"`     // Customer IP address
	CreateDate string  `json:"create_date"` // Transaction creation date
	ExpireDate string  `json:"expire_date"` // Transaction expiration date
}

// VNPay response from payment gateway
type VNPayResponse struct {
	ResponseCode    string `json:"vnp_ResponseCode"`
	TransactionNo   string `json:"vnp_TransactionNo"`
	BankCode        string `json:"vnp_BankCode"`
	Amount          string `json:"vnp_Amount"`
	PayDate         string `json:"vnp_PayDate"`
	TransactionType string `json:"vnp_TransactionType"`
	SecureHash      string `json:"vnp_SecureHash"`
}
