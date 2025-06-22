package dto

import "time"

type PriceResponse struct {
	ProductID      int     `json:"product_id"`
	BasePrice      float64 `json:"base_price"`
	EffectivePrice float64 `json:"effective_price"`
}
type CreatePricingRuleRequest struct {
	RuleName                string     `json:"rule_name" binding:"required"`
	Priority                int        `json:"priority" binding:"required"`
	IsActive                bool       `json:"is_active"`
	AdjustmentType          string     `json:"adjustment_type" binding:"required,oneof=percentage_discount fixed_discount override_price"`
	AdjustmentValue         float64    `json:"adjustment_value" binding:"required"`
	ApplicableProductID     *int       `json:"applicable_product_id"`
	ApplicableFlowerTypeID  *int       `json:"applicable_flower_type_id"`
	ApplicableProductStatus *string    `json:"applicable_product_status"`
	TimeOfDayStart          *string    `json:"time_of_day_start"`
	TimeOfDayEnd            *string    `json:"time_of_day_end"`
	SpecialDayID            *int       `json:"special_day_id"`
	ValidFrom               *time.Time `json:"valid_from"`
	ValidTo                 *time.Time `json:"valid_to"`
}
