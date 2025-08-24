package repository

import (
	"database/sql"
	"flowo-backend/internal/dto"
	"fmt"
)

type ReportRepository interface {
	GetSalesSummary(start, end string) (dto.SalesSummaryDTO, error)
	GetSalesTimeseries(start, end, groupBy string) ([]dto.SalesTimeseriesDTO, error)
	GetTopProducts(start, end, sortBy string, limit int) ([]dto.TopProductDTO, error)
}

type reportRepository struct {
	DB *sql.DB
}

func NewReportRepository(db *sql.DB) ReportRepository {
	return &reportRepository{DB: db}
}

// ============================
// Sales Summary
// ============================
func (r *reportRepository) GetSalesSummary(start, end string) (dto.SalesSummaryDTO, error) {
	q := "SELECT COUNT(*) AS orders, COALESCE(SUM(o.final_total_amount),0) AS revenue, COALESCE(AVG(o.final_total_amount),0) AS aov FROM `Order` o WHERE o.status = 'Completed' AND DATE(o.order_date) BETWEEN ? AND ?"

	var res dto.SalesSummaryDTO
	err := r.DB.QueryRow(q, start, end).Scan(&res.Orders, &res.Revenue, &res.AOV)
	return res, err
}

// ============================
// Sales Timeseries
// ============================
func (r *reportRepository) GetSalesTimeseries(start, end, groupBy string) ([]dto.SalesTimeseriesDTO, error) {
	q := "SELECT DATE_FORMAT(o.order_date, ?) AS period, COUNT(*) AS orders, COALESCE(SUM(o.final_total_amount),0) AS revenue FROM `Order` o WHERE o.status = 'Completed' AND DATE(o.order_date) BETWEEN ? AND ? GROUP BY period ORDER BY period"

	rows, err := r.DB.Query(q, groupBy, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []dto.SalesTimeseriesDTO
	for rows.Next() {
		var item dto.SalesTimeseriesDTO
		if err := rows.Scan(&item.Period, &item.Orders, &item.Revenue); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

// ============================
// Top Products
// ============================
func (r *reportRepository) GetTopProducts(start, end, sortBy string, limit int) ([]dto.TopProductDTO, error) {
	var orderBy string
	switch sortBy {
	case "quantity":
		orderBy = "quantity"
	default:
		orderBy = "revenue"
	}

	q := fmt.Sprintf("SELECT p.product_id, p.name, COALESCE(SUM(oi.quantity),0) AS quantity, COALESCE(SUM(oi.item_subtotal),0) AS revenue FROM OrderItem oi JOIN FlowerProduct p ON oi.product_id = p.product_id JOIN `Order` o ON oi.order_id = o.order_id WHERE o.status = 'Completed' AND DATE(o.order_date) BETWEEN ? AND ? GROUP BY p.product_id, p.name ORDER BY %s DESC LIMIT ?", orderBy)

	rows, err := r.DB.Query(q, start, end, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []dto.TopProductDTO
	for rows.Next() {
		var item dto.TopProductDTO
		if err := rows.Scan(&item.ProductID, &item.Name, &item.Quantity, &item.Revenue); err != nil {
			return nil, err
		}
		out = append(out, item)
	}

	return out, nil
}
