package model

import "time"

type PricingRule struct {
	RuleID                  int        `json:"rule_id"`
	RuleName                string     `json:"rule_name"`
	Priority                int        `json:"priority"`
	AdjustmentType          string     `json:"adjustment_type"`
	AdjustmentValue         float64    `json:"adjustment_value"`
	ApplicableProductID     *uint      `json:"applicable_product_id,omitempty"`
	ApplicableFlowerTypeID  *int       `json:"applicable_flower_type_id,omitempty"`
	ApplicableProductStatus *string    `json:"applicable_product_status,omitempty"`
	TimeOfDayStart          *string    `json:"time_of_day_start,omitempty"`
	TimeOfDayEnd            *string    `json:"time_of_day_end,omitempty"`
	SpecialDayID            *int       `json:"special_day_id,omitempty"`
	ValidFrom               *time.Time `json:"valid_from,omitempty"`
	ValidTo                 *time.Time `json:"valid_to,omitempty"`
	IsActive                bool       `json:"is_active"`
}
