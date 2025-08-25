package dto

type SalesSummaryDTO struct {
	Orders  int     `json:"orders"`
	Revenue float64 `json:"revenue"`
	AOV     float64 `json:"aov"`
}

type SalesTimeseriesDTO struct {
	Period  string  `json:"period"`
	Orders  int     `json:"orders"`
	Revenue float64 `json:"revenue"`
}

type TopProductDTO struct {
	ProductID int64   `json:"product_id"`
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	Revenue   float64 `json:"revenue"`
}

type AdminSalesReportResponse struct {
	Summary    SalesSummaryDTO      `json:"summary"`
	Timeseries []SalesTimeseriesDTO `json:"timeseries"`
}
