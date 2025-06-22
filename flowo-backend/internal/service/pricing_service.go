package service

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
	"time"
)

type PricingService struct {
	Repo repository.PricingRuleRepository
}

func NewPricingService(repo repository.PricingRuleRepository) *PricingService {
	return &PricingService{Repo: repo}
}

func (s *PricingService) GetEffectivePrice(product model.Product, now time.Time) (float64, error) {
	rules, err := s.Repo.GetActiveRules()
	if err != nil {
		return product.BasePrice, err
	}

	var matched *model.PricingRule
	var highestPriority = -1

	for _, rule := range rules {
		if s.Repo.IsRuleApplicable(rule, product, now) && rule.Priority > highestPriority {

			matched = &rule
			highestPriority = rule.Priority
		}
	}

	price := product.BasePrice
	if matched != nil {
		switch matched.AdjustmentType {
		case "percentage_discount":
			price -= price * matched.AdjustmentValue / 100
		case "fixed_discount":
			price -= matched.AdjustmentValue
		case "override_price":
			price = matched.AdjustmentValue
		}
	}

	return price, nil
}

func (s *PricingService) CreatePricingRule(req dto.CreatePricingRuleRequest) error {
	rule := model.PricingRule{
		RuleName:                req.RuleName,
		Priority:                req.Priority,
		IsActive:                req.IsActive,
		AdjustmentType:          req.AdjustmentType,
		AdjustmentValue:         req.AdjustmentValue,
		ApplicableProductID:     intPtrToUint(req.ApplicableProductID),
		ApplicableFlowerTypeID:  req.ApplicableFlowerTypeID,
		ApplicableProductStatus: req.ApplicableProductStatus,
		SpecialDayID:            req.SpecialDayID,
	}

	if req.ValidFrom != nil {
		rule.ValidFrom = req.ValidFrom
	}
	if req.ValidTo != nil {
		rule.ValidTo = req.ValidTo
	}

	if req.TimeOfDayStart != nil {
		if t, err := time.Parse("15:04:05", *req.TimeOfDayStart); err == nil {
			formatted := t.Format("15:04:05")
			rule.TimeOfDayStart = &formatted
		}
	}
	if req.TimeOfDayEnd != nil {
		if t, err := time.Parse("15:04:05", *req.TimeOfDayEnd); err == nil {
			formatted := t.Format("15:04:05")
			rule.TimeOfDayEnd = &formatted
		}
	}

	return s.Repo.CreatePricingRule(rule)
}

func (s *PricingService) GetAllRules() ([]model.PricingRule, error) {
	return s.Repo.GetAllRules()
}

func (s *PricingService) UpdateRule(rule model.PricingRule) error {
	return s.Repo.UpdateRule(rule)
}

func (s *PricingService) DeleteRule(id int) error {
	return s.Repo.DeleteRule(id)
}

func intPtrToUint(ptr *int) *uint {
	if ptr == nil {
		return nil
	}
	val := uint(*ptr)
	return &val
}
