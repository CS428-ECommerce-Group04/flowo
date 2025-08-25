import { get } from "@/config/api";
import type {
  AdminSalesReportResponse,
  TopProductDTO,
} from "@/types/adminReport";

export async function fetchSalesReport(params: {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  group?: "day" | "week" | "month";
}) {
  const qs = new URLSearchParams();
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.group) qs.set("group", params.group);

  return get<AdminSalesReportResponse>(`/admin/reports/sales?${qs.toString()}`);
}

export async function fetchTopProducts(params: {
  start?: string;
  end?: string;
  sort?: "quantity" | "revenue";
  limit?: number; // <=100
}) {
  const qs = new URLSearchParams();
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.sort) qs.set("sort", params.sort);
  if (params.limit != null) qs.set("limit", String(params.limit));

  return get<TopProductDTO[]>(`/admin/reports/top-products?${qs.toString()}`);
}
