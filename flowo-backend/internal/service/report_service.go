package service

import (
	"time"

	"flowo-backend/internal/dto"
	"flowo-backend/internal/repository"
)

type ReportService interface {
	GetSalesReport(start, end, groupBy string) (dto.AdminSalesReportResponse, error)
	GetTopProducts(start, end, sortBy string, limit int) ([]dto.TopProductDTO, error)
}

type reportService struct {
	repo repository.ReportRepository
}

func NewReportService(r repository.ReportRepository) ReportService {
	return &reportService{repo: r}
}

// ============================
// Helpers
// ============================
func normalizeDates(start, end string) (string, string) {
	today := time.Now().Format("2006-01-02")
	if end == "" {
		end = today
	}
	if start == "" {
		startTime, _ := time.Parse("2006-01-02", end)
		start = startTime.AddDate(0, 0, -29).Format("2006-01-02") // mặc định 30 ngày
	}
	return start, end
}

// ============================
// Sales Report
// ============================
func (s *reportService) GetSalesReport(start, end, groupBy string) (dto.AdminSalesReportResponse, error) {
	start, end = normalizeDates(start, end)

	summary, err := s.repo.GetSalesSummary(start, end)
	if err != nil {
		return dto.AdminSalesReportResponse{}, err
	}

	points, err := s.repo.GetSalesTimeseries(start, end, groupBy)
	if err != nil {
		return dto.AdminSalesReportResponse{}, err
	}

	return dto.AdminSalesReportResponse{
		Summary:    summary,
		Timeseries: points,
	}, nil
}

// ============================
// Top Products
// ============================
func (s *reportService) GetTopProducts(start, end, sortBy string, limit int) ([]dto.TopProductDTO, error) {
	start, end = normalizeDates(start, end)
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	products, err := s.repo.GetTopProducts(start, end, sortBy, limit)
	if err != nil {
		return nil, err
	}

	return products, nil
}
