// src/pages/admin/AdminReports.tsx
import { useEffect, useMemo, useState } from "react";
import { fetchSalesReport, fetchTopProducts } from "@/config/adminReport";
import type {
  AdminSalesReportResponse,
  TopProductDTO,
} from "@/types/adminReport";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";


const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (d: number) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 10);
};

export default function AdminReports() {
  const [start, setStart] = useState(daysAgoISO(29)); 
  const [end, setEnd] = useState(todayISO());
  const [group, setGroup] = useState<"day" | "week" | "month">("day");

  // ---- filters riêng Best Sellers ----
  const [sort, setSort] = useState<"revenue" | "quantity">("revenue");
  const [limit, setLimit] = useState<number>(10);

  // ---- data state ----
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<AdminSalesReportResponse | null>(null);
  const [best, setBest] = useState<TopProductDTO[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const [rep, top] = await Promise.all([
          fetchSalesReport({ start, end, group }),
          fetchTopProducts({ start, end, sort, limit }),
        ]);
        if (!alive) return;
        setReport(rep);
        setBest(top);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load report");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [start, end, group, sort, limit, refreshKey]);

  const kpi = report?.summary;
  const chartData = report?.timeseries ?? [];

  const totalUnits = useMemo(
    () => best.reduce((s, it) => s + (it.quantity || 0), 0),
    [best]
  );
  const totalBestRevenue = useMemo(
    () => best.reduce((s, it) => s + (it.revenue || 0), 0),
    [best]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Filters */}
      <section className="bg-white shadow rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">End</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Group by</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>

          <div className="md:ml-auto flex gap-2">
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
              onClick={() => {
                setStart(daysAgoISO(29));
                setEnd(todayISO());
                setGroup("day");
                setSort("revenue");
                setLimit(10);
              }}
              type="button"
            >
              Reset
            </button>
            <button
              className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
              onClick={() => setRefreshKey((k) => k + 1)}
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Best-seller filters */}
        <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-end">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Best-seller sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="revenue">By Revenue</option>
              <option value="quantity">By Quantity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Top N</label>
            <input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(100, Number(e.target.value || 10))))}
              className="rounded-lg border border-slate-300 px-3 py-2 w-28"
            />
          </div>
        </div>
      </section>

      {/* Errors */}
      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {err}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
          <div className="md:col-span-2 h-80 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-80 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      )}

      {/* KPI cards */}
      {!loading && kpi && (
        <section className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <div className="text-slate-500 text-sm">Total Orders</div>
            <div className="text-2xl font-semibold text-slate-800 mt-1">
              {kpi.orders.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <div className="text-slate-500 text-sm">Revenue</div>
            <div className="text-2xl font-semibold text-slate-800 mt-1">
              {currency(kpi.revenue)}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <div className="text-slate-500 text-sm">Avg. Order Value</div>
            <div className="text-2xl font-semibold text-slate-800 mt-1">
              {currency(kpi.aov)}
            </div>
          </div>
        </section>
      )}

      {/* Chart + Best sellers */}
      {!loading && (
        <section className="grid lg:grid-cols-3 gap-4">
          {/* Timeseries */}
          <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Revenue over time</h3>
              <span className="text-xs text-slate-500">
                Grouped by {group}
              </span>
            </div>

            <div className="h-80 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(v: any, n: string) => (n === "revenue" ? currency(v) : v)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="orders" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Best Sellers */}
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Best Sellers</h3>
              <span className="text-xs text-slate-500">
                {sort === "revenue" ? "By Revenue" : "By Quantity"}
              </span>
            </div>

            <div className="mt-3 rounded border border-slate-200 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {best.map((p, i) => (
                    <tr key={p.product_id} className="border-t">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2 text-right">{p.quantity.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{currency(p.revenue)}</td>
                    </tr>
                  ))}
                  {best.length === 0 && (
                    <tr>
                      <td className="px-3 py-2 text-slate-500" colSpan={4}>
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
                {best.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t">
                      <td className="px-3 py-2 font-medium" colSpan={2}>Total</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {totalUnits.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {currency(totalBestRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
