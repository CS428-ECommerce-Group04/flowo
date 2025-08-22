package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/service"
	"log"
	"net/http"
	"strconv"
	"time"

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
	pricing.GET("/rules", ctrl.GetAllRules)
	pricing.PUT("/rule/:id", ctrl.UpdateRule)
	pricing.DELETE("/rule/:id", ctrl.DeleteRule)
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

// GetAllRules godoc
// @Summary Get all pricing rules
// @Description Retrieve a list of all pricing rules
// @Tags pricing
// @Produce json
// @Success 200 {array} model.PricingRule
// @Failure 500 {object} map[string]string
// @Router /api/v1/pricing/rules [get]
func (c *PricingController) GetAllRules(ctx *gin.Context) {
	rules, err := c.Service.GetAllRules()
	if err != nil {
		log.Printf("Failed to fetch rules: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch rules"})
		return
	}
	ctx.JSON(http.StatusOK, rules)
}

// UpdateRule godoc
// @Summary Update a pricing rule
// @Description Update an existing pricing rule by ID
// @Tags pricing
// @Accept json
// @Produce json
// @Param id path int true "Pricing rule ID"
// @Param rule body model.PricingRule true "Updated pricing rule"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/pricing/rule/{id} [put]
func (c *PricingController) UpdateRule(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	var req model.PricingRule
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.RuleID = id

	if err := c.Service.UpdateRule(req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update rule"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Rule updated successfully"})
}

// DeleteRule godoc
// @Summary Delete a pricing rule
// @Description Delete a pricing rule using its ID
// @Tags pricing
// @Produce json
// @Param id path int true "Pricing rule ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/pricing/rule/{id} [delete]
func (c *PricingController) DeleteRule(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	if err := c.Service.DeleteRule(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete rule"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Rule deleted successfully"})
}
