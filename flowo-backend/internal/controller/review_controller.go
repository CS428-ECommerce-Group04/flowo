package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ReviewController struct {
	Service *service.ReviewService
}

func NewReviewController(s *service.ReviewService) *ReviewController {
	return &ReviewController{Service: s}
}

func (ctrl *ReviewController) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/products/:productID/reviews", ctrl.GetReviewsByProduct)
	rg.POST("/products/:productID/reviews", ctrl.CreateReview)
}

// CreateReview godoc
// @Summary Create review for a product
// @Description Submit a review for a specific product
// @Tags reviews
// @Accept json
// @Produce json
// @Param productID path int true "Product ID"
// @Param review body dto.CreateReviewRequest true "Review body"
// @Success 201 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/products/{productID}/reviews [post]
func (ctrl *ReviewController) CreateReview(c *gin.Context) {
	var req dto.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, err := strconv.Atoi(c.Param("productID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	if err := ctrl.Service.CreateReview(productID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Review created successfully"})
}

// GetReviewsByProduct godoc
// @Summary Get all reviews for a product
// @Description Retrieve reviews by product ID
// @Tags reviews
// @Produce json
// @Param productID path int true "Product ID"
// @Success 200 {array} dto.ReviewResponse
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/products/{productID}/reviews [get]
func (ctrl *ReviewController) GetReviewsByProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("productID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	reviews, err := ctrl.Service.GetReviewsByProduct(productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, reviews)
}
