# VNPay Payment Implementation Guide

## How It Works: Technical Deep Dive

This document explains the technical implementation of the VNPay payment integration, showing how each component works together.

## Component Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    VNPay        │
│   (React)       │    │    (Go/Gin)     │    │   Gateway       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │   1. Create Payment    │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │                       │   2. Generate URL     │
         │                       ├──────────────────────►│
         │                       │                       │
         │   3. Payment URL      │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │   4. Redirect User    │                       │
         ├───────────────────────┼──────────────────────►│
         │                       │                       │
         │                       │   5. Payment Callback │
         │                       │◄──────────────────────┤
         │                       │                       │
         │   6. Return to App    │                       │
         │◄──────────────────────┼───────────────────────┤
```

## Code Flow Analysis

### 1. Payment Controller Layer

#### Route Registration

```go
// Payment routes are split into public and protected
func (ctrl *PaymentController) RegisterRoutes(rg *gin.RouterGroup) {
    payment := rg.Group("/payments")
    // Public routes (no authentication required)
    payment.POST("/vnpay/callback", ctrl.VNPayCallback)
}

func (ctrl *PaymentController) RegisterProtectedRoutes(rg *gin.RouterGroup) {
    payment := rg.Group("/payments")
    // Authenticated routes
    payment.POST("/vnpay/create-from-order", ctrl.CreateVNPayFromOrder)
    payment.GET("/:paymentID/status", ctrl.GetPaymentStatus)
}
```

**Why This Design?**
- VNPay callback must be public (no auth) because it's called by VNPay servers
- Payment creation requires authentication to prevent unauthorized payments
- Status checking requires authentication to protect user data

#### Payment Creation Handler

```go
func (ctrl *PaymentController) CreateVNPayFromOrder(c *gin.Context) {
    // 1. Extract user from JWT token
    firebaseUID, exists := middleware.GetFirebaseUserID(c)
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    // 2. Get user from database
    user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
    if err != nil || user == nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
        return
    }

    // 3. Parse request body
    var req dto.CreateVNPayFromOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
        return
    }

    // 4. Set client IP for VNPay
    req.IPAddr = c.ClientIP()

    // 5. Call service layer
    response, err := ctrl.PaymentService.CreateVNPayFromOrder(req, user.FirebaseUID)
    if err != nil {
        // Handle different error types with appropriate HTTP status codes
        switch err.Error() {
        case "unauthorized: order does not belong to user":
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
        case "order not found":
            c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
        case "order already paid":
            c.JSON(http.StatusBadRequest, gin.H{"error": "order already paid"})
        default:
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create VNPay payment"})
        }
        return
    }

    c.JSON(http.StatusCreated, response)
}
```

### 2. Service Layer Business Logic

#### Payment Creation Service

```go
func (s *PaymentService) CreateVNPayFromOrder(req dto.CreateVNPayFromOrderRequest, userID string) (*dto.VNPayPaymentResponse, error) {
    // Step 1: Verify order ownership
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

    // Step 2: Prevent duplicate payments
    existingPayments, err := s.PaymentRepo.GetPaymentsByOrderID(req.OrderID)
    if err != nil {
        return nil, fmt.Errorf("failed to check existing payments: %v", err)
    }
    
    for _, payment := range existingPayments {
        if payment.PaymentStatus == "Success" {
            return nil, errors.New("order already paid")
        }
    }

    // Step 3: Use order's actual total amount
    amount := order.FinalTotalAmount

    // Step 4: Generate unique transaction reference
    txnRef := s.generateTxnRef(req.OrderID)

    // Step 5: Create payment record in database
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

    // Step 6: Update order status to indicate payment is expected
    err = s.OrderRepo.UpdateOrderStatus(req.OrderID, "AwaitingPayment", nil)
    if err != nil {
        // Log error but don't fail payment creation
        fmt.Printf("Failed to update order status to AwaitingPayment: %v\n", err)
    }

    // Step 7: Generate VNPay payment URL
    orderInfo := fmt.Sprintf("Payment for Order #%d - Flowo Flower Shop", req.OrderID)
    
    returnURL := req.ReturnURL
    if returnURL == "" {
        returnURL = s.Config.VNPay.ReturnURL // Use default from config
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
```

#### VNPay URL Generation

```go
func (s *PaymentService) generateVNPayURL(txnRef string, amount float64, orderInfo, returnURL string) (string, error) {
    // Convert amount to VND cents (VNPay requires smallest currency unit)
    amountInCents := int64(amount * 100)

    // Create parameter map with all required VNPay fields
    params := map[string]string{
        "vnp_Version":    VNP_VERSION,    // "2.1.0"
        "vnp_Command":    VNP_COMMAND,    // "pay"
        "vnp_TmnCode":    s.Config.VNPay.TmnCode,
        "vnp_Amount":     strconv.FormatInt(amountInCents, 10),
        "vnp_CurrCode":   VNP_CURR_CODE,  // "VND"
        "vnp_TxnRef":     txnRef,
        "vnp_OrderInfo":  orderInfo,
        "vnp_OrderType":  "other",
        "vnp_Locale":     VNP_LOCALE,    // "vn"
        "vnp_ReturnUrl":  returnURL,
        "vnp_IpAddr":     "127.0.0.1",   // Should be actual client IP
        "vnp_CreateDate": time.Now().Format("20060102150405"),
    }

    // Create sorted query string (VNPay requires alphabetical sorting)
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

    // Generate secure hash using HMAC-SHA512
    secureHash := s.generateVNPayHash(queryString)
    
    // Build final URL
    finalURL := fmt.Sprintf("%s?%s&vnp_SecureHash=%s", s.Config.VNPay.URL, queryString, secureHash)
    
    return finalURL, nil
}
```

#### Hash Generation and Verification

```go
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

    // Create sorted query string (same as URL generation)
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
```

### 3. Callback Processing

#### VNPay Callback Handler

```go
func (s *PaymentService) HandleVNPayCallback(req dto.VNPayCallbackRequest) (*dto.PaymentCallbackResponse, error) {
    // Step 1: Verify the secure hash (CRITICAL for security)
    if !s.verifyVNPaySignature(req) {
        return &dto.PaymentCallbackResponse{
            RspCode: "97",
            Message: "Invalid signature",
        }, nil
    }

    // Step 2: Find payment record by transaction reference
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

    // Step 3: Determine payment result based on VNPay response code
    var newStatus string
    var newOrderStatus string
    
    if req.ResponseCode == "00" {
        // Success - payment completed
        newStatus = "Success"
        newOrderStatus = "Processing" // Order can now be processed
    } else {
        // Failed - payment failed or cancelled
        newStatus = "Failed"
        newOrderStatus = "PaymentFailed"
    }

    // Step 4: Update payment status in database
    err = s.PaymentRepo.UpdatePaymentStatus(payment.PaymentID, newStatus, req.TransactionNo)
    if err != nil {
        return &dto.PaymentCallbackResponse{
            RspCode: "99",
            Message: "Error updating payment status",
        }, nil
    }

    // Step 5: Update corresponding order status
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
```

### 4. Repository Layer

#### Payment Repository Implementation

```go
func (r *paymentRepository) CreatePayment(payment model.Payment) (int, error) {
    query := `
        INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `
    
    result, err := r.DB.Exec(query,
        payment.OrderID,
        payment.PaymentMethod,
        payment.PaymentStatus,
        payment.TransactionID,
        payment.AmountPaid,
        payment.PaymentDate,
    )
    
    if err != nil {
        return 0, err
    }
    
    paymentID, err := result.LastInsertId()
    if err != nil {
        return 0, err
    }
    
    return int(paymentID), nil
}

func (r *paymentRepository) UpdatePaymentStatus(paymentID int, status string, transactionID string) error {
    query := `
        UPDATE Payment 
        SET payment_status = ?, transaction_id = ?
        WHERE payment_id = ?
    `
    
    _, err := r.DB.Exec(query, status, transactionID, paymentID)
    return err
}

func (r *paymentRepository) GetPaymentByTransactionRef(txnRef string) (*model.Payment, error) {
    query := `
        SELECT payment_id, order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date
        FROM Payment
        WHERE transaction_id = ?
    `
    
    var payment model.Payment
    err := r.DB.QueryRow(query, txnRef).Scan(
        &payment.PaymentID,
        &payment.OrderID,
        &payment.PaymentMethod,
        &payment.PaymentStatus,
        &payment.TransactionID,
        &payment.AmountPaid,
        &payment.PaymentDate,
    )
    
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, nil
        }
        return nil, err
    }
    
    return &payment, nil
}
```

### 5. Configuration Management

#### VNPay Config Structure

```go
type VNPayConfig struct {
    TmnCode    string // Terminal code from VNPay
    HashSecret string // Hash secret for signature generation
    URL        string // VNPay payment URL (sandbox/production)
    ReturnURL  string // Default return URL after payment
}

func NewConfig() (*config.Config, error) {
    // ... other config loading ...
    
    // Load VNPay configuration from environment
    config.VNPay.TmnCode = viper.GetString("VNPAY_TMN_CODE")
    config.VNPay.HashSecret = viper.GetString("VNPAY_HASH_SECRET")
    config.VNPay.URL = viper.GetString("VNPAY_URL")
    config.VNPay.ReturnURL = viper.GetString("VNPAY_RETURN_URL")
    
    // Set defaults for development
    if config.VNPay.TmnCode == "" {
        config.VNPay.TmnCode = "DEMO"
    }
    if config.VNPay.HashSecret == "" {
        config.VNPay.HashSecret = "DEMOHASHSECRET"
    }
    if config.VNPay.URL == "" {
        config.VNPay.URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    }
    if config.VNPay.ReturnURL == "" {
        config.VNPay.ReturnURL = "http://localhost:5173/payment/result"
    }
    
    return &config, nil
}
```

### 6. Data Transfer Objects (DTOs)

#### Request/Response Structures

```go
// Request to create VNPay payment from order
type CreateVNPayFromOrderRequest struct {
    OrderID   int    `json:"order_id" binding:"required"`
    ReturnURL string `json:"return_url" binding:"required"`
    IPAddr    string `json:"ip_addr"`
}

// Response with VNPay payment URL
type VNPayPaymentResponse struct {
    PaymentURL string `json:"payment_url"`
    TxnRef     string `json:"txn_ref"`
}

// VNPay callback request (form data from VNPay)
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

// Response to VNPay callback
type PaymentCallbackResponse struct {
    RspCode string `json:"RspCode"`
    Message string `json:"Message"`
}
```

## Integration Points

### 1. Order Service Integration

The payment system integrates with the order service:

```go
// In OrderService.CreateOrder()
if req.PaymentMethod == "VNPAY" || req.PaymentMethod == "Paypal" {
    orderStatus = "AwaitingPayment"
}

// Payment service updates order status after successful payment
err = s.OrderRepo.UpdateOrderStatus(payment.OrderID, "Processing", nil)
```

### 2. Authentication Integration

Uses Firebase authentication:

```go
// Extract user from JWT token
firebaseUID, exists := middleware.GetFirebaseUserID(c)

// Get user from local database
user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
```

### 3. Database Transaction Handling

For data consistency:

```go
// In production, you might want to use database transactions
tx, err := db.Begin()
if err != nil {
    return err
}
defer tx.Rollback()

// Create payment record
// Update order status
// Update stock if needed

err = tx.Commit()
```

## Error Handling Strategy

### 1. Input Validation

```go
// Validate request structure
if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
    return
}

