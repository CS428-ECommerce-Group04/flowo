package controller

import (
	"net/http"
	"strconv"

	"flowo-backend/internal/dto"
	"flowo-backend/internal/middleware"
	"flowo-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type PaymentController struct {
	PaymentService *service.PaymentService
	UserService    service.UserService
}

func NewPaymentController(ps *service.PaymentService, us service.UserService) *PaymentController {
	return &PaymentController{
		PaymentService: ps,
		UserService:    us,
	}
}

func (ctrl *PaymentController) RegisterRoutes(rg *gin.RouterGroup) {
	payment := rg.Group("/payments")

	// Public routes (no authentication required)
	payment.POST("/vnpay/callback", ctrl.VNPayCallback)

	// Protected routes will be added after auth middleware is applied
}

func (ctrl *PaymentController) RegisterProtectedRoutes(rg *gin.RouterGroup) {
	payment := rg.Group("/payments")

	// Authenticated routes
	payment.POST("/", ctrl.CreatePayment)
	payment.POST("/vnpay", ctrl.CreateVNPayPayment)
	payment.POST("/vnpay/create-from-order", ctrl.CreateVNPayFromOrder)
	payment.GET("/order/:orderID", ctrl.GetPaymentsByOrderID)
	payment.GET("/:paymentID/status", ctrl.GetPaymentStatus)
}

// CreatePayment godoc
// @Summary Create a new payment
// @Description Create a payment record for an order
// @Tags payments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreatePaymentRequest true "Payment details"
// @Success 201 {object} dto.PaymentResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/payments [post]
func (ctrl *PaymentController) CreatePayment(c *gin.Context) {
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	response, err := ctrl.PaymentService.CreatePayment(req, user.FirebaseUID)
	if err != nil {
		if err.Error() == "unauthorized: order does not belong to user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payment"})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// CreateVNPayPayment godoc
// @Summary Create VNPay payment
// @Description Create a VNPay payment and get payment URL
// @Tags payments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.VNPayPaymentRequest true "VNPay payment details"
// @Success 201 {object} dto.VNPayPaymentResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/payments/vnpay [post]
func (ctrl *PaymentController) CreateVNPayPayment(c *gin.Context) {
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.VNPayPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// Set client IP address
	req.IPAddr = c.ClientIP()

	response, err := ctrl.PaymentService.CreateVNPayPayment(req, user.FirebaseUID)
	if err != nil {
		if err.Error() == "unauthorized: order does not belong to user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create VNPay payment"})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// VNPayCallback godoc
// @Summary VNPay payment callback
// @Description Handle VNPay payment callback after user completes payment
// @Tags payments
// @Accept application/x-www-form-urlencoded
// @Produce json
// @Param vnp_ResponseCode formData string true "VNPay response code"
// @Param vnp_TransactionNo formData string false "VNPay transaction number"
// @Param vnp_BankCode formData string false "Bank code"
// @Param vnp_Amount formData string true "Payment amount"
// @Param vnp_PayDate formData string false "Payment date"
// @Param vnp_TransactionType formData string false "Transaction type"
// @Param vnp_TxnRef formData string true "Transaction reference"
// @Param vnp_SecureHash formData string true "Secure hash"
// @Success 200 {object} dto.PaymentCallbackResponse
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/payments/vnpay/callback [post]
func (ctrl *PaymentController) VNPayCallback(c *gin.Context) {
	var req dto.VNPayCallbackRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	response, err := ctrl.PaymentService.HandleVNPayCallback(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process callback"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetPaymentsByOrderID godoc
// @Summary Get payments for an order
// @Description Get all payments associated with a specific order
// @Tags payments
// @Produce json
// @Security BearerAuth
// @Param orderID path int true "Order ID"
// @Success 200 {array} dto.PaymentResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/payments/order/{orderID} [get]
func (ctrl *PaymentController) GetPaymentsByOrderID(c *gin.Context) {
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	orderID, err := strconv.Atoi(c.Param("orderID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order ID"})
		return
	}

	payments, err := ctrl.PaymentService.GetPaymentsByOrderID(orderID, user.FirebaseUID)
	if err != nil {
		if err.Error() == "unauthorized: order does not belong to user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get payments"})
		return
	}

	c.JSON(http.StatusOK, payments)
}

// CreateVNPayFromOrder godoc
// @Summary Create VNPay payment from existing order
// @Description Create a VNPay payment URL for an existing order automatically using order total
// @Tags payments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateVNPayFromOrderRequest true "Order ID and return URL"
// @Success 201 {object} dto.VNPayPaymentResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/payments/vnpay/create-from-order [post]
func (ctrl *PaymentController) CreateVNPayFromOrder(c *gin.Context) {
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.CreateVNPayFromOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// Set client IP address
	req.IPAddr = c.ClientIP()

	response, err := ctrl.PaymentService.CreateVNPayFromOrder(req, user.FirebaseUID)
	if err != nil {
		if err.Error() == "unauthorized: order does not belong to user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if err.Error() == "order not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
			return
		}
		if err.Error() == "order already paid" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "order already paid"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create VNPay payment"})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// GetPaymentStatus godoc
// @Summary Get payment status
// @Description Get the current status of a payment
// @Tags payments
// @Produce json
// @Security BearerAuth
// @Param paymentID path int true "Payment ID"
// @Success 200 {object} dto.PaymentStatusResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 404 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/payments/{paymentID}/status [get]
func (ctrl *PaymentController) GetPaymentStatus(c *gin.Context) {
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	paymentID, err := strconv.Atoi(c.Param("paymentID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	response, err := ctrl.PaymentService.GetPaymentStatus(paymentID, user.FirebaseUID)
	if err != nil {
		if err.Error() == "unauthorized: payment does not belong to user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if err.Error() == "payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get payment status"})
		return
	}

	c.JSON(http.StatusOK, response)
}
