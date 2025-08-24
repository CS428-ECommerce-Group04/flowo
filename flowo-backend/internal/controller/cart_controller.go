package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/middleware"
	"flowo-backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CartController struct {
	Service     *service.CartService
	UserService service.UserService
}

func NewCartController(s *service.CartService, us service.UserService) *CartController {
	return &CartController{Service: s, UserService: us}
}

func (ctrl *CartController) RegisterRoutes(rg *gin.RouterGroup) {
	cart := rg.Group("/cart")
	cart.POST("/add", ctrl.AddToCart)
	cart.PUT("/update", ctrl.UpdateCartItem)
	cart.DELETE("/remove", ctrl.RemoveCartItem)
	cart.GET("/", ctrl.GetCartItems)
}

// AddToCart godoc
// @Summary Add product to cart
// @Description Add a product with quantity to the user's cart. Stock will be updated accordingly.
// @Tags cart
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.AddToCartRequest true "Add to cart request"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/cart/add [post]
func (ctrl *CartController) AddToCart(c *gin.Context) {
	firebaseUID, ok := middleware.GetFirebaseUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.FirebaseUID = firebaseUID

	if err := ctrl.Service.AddToCart(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not add to cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product added to cart"})
}

// UpdateCartItem godoc
// @Summary Update quantity of a product in cart
// @Description Update the quantity of an existing cart item
// @Tags cart
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.UpdateCartItemRequest true "Update cart item request"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/cart/update [put]
func (ctrl *CartController) UpdateCartItem(c *gin.Context) {
	firebaseUID, ok := middleware.GetFirebaseUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.UpdateCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.FirebaseUID = firebaseUID

	if err := ctrl.Service.UpdateCartItem(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update cart item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart item updated"})
}

// RemoveCartItem godoc
// @Summary Remove product from cart
// @Description Remove a product from the user's cart
// @Tags cart
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.RemoveCartItemRequest true "Remove cart item request"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/cart/remove [delete]
func (ctrl *CartController) RemoveCartItem(c *gin.Context) {
	firebaseUID, ok := middleware.GetFirebaseUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.RemoveCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.FirebaseUID = firebaseUID

	if err := ctrl.Service.RemoveCartItem(req.FirebaseUID, req.ProductID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not remove item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart item removed"})
}

// GetCartItems godoc
// @Summary Get cart items for user
// @Description Retrieve all items in the cart for the authenticated user
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Success 200 {array} dto.CartItemResponse
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/cart [get]
func (ctrl *CartController) GetCartItems(c *gin.Context) {
	firebaseUID, ok := middleware.GetFirebaseUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.UserService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	items, err := ctrl.Service.GetCartWithPrices(user.FirebaseUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not get cart items"})
		return
	}

	c.JSON(http.StatusOK, items)
}
