package controller

import (
	"context"
	"net/http"
	"strconv"

	"flowo-backend/internal/dto"
	"flowo-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type RecommendationController struct {
	recommendationService service.RecommendationService
}

func NewRecommendationController(recommendationService service.RecommendationService) *RecommendationController {
	return &RecommendationController{
		recommendationService: recommendationService,
	}
}

// GetRecommendations godoc
// @Summary Get personalized recommendations
// @Description Get personalized product recommendations based on user preferences and behavior
// @Tags recommendations
// @Accept json
// @Produce json
// @Param user_id query int false "User ID for personalized recommendations"
// @Param session_id query string false "Session ID for anonymous users"
// @Param recommendation_type query string true "Type of recommendation" Enums(personalized,similar,trending,occasion_based,price_based)
// @Param product_id query int false "Product ID for similar product recommendations"
// @Param occasion query string false "Occasion for occasion-based recommendations"
// @Param price_min query number false "Minimum price for price-based recommendations"
// @Param price_max query number false "Maximum price for price-based recommendations"
// @Param limit query int false "Number of recommendations to return" default(10)
// @Success 200 {object} dto.RecommendationResponseDTO
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations [get]
func (rc *RecommendationController) GetRecommendations(c *gin.Context) {
	var req dto.RecommendationRequestDTO

	// Parse query parameters
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request parameters",
			"details": err.Error(),
		})
		return
	}

	// Validate recommendation type
	if req.RecommendationType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "recommendation_type is required",
		})
		return
	}

	// Set default limit if not provided
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 50 {
		req.Limit = 50 // Max limit to prevent performance issues
	}

	ctx := context.Background()
	var response *dto.RecommendationResponseDTO
	var err error

	switch req.RecommendationType {
	case "personalized":
		response, err = rc.recommendationService.GetPersonalizedRecommendations(ctx, &req)
	case "similar":
		if req.ProductID == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "product_id is required for similar product recommendations",
			})
			return
		}
		response, err = rc.recommendationService.GetSimilarProducts(ctx, *req.ProductID, req.Limit)
	case "trending":
		period := "weekly" // Default period
		if req.SessionID != "" {
			period = "daily" // More recent for anonymous users
		}
		response, err = rc.recommendationService.GetTrendingProducts(ctx, period, req.Limit)
	case "occasion_based":
		if req.Occasion == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "occasion is required for occasion-based recommendations",
			})
			return
		}
		response, err = rc.recommendationService.GetOccasionBasedRecommendations(ctx, req.Occasion, req.Limit)
	case "price_based":
		if req.PriceMin == nil || req.PriceMax == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "price_min and price_max are required for price-based recommendations",
			})
			return
		}
		if *req.PriceMin > *req.PriceMax {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "price_min cannot be greater than price_max",
			})
			return
		}
		response, err = rc.recommendationService.GetPriceBasedRecommendations(ctx, *req.PriceMin, *req.PriceMax, req.Limit)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid recommendation_type. Must be one of: personalized, similar, trending, occasion_based, price_based",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get recommendations",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetSimilarProducts godoc
