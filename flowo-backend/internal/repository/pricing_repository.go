package repository

import (
	"database/sql"
	"flowo-backend/internal/model"
	"time"
)

type PricingRuleRepository interface {
	GetActiveRules() ([]model.PricingRule, error)
	IsRuleApplicable(rule model.PricingRule, product model.Product, now time.Time) bool
	CreatePricingRule(rule model.PricingRule) error
	GetAllRules() ([]model.PricingRule, error)
	UpdateRule(rule model.PricingRule) error
	DeleteRule(id int) error
}

type pricingRuleRepository struct {
	DB            *sql.DB
	flowerTypeMap map[string]int
}

func GetAllFlowerTypes(db *sql.DB) (map[string]int, error) {
	rows, err := db.Query("SELECT name ,flower_type_id FROM FlowerType")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	flowerTypeMap := make(map[string]int)
	for rows.Next() {
		var name string
		var id int
		if err := rows.Scan(&name, &id); err != nil {
			return nil, err
		}
		flowerTypeMap[name] = id
	}
	return flowerTypeMap, nil
}

func NewPricingRuleRepository(db *sql.DB) (PricingRuleRepository, error) {
	flowerTypeMap, err := GetAllFlowerTypes(db)
	if err != nil {
		return nil, err
	}

	return &pricingRuleRepository{
		DB:            db,
		flowerTypeMap: flowerTypeMap,
	}, nil
}

func (r *pricingRuleRepository) GetActiveRules() ([]model.PricingRule, error) {
	rows, err := r.DB.Query(`SELECT rule_id, rule_name, priority, adjustment_type, adjustment_value,
		applicable_product_id, applicable_flower_type_id, applicable_product_status,
		time_of_day_start, time_of_day_end, special_day_id,
		valid_from, valid_to, is_active FROM PricingRule WHERE is_active = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	rules, err := scanRules(rows)
	return rules, err
}

func (r *pricingRuleRepository) IsRuleApplicable(rule model.PricingRule, product model.Product, now time.Time) bool {
	if rule.ApplicableProductID != nil && *rule.ApplicableProductID != product.ProductID {
		return false
	}

	flowerTypeID, ok := r.flowerTypeMap[product.FlowerType]
	if !ok {
		return false
	}

	if rule.ApplicableFlowerTypeID != nil && *rule.ApplicableFlowerTypeID != flowerTypeID {
		return false
	}

	if rule.ApplicableProductStatus != nil && *rule.ApplicableProductStatus != product.Status {
		return false
	}

	if rule.TimeOfDayStart != nil && rule.TimeOfDayEnd != nil {
		timeStr := now.Format("15:04:05")
		if timeStr < *rule.TimeOfDayStart || timeStr > *rule.TimeOfDayEnd {
			return false
		}
	}

	if rule.ValidFrom != nil && now.Before(*rule.ValidFrom) {
		return false
	}

	if rule.ValidTo != nil && now.After(*rule.ValidTo) {
		return false
	}

	return true
}

func (r *pricingRuleRepository) CreatePricingRule(rule model.PricingRule) error {
	query := `
		INSERT INTO PricingRule (
			rule_name, priority, adjustment_type, adjustment_value,
			applicable_product_id, applicable_flower_type_id, applicable_product_status,
			time_of_day_start, time_of_day_end, special_day_id,
			valid_from, valid_to, is_active
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.DB.Exec(
		query,
		rule.RuleName,
		rule.Priority,
		rule.AdjustmentType,
		rule.AdjustmentValue,
		nullInt(uintPtrToInt(rule.ApplicableProductID)),
		nullInt(rule.ApplicableFlowerTypeID),
		nullString(rule.ApplicableProductStatus),
		nullString(rule.TimeOfDayStart),
		nullString(rule.TimeOfDayEnd),
		nullInt(rule.SpecialDayID),
		nullTime(rule.ValidFrom),
		nullTime(rule.ValidTo),
		rule.IsActive,
	)

	return err
}

func (r *pricingRuleRepository) GetAllRules() ([]model.PricingRule, error) {
	query := `
		SELECT 
			rule_id, rule_name, priority, adjustment_type, adjustment_value,
			applicable_product_id, applicable_flower_type_id, applicable_product_status,
			time_of_day_start, time_of_day_end, special_day_id,
			valid_from, valid_to, is_active
		FROM PricingRule
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanRules(rows)
}

func (r *pricingRuleRepository) UpdateRule(rule model.PricingRule) error {
	_, err := r.DB.Exec(`
		UPDATE PricingRule SET 
			rule_name=?, priority=?, is_active=?, adjustment_type=?, adjustment_value=?,
			applicable_product_id=?, applicable_flower_type_id=?, applicable_product_status=?,
			time_of_day_start=?, time_of_day_end=?, special_day_id=?, valid_from=?, valid_to=?
		WHERE rule_id=?`,
		rule.RuleName, rule.Priority, rule.IsActive, rule.AdjustmentType, rule.AdjustmentValue,
		rule.ApplicableProductID, rule.ApplicableFlowerTypeID, rule.ApplicableProductStatus,
		rule.TimeOfDayStart, rule.TimeOfDayEnd, rule.SpecialDayID,
		rule.ValidFrom, rule.ValidTo,
		rule.RuleID,
	)
	return err
}

func (r *pricingRuleRepository) DeleteRule(id int) error {
	_, err := r.DB.Exec("DELETE FROM PricingRule WHERE rule_id = ?", id)
	return err
}

func scanRules(rows *sql.Rows) ([]model.PricingRule, error) {
	rules := []model.PricingRule{}
	for rows.Next() {
		var rule model.PricingRule
		var validFrom, validTo sql.NullTime
		var prodID, typeID, specialDayID sql.NullInt64
		var status, timeStart, timeEnd sql.NullString

		err := rows.Scan(
			&rule.RuleID, &rule.RuleName, &rule.Priority, &rule.AdjustmentType,
			&rule.AdjustmentValue, &prodID, &typeID, &status,
			&timeStart, &timeEnd, &specialDayID,
			&validFrom, &validTo, &rule.IsActive,
		)
		if err != nil {
			return nil, err
		}

		if prodID.Valid {
			v := uint(prodID.Int64)
			rule.ApplicableProductID = &v
		}
		if typeID.Valid {
			v := int(typeID.Int64)
			rule.ApplicableFlowerTypeID = &v
		}
		if status.Valid {
			rule.ApplicableProductStatus = &status.String
		}
		if timeStart.Valid {
			rule.TimeOfDayStart = &timeStart.String
		}
		if timeEnd.Valid {
			rule.TimeOfDayEnd = &timeEnd.String
		}
		if specialDayID.Valid {
			v := int(specialDayID.Int64)
			rule.SpecialDayID = &v
		}
		if validFrom.Valid {
			rule.ValidFrom = &validFrom.Time
		}
		if validTo.Valid {
			rule.ValidTo = &validTo.Time
		}

		rules = append(rules, rule)
	}
	return rules, nil
}

func nullInt(ptr *int) interface{} {
	if ptr != nil {
		return *ptr
	}
	return nil
}

func nullString(ptr *string) interface{} {
	if ptr != nil {
		return *ptr
	}
	return nil
}

func nullTime(ptr *time.Time) interface{} {
	if ptr != nil {
		return *ptr
	}
	return nil
}

func uintPtrToInt(u *uint) *int {
	if u == nil {
		return nil
	}
	val := int(*u)
	return &val
}
