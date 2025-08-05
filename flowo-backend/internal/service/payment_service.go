package service

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"flowo-backend/config"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
)

// VNPay Configuration constants
const (
	VNP_VERSION   = "2.1.0"
	VNP_COMMAND   = "pay"
	VNP_CURR_CODE = "VND"
	VNP_LOCALE    = "vn"
)

type PaymentService struct {
	PaymentRepo repository.PaymentRepository
	OrderRepo   repository.OrderRepository
	Config      *config.Config
}

func NewPaymentService(paymentRepo repository.PaymentRepository, orderRepo repository.OrderRepository, cfg *config.Config) *PaymentService {
	return &PaymentService{
		PaymentRepo: paymentRepo,
		OrderRepo:   orderRepo,
		Config:      cfg,
	}
}

func (s *PaymentService) CreatePayment(req dto.CreatePaymentRequest, userID string) (*dto.PaymentResponse, error) {
	// Verify that the order exists and belongs to the user
	order, err := s.OrderRepo.GetOrderByID(req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %v", err)
	}
	if order == nil {
		return nil, errors.New("order not found")
	}
	if order.FirebaseUID != userID {
		return nil, errors.New("unauthorized: order does not belong to user")
	}

	// Create payment record
	payment := model.Payment{
		OrderID:       req.OrderID,
		PaymentMethod: req.PaymentMethod,
		PaymentStatus: "Pending",
		AmountPaid:    req.Amount,
		PaymentDate:   time.Now(),
	}

	// For VNPay, generate transaction reference
	if req.PaymentMethod == "VNPAY" {
		payment.TransactionID = s.generateTxnRef(req.OrderID)
	}

	paymentID, err := s.PaymentRepo.CreatePayment(payment)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment: %v", err)
	}

	response := &dto.PaymentResponse{
		PaymentID:     paymentID,
		OrderID:       req.OrderID,
		PaymentMethod: req.PaymentMethod,
		PaymentStatus: "Pending",
		TransactionID: payment.TransactionID,
		AmountPaid:    req.Amount,
		PaymentDate:   payment.PaymentDate.Format("2006-01-02 15:04:05"),
	}

	// For VNPay, generate payment URL
	if req.PaymentMethod == "VNPAY" && req.ReturnURL != "" {
		paymentURL, err := s.generateVNPayURL(payment.TransactionID, req.Amount, fmt.Sprintf("Payment for Order #%d", req.OrderID), req.ReturnURL)
		if err != nil {
			return nil, fmt.Errorf("failed to generate VNPay URL: %v", err)
		}
		response.PaymentURL = paymentURL
	}

	return response, nil
}

func (s *PaymentService) CreateVNPayPayment(req dto.VNPayPaymentRequest, userID string) (*dto.VNPayPaymentResponse, error) {
	// Verify that the order exists and belongs to the user
	order, err := s.OrderRepo.GetOrderByID(req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %v", err)
	}
	if order == nil {
		return nil, errors.New("order not found")
	}
	if order.FirebaseUID != userID {
		return nil, errors.New("unauthorized: order does not belong to user")
	}

	// Generate transaction reference
	txnRef := s.generateTxnRef(req.OrderID)

	// Create payment record
	payment := model.Payment{
		OrderID:       req.OrderID,
		PaymentMethod: "VNPAY",
		PaymentStatus: "Pending",
		TransactionID: txnRef,
		AmountPaid:    req.Amount,
		PaymentDate:   time.Now(),
	}

	_, err = s.PaymentRepo.CreatePayment(payment)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment: %v", err)
	}

	// Generate VNPay payment URL
	orderInfo := req.OrderInfo
	if orderInfo == "" {
		orderInfo = fmt.Sprintf("Payment for Order #%d", req.OrderID)
	}

	paymentURL, err := s.generateVNPayURL(txnRef, req.Amount, orderInfo, req.ReturnURL)
	if err != nil {
		return nil, fmt.Errorf("failed to generate VNPay URL: %v", err)
	}

	return &dto.VNPayPaymentResponse{
		PaymentURL: paymentURL,
		TxnRef:     txnRef,
	}, nil
}