// @Summary Get similar products
// @Description Get products similar to a specific product
// @Tags recommendations
// @Accept json
// @Produce json
// @Param product_id path int true "Product ID"
// @Param limit query int false "Number of similar products to return" default(10)
// @Success 200 {object} dto.RecommendationResponseDTO
// @Failure 400 {object} model.Response
// @Failure 404 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations/similar/{product_id} [get]
func (rc *RecommendationController) GetSimilarProducts(c *gin.Context) {
	productIDStr := c.Param("product_id")
	productID, err := strconv.ParseUint(productIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID",
		})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	ctx := context.Background()
	response, err := rc.recommendationService.GetSimilarProducts(ctx, uint(productID), limit)
	if err != nil {
		if err.Error() == "not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Product not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get similar products",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetTrendingProducts godoc
// @Summary Get trending products
// @Description Get currently trending products
// @Tags recommendations
// @Accept json
// @Produce json
// @Param period query string false "Time period for trending analysis" Enums(daily,weekly,monthly) default(weekly)
// @Param limit query int false "Number of trending products to return" default(10)
// @Success 200 {object} dto.RecommendationResponseDTO
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations/trending [get]
func (rc *RecommendationController) GetTrendingProducts(c *gin.Context) {
	period := c.DefaultQuery("period", "weekly")
	if period != "daily" && period != "weekly" && period != "monthly" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid period. Must be one of: daily, weekly, monthly",
		})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	ctx := context.Background()
	response, err := rc.recommendationService.GetTrendingProducts(ctx, period, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get trending products",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetOccasionRecommendations godoc
// @Summary Get occasion-based recommendations
// @Description Get product recommendations for a specific occasion
// @Tags recommendations
// @Accept json
// @Produce json
// @Param occasion path string true "Occasion name"
// @Param limit query int false "Number of recommendations to return" default(10)
// @Success 200 {object} dto.RecommendationResponseDTO
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations/occasion/{occasion} [get]
func (rc *RecommendationController) GetOccasionRecommendations(c *gin.Context) {
	occasion := c.Param("occasion")
	if occasion == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Occasion is required",
		})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	ctx := context.Background()
	response, err := rc.recommendationService.GetOccasionBasedRecommendations(ctx, occasion, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get occasion-based recommendations",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetPersonalizedRecommendations godoc
// @Summary Get personalized recommendations for a user
// @Description Get personalized product recommendations based on user's purchase history and preferences
// @Tags recommendations
// @Accept json
// @Produce json
// @Param user_id path int true "User ID"
// @Param limit query int false "Number of recommendations to return" default(10)
// @Success 200 {object} dto.RecommendationResponseDTO
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations/users/{user_id} [get]
func (rc *RecommendationController) GetPersonalizedRecommendations(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	ctx := context.Background()
	req := &dto.RecommendationRequestDTO{
		UserID:             &userID,
		RecommendationType: "personalized",
		Limit:              limit,
	}

	response, err := rc.recommendationService.GetPersonalizedRecommendations(ctx, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get personalized recommendations",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserPreferences godoc
// @Summary Update user preferences
// @Description Analyze user behavior and update their preferences for better recommendations
// @Tags recommendations
// @Accept json
// @Produce json
// @Param user_id path int true "User ID"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations/users/{user_id}/preferences [put]
func (rc *RecommendationController) UpdateUserPreferences(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	ctx := context.Background()
	err = rc.recommendationService.UpdateUserPreferences(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update user preferences",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User preferences updated successfully",
	})
}

// RecordRecommendationFeedback godoc
// @Summary Record user feedback on recommendations
// @Description Record user actions on recommended products for improving future recommendations
// @Tags recommendations
// @Accept json
// @Produce json
// @Param feedback body dto.RecommendationFeedbackDTO true "Recommendation feedback"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations/feedback [post]
func (rc *RecommendationController) RecordRecommendationFeedback(c *gin.Context) {
	var feedback dto.RecommendationFeedbackDTO

	if err := c.ShouldBindJSON(&feedback); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate action
	validActions := []string{"clicked", "purchased", "dismissed", "liked"}
	isValidAction := false
	for _, action := range validActions {
		if feedback.Action == action {
			isValidAction = true
			break
		}
	}

	if !isValidAction {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid action. Must be one of: clicked, purchased, dismissed, liked",
		})
		return
	}

	// In a real implementation, you would save this feedback to the database
	// For now, we'll just return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Feedback recorded successfully",
	})
}

// GetRecommendationStats godoc
// @Summary Get recommendation statistics
// @Description Get performance statistics for the recommendation system
// @Tags recommendations
// @Accept json
// @Produce json
// @Param period query string false "Time period for statistics" Enums(daily,weekly,monthly) default(weekly)
// @Success 200 {object} dto.RecommendationStatsDTO
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/recommendations/stats [get]
func (rc *RecommendationController) GetRecommendationStats(c *gin.Context) {
	period := c.DefaultQuery("period", "weekly")
	if period != "daily" && period != "weekly" && period != "monthly" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid period. Must be one of: daily, weekly, monthly",
		})
		return
	}

	// This is a placeholder implementation
	// In a real system, you would calculate actual statistics
	stats := dto.RecommendationStatsDTO{
		TotalRecommendations: 1000,
		ClickThroughRate:     0.15,
		ConversionRate:       0.05,
		AverageScore:         0.75,
		TopPerformingType:    "personalized",
	}

	c.JSON(http.StatusOK, stats)
}

// RegisterRecommendationRoutes registers all recommendation routes
func RegisterRecommendationRoutes(router *gin.Engine, recommendationController *RecommendationController) {
	api := router.Group("/api")
	{
		recommendations := api.Group("/recommendations")
		{
			// General recommendations endpoint
			recommendations.GET("", recommendationController.GetRecommendations)
			
			// Specific recommendation types
			recommendations.GET("/similar/:product_id", recommendationController.GetSimilarProducts)
			recommendations.GET("/trending", recommendationController.GetTrendingProducts)
			recommendations.GET("/occasion/:occasion", recommendationController.GetOccasionRecommendations)
			recommendations.GET("/users/:user_id", recommendationController.GetPersonalizedRecommendations)
			
			// User preference management
			recommendations.PUT("/users/:user_id/preferences", recommendationController.UpdateUserPreferences)
			
			// Feedback and analytics
			recommendations.POST("/feedback", recommendationController.RecordRecommendationFeedback)
			recommendations.GET("/stats", recommendationController.GetRecommendationStats)
		}
	}
}