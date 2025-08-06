package dto

type CreatePaymentRequest struct {
	OrderID       int     `json:"order_id" binding:"required"`
	PaymentMethod string  `json:"payment_method" binding:"required"` // 'COD', 'Paypal', 'VNPAY'
	Amount        float64 `json:"amount" binding:"required"`
	ReturnURL     string  `json:"return_url,omitempty"` // Required for online payments
}

type PaymentResponse struct {
	PaymentID     int     `json:"payment_id"`
	OrderID       int     `json:"order_id"`
	PaymentMethod string  `json:"payment_method"`
	PaymentStatus string  `json:"payment_status"`
	TransactionID string  `json:"transaction_id,omitempty"`
	AmountPaid    float64 `json:"amount_paid"`
	PaymentDate   string  `json:"payment_date"`
	PaymentURL    string  `json:"payment_url,omitempty"` // For redirect-based payments like VNPay
}

type VNPayPaymentRequest struct {
	OrderID   int     `json:"order_id" binding:"required"`
	Amount    float64 `json:"amount" binding:"required"`
	OrderInfo string  `json:"order_info"`
	ReturnURL string  `json:"return_url" binding:"required"`
	IPAddr    string  `json:"ip_addr"`
}

type VNPayPaymentResponse struct {
	PaymentURL string `json:"payment_url"`
	TxnRef     string `json:"txn_ref"`
}

type VNPayCallbackRequest struct {
	ResponseCode    string `form:"vnp_ResponseCode" binding:"required"`
	TransactionNo   string `form:"vnp_TransactionNo"`
	BankCode        string `form:"vnp_BankCode"`
	Amount          string `form:"vnp_Amount" binding:"required"`
	PayDate         string `form:"vnp_PayDate"`
	TransactionType string `form:"vnp_TransactionType"`
	TxnRef          string `form:"vnp_TxnRef" binding:"required"`
	SecureHash      string `form:"vnp_SecureHash" binding:"required"`
}

type PaymentCallbackResponse struct {
	RspCode string `json:"RspCode"`
	Message string `json:"Message"`
}

type UpdatePaymentStatusRequest struct {
	PaymentID     int    `json:"payment_id" binding:"required"`
	PaymentStatus string `json:"payment_status" binding:"required"`
	TransactionID string `json:"transaction_id,omitempty"`
}

type CreateVNPayFromOrderRequest struct {
	OrderID   int    `json:"order_id" binding:"required"`
	ReturnURL string `json:"return_url" binding:"required"`
	IPAddr    string `json:"ip_addr"`
}

type PaymentStatusResponse struct {
	PaymentID     int     `json:"payment_id"`
	OrderID       int     `json:"order_id"`
	PaymentMethod string  `json:"payment_method"`
	PaymentStatus string  `json:"payment_status"`
	TransactionID string  `json:"transaction_id,omitempty"`
	AmountPaid    float64 `json:"amount_paid"`
	PaymentDate   string  `json:"payment_date"`
}