func (s *PaymentService) HandleVNPayCallback(req dto.VNPayCallbackRequest) (*dto.PaymentCallbackResponse, error) {
	// Verify the secure hash
	if !s.verifyVNPaySignature(req) {
		return &dto.PaymentCallbackResponse{
			RspCode: "97",
			Message: "Invalid signature",
		}, nil
	}

	// Get payment by transaction reference
	payment, err := s.PaymentRepo.GetPaymentByTransactionRef(req.TxnRef)
	if err != nil {
		return &dto.PaymentCallbackResponse{
			RspCode: "01",
			Message: "Order not found",
		}, nil
	}
	if payment == nil {
		return &dto.PaymentCallbackResponse{
			RspCode: "01",
			Message: "Order not found",
		}, nil
	}

	// Check if payment was successful
	var newStatus string
	var newOrderStatus string

	if req.ResponseCode == "00" {
		newStatus = "Success"
		newOrderStatus = "Processing" // Or "AwaitingShipment" based on your workflow
	} else {
		newStatus = "Failed"
		newOrderStatus = "PaymentFailed"
	}

	// Update payment status
	err = s.PaymentRepo.UpdatePaymentStatus(payment.PaymentID, newStatus, req.TransactionNo)
	if err != nil {
		return &dto.PaymentCallbackResponse{
			RspCode: "99",
			Message: "Error updating payment status",
		}, nil
	}

	// Update order status
	err = s.OrderRepo.UpdateOrderStatus(payment.OrderID, newOrderStatus, nil)
	if err != nil {
		// Log error but don't fail the callback
		fmt.Printf("Failed to update order status: %v\n", err)
	}

	return &dto.PaymentCallbackResponse{
		RspCode: "00",
		Message: "Success",
	}, nil
}

func (s *PaymentService) GetPaymentsByOrderID(orderID int, userID string) ([]dto.PaymentResponse, error) {
	// Verify that the order belongs to the user
	order, err := s.OrderRepo.GetOrderByID(orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %v", err)
	}
	if order == nil {
		return nil, errors.New("order not found")
	}
	if order.FirebaseUID != userID {
		return nil, errors.New("unauthorized: order does not belong to user")
	}

	payments, err := s.PaymentRepo.GetPaymentsByOrderID(orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payments: %v", err)
	}

	var responses []dto.PaymentResponse
	for _, payment := range payments {
		responses = append(responses, dto.PaymentResponse{
			PaymentID:     payment.PaymentID,
			OrderID:       payment.OrderID,
			PaymentMethod: payment.PaymentMethod,
			PaymentStatus: payment.PaymentStatus,
			TransactionID: payment.TransactionID,
			AmountPaid:    payment.AmountPaid,
			PaymentDate:   payment.PaymentDate.Format("2006-01-02 15:04:05"),
		})
	}

	return responses, nil
}

func (s *PaymentService) generateTxnRef(orderID int) string {
	return fmt.Sprintf("ORD%d%d", orderID, time.Now().Unix())
}

func (s *PaymentService) generateVNPayURL(txnRef string, amount float64, orderInfo, returnURL string) (string, error) {
	// Convert amount to VND cents (VNPay requires amount in smallest currency unit)
	amountInCents := int64(amount * 100)

	// Create parameter map
	params := map[string]string{
		"vnp_Version":    VNP_VERSION,
		"vnp_Command":    VNP_COMMAND,
		"vnp_TmnCode":    s.Config.VNPay.TmnCode,
		"vnp_Amount":     strconv.FormatInt(amountInCents, 10),
		"vnp_CurrCode":   VNP_CURR_CODE,
		"vnp_TxnRef":     txnRef,
		"vnp_OrderInfo":  orderInfo,
		"vnp_OrderType":  "other",
		"vnp_Locale":     VNP_LOCALE,
		"vnp_ReturnUrl":  returnURL,
		"vnp_IpAddr":     "127.0.0.1", // Should be the actual client IP
		"vnp_CreateDate": time.Now().Format("20060102150405"),
	}

	// Create sorted query string
	var keys []string
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sortedParams []string
	for _, k := range keys {
		sortedParams = append(sortedParams, fmt.Sprintf("%s=%s", k, url.QueryEscape(params[k])))
	}

	queryString := strings.Join(sortedParams, "&")

	// Generate secure hash
	secureHash := s.generateVNPayHash(queryString)

	// Build final URL
	finalURL := fmt.Sprintf("%s?%s&vnp_SecureHash=%s", s.Config.VNPay.URL, queryString, secureHash)

	return finalURL, nil
}

