package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CartController struct {
	Service *service.CartService
}

func NewCartController(s *service.CartService) *CartController {
	return &CartController{Service: s}
}

func (ctrl *CartController) RegisterRoutes(rg *gin.RouterGroup) {
	cart := rg.Group("/cart")
	cart.POST("/add", ctrl.AddToCart)
}

// AddToCart godoc
// @Summary Add product to cart
// @Description Add a product with quantity to the user's cart. Stock will be updated accordingly.
// @Tags cart
// @Accept json
// @Produce json
// @Param request body dto.AddToCartRequest true "Add to cart request"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/cart/add [post]
func (ctrl *CartController) AddToCart(c *gin.Context) {
	var req dto.AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.Service.AddToCart(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not add to cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product added to cart"})
}
