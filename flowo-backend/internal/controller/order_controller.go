package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/service"
	"net/http"
	"strconv"

	"flowo-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

type OrderController struct {
	orderService *service.OrderService
	userService  service.UserService
}

func NewOrderController(os *service.OrderService, us service.UserService) *OrderController {
	return &OrderController{orderService: os, userService: us}
}

func (ctrl *OrderController) RegisterRoutes(rg *gin.RouterGroup) {
	order := rg.Group("/orders")
	order.POST("/", ctrl.CreateOrder)
	order.GET("/", ctrl.GetUserOrders)
	order.PUT("/:orderID/status", ctrl.UpdateOrderStatus)
	order.GET("/:orderID", ctrl.GetOrderDetailByID)
}

// CreateOrder godoc
// @Summary Create a new order
// @Description Create a new order for the current user with items from cart
// @Tags orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateOrderRequest true "Order details"
// @Success 201 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/orders [post]
func (ctrl *OrderController) CreateOrder(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	orderID, err := ctrl.orderService.CreateOrder(user.UserID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "order created", "order_id": orderID})
}

// GetUserOrders godoc
// @Summary Get all orders for the current user
// @Description Retrieve all orders associated with the authenticated user from JWT (Firebase token)
// @Tags orders
// @Produce json
// @Security BearerAuth
// @Success 200 {array} dto.OrderResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/orders [get]
func (ctrl *OrderController) GetUserOrders(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	orders, err := ctrl.orderService.GetUserOrders(user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot fetch orders"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// UpdateOrderStatus godoc
// @Summary Update order status by ID
// @Description Update the status of a specific order by order ID (admin only or via ownership check)
// @Tags orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orderID path int true "Order ID"
// @Param request body dto.UpdateOrderStatusRequest true "Update status request"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/orders/{orderID}/status [put]
func (ctrl *OrderController) UpdateOrderStatus(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("orderID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order_id"})
		return
	}

	var req dto.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}
	// check admin role
	if err := ctrl.orderService.UpdateStatus(orderID, req, strconv.Itoa(user.UserID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "order status updated"})
}

// GetOrderDetailByID godoc
// @Summary Get order details
// @Description Retrieve full details of a specific order (owner or admin only)
// @Tags orders
// @Produce json
// @Security BearerAuth
// @Param orderID path int true "Order ID"
// @Success 200 {object} dto.OrderDetailResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/orders/{orderID} [get]
func (ctrl *OrderController) GetOrderDetailByID(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("orderID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order_id"})
		return
	}

	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	ownerID, err := ctrl.orderService.GetOrderOwnerID(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot verify order owner"})
		return
	}

	if ownerID != user.UserID {
		role, _ := c.Get("role")
		if role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
			return
		}
	}

	order, err := ctrl.orderService.GetOrderDetailByID(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot fetch order detail"})
		return
	}

	c.JSON(http.StatusOK, order)
}