// Validate business rules
if order.FirebaseUID != userID {
    return nil, errors.New("unauthorized: order does not belong to user")
}
```

### 2. External Service Errors

```go
// Handle VNPay communication errors
paymentURL, err := s.generateVNPayURL(txnRef, amount, orderInfo, returnURL)
if err != nil {
    return nil, fmt.Errorf("failed to generate VNPay URL: %v", err)
}
```

### 3. Database Errors

```go
// Handle database errors gracefully
_, err = s.PaymentRepo.CreatePayment(payment)
if err != nil {
    return nil, fmt.Errorf("failed to create payment: %v", err)
}
```

## Security Considerations

### 1. Signature Verification

Always verify VNPay signatures:

```go
if !s.verifyVNPaySignature(req) {
    return &dto.PaymentCallbackResponse{
        RspCode: "97",
        Message: "Invalid signature",
    }, nil
}
```

### 2. User Authorization

Ensure users can only access their own data:

```go
if order.FirebaseUID != userID {
    return nil, errors.New("unauthorized: order does not belong to user")
}
```

### 3. Duplicate Payment Prevention

Check for existing successful payments:

```go
for _, payment := range existingPayments {
    if payment.PaymentStatus == "Success" {
        return nil, errors.New("order already paid")
    }
}
```

This implementation provides a robust, secure, and maintainable VNPay payment integration that handles all aspects of the payment flow from creation to completion.
