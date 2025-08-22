package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/payOSHQ/payos-lib-golang"
	"github.com/rs/zerolog/log"

	"flowo-backend/internal/dto"
	"flowo-backend/internal/middleware"
	"flowo-backend/internal/service"
)

type PaymentController struct {
	PaymentService service.PaymentService
}

func NewPaymentController(ps service.PaymentService) *PaymentController {
	return &PaymentController{PaymentService: ps}
}

func (pc *PaymentController) RegisterRoutes(rg *gin.RouterGroup, authMiddleware *middleware.AuthMiddleware) {
	// Existing plural routes (kept for compatibility)
	grp := rg.Group("/payments")
	grp.POST("/webhook", pc.webhook)
	auth_grp := grp.Group("/", authMiddleware.RequireAuth())
	auth_grp.POST("/create", pc.createPaymentLink)
	auth_grp.POST("/cancel", pc.cancelOrder)
}

// createPaymentLink godoc
// @Summary      Create PayOS payment link
// @Description  Create a payment link for an existing order. Requires authentication.
// @Tags         payments
// @Accept       json
// @Produce      json
// @Param        body  body  dto.CreatePaymentLinkRequest  true  "Create payment link request"
// @Success      200 {object} dto.PaymentLinkResponse
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Security     BearerAuth
// @Router       /api/v1/payments/create [post]
func (pc *PaymentController) createPaymentLink(c *gin.Context) {
	var req dto.CreatePaymentLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// get firebase uid from middleware
	uidStr, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Firebase UID not found"})
		return
	}
	resp, err := pc.PaymentService.CreatePaymentLink(req, uidStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// webhook godoc
// @Summary      PayOS webhook receiver
// @Description  Endpoint to receive PayOS webhook notifications. Publicly accessible by PayOS.
// @Tags         payments
// @Accept       json
// @Produce      json
// @Param        payload  body  dto.PayOSWebhookRequest  true  "PayOS webhook payload"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Router       /api/v1/payments/webhook [post]
func (pc *PaymentController) webhook(c *gin.Context) {
	// Keep webhook handler minimal: read raw body and delegate to service which
	// performs signature verification and idempotent processing.
	log.Info().Msg("Received PayOS webhook")

	var raw payos.WebhookType
	if err := c.ShouldBindJSON(&raw); err != nil {
		log.Warn().Err(err).Msg("failed to unmarshal webhook body")
		c.Status(http.StatusOK)
		return
	}
	log.Debug().Interface("webhook", raw).Msg("PayOS webhook received")

	if err := pc.PaymentService.HandleWebhook(raw); err != nil {
		log.Error().Err(err).Msg("payOS webhook: processing error")
		// still acknowledge to avoid retries from PayOS; processing is idempotent
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// cancelOrder cancels an order and updates payment status. POST /api/v1/payment/cancel?order_id=123
// CancelOrder godoc
// @Summary Cancel an order
// @Description Cancel an order and update associated payment and inventory (owner only)
// @Tags payments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param order_id query int true "Order ID"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/payments/cancel [post]
func (pc *PaymentController) cancelOrder(c *gin.Context) {
	orderIDStr := c.Query("order_id")
	if orderIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id is required as query param"})
		return
	}
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order_id"})
		return
	}
	uid, _ := middleware.GetFirebaseUserID(c)
	if err := pc.PaymentService.CancelOrder(orderID, uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "order cancelled"})
}
