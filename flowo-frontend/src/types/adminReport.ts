export type SalesSummaryDTO = {
  orders: number;
  revenue: number;
  aov: number;
};

export type SalesTimeseriesDTO = {
  period: string;     // "2025-08-01" | "2025-08-01" (day) | "2025-08-01" (month start) | "2024-W35"
  orders: number;
  revenue: number;
};

export type AdminSalesReportResponse = {
  summary: SalesSummaryDTO;
  timeseries: SalesTimeseriesDTO[];
};

export type TopProductDTO = {
  product_id: number; // json:"product_id"
  name: string;
  quantity: number;
  revenue: number;
};