func (s *PaymentService) generateVNPayHash(data string) string {
	h := hmac.New(sha512.New, []byte(s.Config.VNPay.HashSecret))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func (s *PaymentService) verifyVNPaySignature(req dto.VNPayCallbackRequest) bool {
	// Create parameter map (excluding vnp_SecureHash)
	params := map[string]string{
		"vnp_Amount":          req.Amount,
		"vnp_BankCode":        req.BankCode,
		"vnp_PayDate":         req.PayDate,
		"vnp_ResponseCode":    req.ResponseCode,
		"vnp_TransactionNo":   req.TransactionNo,
		"vnp_TransactionType": req.TransactionType,
		"vnp_TxnRef":          req.TxnRef,
	}

	// Create sorted query string
	var keys []string
	for k := range params {
		if params[k] != "" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	var sortedParams []string
	for _, k := range keys {
		sortedParams = append(sortedParams, fmt.Sprintf("%s=%s", k, params[k]))
	}

	queryString := strings.Join(sortedParams, "&")

	// Generate expected hash
	expectedHash := s.generateVNPayHash(queryString)

	// Compare with received hash
	return expectedHash == req.SecureHash
}

func (s *PaymentService) CreateVNPayFromOrder(req dto.CreateVNPayFromOrderRequest, userID string) (*dto.VNPayPaymentResponse, error) {
	// Verify that the order exists and belongs to the user
	order, err := s.OrderRepo.GetOrderByID(req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %v", err)
	}
	if order == nil {
		return nil, errors.New("order not found")
	}
	if order.FirebaseUID != userID {
		return nil, errors.New("unauthorized: order does not belong to user")
	}

	// Check if order is already paid (has successful payment)
	existingPayments, err := s.PaymentRepo.GetPaymentsByOrderID(req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing payments: %v", err)
	}

	for _, payment := range existingPayments {
		if payment.PaymentStatus == "Success" {
			return nil, errors.New("order already paid")
		}
	}

	// Use order's final total amount
	amount := order.FinalTotalAmount

	// Generate transaction reference
	txnRef := s.generateTxnRef(req.OrderID)

	// Create payment record
	payment := model.Payment{
		OrderID:       req.OrderID,
		PaymentMethod: "VNPAY",
		PaymentStatus: "Pending",
		TransactionID: txnRef,
		AmountPaid:    amount,
		PaymentDate:   time.Now(),
	}

	_, err = s.PaymentRepo.CreatePayment(payment)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment: %v", err)
	}

	// Update order status to AwaitingPayment
	err = s.OrderRepo.UpdateOrderStatus(req.OrderID, "AwaitingPayment", nil)
	if err != nil {
		// Log error but don't fail payment creation
		fmt.Printf("Failed to update order status to AwaitingPayment: %v\n", err)
	}

	// Generate VNPay payment URL
	orderInfo := fmt.Sprintf("Payment for Order #%d - Flowo Flower Shop", req.OrderID)

	returnURL := req.ReturnURL
	if returnURL == "" {
		returnURL = s.Config.VNPay.ReturnURL
	}

	paymentURL, err := s.generateVNPayURL(txnRef, amount, orderInfo, returnURL)
	if err != nil {
		return nil, fmt.Errorf("failed to generate VNPay URL: %v", err)
	}

	return &dto.VNPayPaymentResponse{
		PaymentURL: paymentURL,
		TxnRef:     txnRef,
	}, nil
}

func (s *PaymentService) GetPaymentStatus(paymentID int, userID string) (*dto.PaymentStatusResponse, error) {
	// Get payment by ID
	payment, err := s.PaymentRepo.GetPaymentByID(paymentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %v", err)
	}
	if payment == nil {
		return nil, errors.New("payment not found")
	}

	// Verify that the order belongs to the user
	order, err := s.OrderRepo.GetOrderByID(payment.OrderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %v", err)
	}
	if order == nil {
		return nil, errors.New("order not found")
	}
	if order.FirebaseUID != userID {
		return nil, errors.New("unauthorized: payment does not belong to user")
	}

	return &dto.PaymentStatusResponse{
		PaymentID:     payment.PaymentID,
		OrderID:       payment.OrderID,
		PaymentMethod: payment.PaymentMethod,
		PaymentStatus: payment.PaymentStatus,
		TransactionID: payment.TransactionID,
		AmountPaid:    payment.AmountPaid,
		PaymentDate:   payment.PaymentDate.Format("2006-01-02 15:04:05"),
	}, nil
}
