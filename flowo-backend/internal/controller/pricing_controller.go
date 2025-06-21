package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/service"
	"net/http"
	"time"

	"log"

	"github.com/gin-gonic/gin"
)

type PricingController struct {
	Service *service.PricingService
}

func NewPricingController(s *service.PricingService) *PricingController {
	return &PricingController{Service: s}
}

func (ctrl *PricingController) RegisterRoutes(rg *gin.RouterGroup) {
	pricing := rg.Group("/pricing")
	pricing.POST("/rule", ctrl.AddPricingRule)
}

// AddPricingRule godoc
// @Summary Add new pricing rule
// @Description Admin adds a new dynamic pricing rule
// @Tags pricing
// @Accept json
// @Produce json
// @Param rule body dto.CreatePricingRuleRequest true "New Pricing Rule"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/pricing/rule [post]
func (c *PricingController) AddPricingRule(ctx *gin.Context) {
	var req dto.CreatePricingRuleRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.Service.CreatePricingRule(req); err != nil {
		log.Println("❌ Failed to create rule:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pricing rule"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Pricing rule created successfully"})
}

func (c *PricingController) GetEffectivePrice(ctx *gin.Context) {
	var product model.Product
	if err := ctx.ShouldBindJSON(&product); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	price, err := c.Service.GetEffectivePrice(product, time.Now())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dto.PriceResponse{
		ProductID:      int(product.ProductID),
		BasePrice:      product.BasePrice,
		EffectivePrice: price,
	})
}
