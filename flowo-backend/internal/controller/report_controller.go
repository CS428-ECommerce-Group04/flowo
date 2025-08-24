package controller

import (
	"flowo-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ReportController struct {
	reportService service.ReportService
}

func NewReportController(rs service.ReportService) *ReportController {
	return &ReportController{reportService: rs}
}

func (ctrl *ReportController) RegisterRoutes(rg *gin.RouterGroup) {
	admin := rg.Group("/admin/reports")

	admin.GET("/sales", ctrl.AdminSalesReport)
	admin.GET("/top-products", ctrl.AdminTopProducts)
}

// AdminSalesReport godoc
// @Summary Sales report (admin)
// @Description KPI + time-series doanh thu theo day/week/month
// @Tags admin-reports
// @Produce json
// @Security BearerAuth
// @Param start query string false "YYYY-MM-DD"
// @Param end   query string false "YYYY-MM-DD"
// @Param group query string false "day|week|month" default(day)
// @Success 200 {object} dto.AdminSalesReportResponse
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/admin/reports/sales [get]
func (ctrl *ReportController) AdminSalesReport(c *gin.Context) {
	start := c.Query("start")
	end := c.Query("end")
	group := c.DefaultQuery("group", "day")

	res, err := ctrl.reportService.GetSalesReport(start, end, group)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build sales report"})
		return
	}

	c.JSON(http.StatusOK, res)
}

// AdminTopProducts godoc
// @Summary Top selling products (admin)
// @Description Sản phẩm bán chạy theo quantity hoặc revenue
// @Tags admin-reports
// @Produce json
// @Security BearerAuth
// @Param start query string false "YYYY-MM-DD"
// @Param end   query string false "YYYY-MM-DD"
// @Param sort  query string false "quantity|revenue" default(revenue)
// @Param limit query int    false "Top N (<=100)" default(10)
// @Success 200 {array} dto.TopProductDTO
// @Failure 401 {object} model.Response
// @Failure 403 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/admin/reports/top-products [get]
func (ctrl *ReportController) AdminTopProducts(c *gin.Context) {
	start := c.Query("start")
	end := c.Query("end")
	sort := c.DefaultQuery("sort", "revenue")
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit <= 0 || limit > 100 {
		limit = 10
	}

	rows, err := ctrl.reportService.GetTopProducts(start, end, sort, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build top-products"})
		return
	}

	c.JSON(http.StatusOK, rows)
}
