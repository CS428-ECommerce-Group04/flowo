import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_CONFIG } from "@/config/api";
import AdminOrderDetail from "./AdminOrderDetail";
import { makeApiRequest } from "@/config/api";



type ApiEnvelope<T> = { message?: string; data?: T };
type ApiOrder = {
  order_id: number;
  firebase_uid: string;
  total_amount: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled" | "Delivered" | string;
  order_date: string;
};

type UIOrder = {
  id: number;
  uid: string;
  total: number;
  status: string;
  dateISO: string;
};

const API_BASE = API_CONFIG.BASE_URL || "http://localhost:8081/api/v1";

const money = (n: number) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function StatusPill({ value }: { value: string }) {
  const v = value.toLowerCase();
  const tone =
    v === "pending"
      ? "bg-amber-100 text-amber-700"
      : v === "processing"
      ? "bg-blue-100 text-blue-700"
      : v === "completed"
      ? "bg-green-100 text-green-700"
      : v === "delivered"
      ? "bg-emerald-100 text-emerald-700"
      : v === "cancelled"
      ? "bg-rose-100 text-rose-700"
      : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {value}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "green",
}: {
  label: string;
  value: number | string;
  tone?: "green" | "teal" | "blue" | "amber";
}) {
  const tones: Record<string, string> = {
    green: "bg-green-50 text-green-800",
    teal: "bg-teal-50 text-teal-800",
    blue: "bg-blue-50 text-blue-800",
    amber: "bg-amber-50 text-amber-800",
  };
  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${tones[tone]}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

/* ------------------------------ Debug helpers ------------------------------ */

type DebugRecord = {
  url: string;
  method: string;
  requestHeaders?: Record<string, string>;
  status?: number;
  statusText?: string;
  responseUrl?: string;
  responseText?: string;
  error?: string;
  hint?: string;
  apiBase?: string;
  timestamp: string;
  online?: boolean;
};

function DebugPanel({ rec }: { rec: DebugRecord | null }) {
  const [open, setOpen] = useState(true);
  if (!rec) return null;
  return (
    <div className="fixed bottom-3 right-3 z-50 w-[min(95vw,700px)]">
      <div className="rounded-lg border border-slate-300 bg-white shadow">
        <div
          className="flex items-center justify-between px-3 py-2 border-b cursor-pointer"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="font-semibold text-slate-800">Orders Debug</div>
          <div className="text-xs text-slate-500">{rec.timestamp}</div>
        </div>
        {open && (
          <div className="p-3 text-xs text-slate-800 space-y-2 max-h-[50vh] overflow-auto">
            <div><b>API_BASE:</b> {rec.apiBase}</div>
            <div><b>Request URL:</b> {rec.url}</div>
            <div><b>Method:</b> {rec.method}</div>
            <div><b>Online:</b> {String(rec.online)}</div>
            {rec.requestHeaders && (
              <div>
                <b>Request Headers:</b>
                <pre className="bg-slate-50 p-2 rounded border">{JSON.stringify(rec.requestHeaders, null, 2)}</pre>
              </div>
            )}
            {rec.status !== undefined && (
              <div>
                <b>Status:</b> {rec.status} {rec.statusText ?? ""}
              </div>
            )}
            {rec.responseUrl && (
              <div><b>Response URL:</b> {rec.responseUrl}</div>
            )}
            {rec.responseText && (
              <div>
                <b>Response Text (first 800 chars):</b>
                <pre className="bg-slate-50 p-2 rounded border whitespace-pre-wrap break-words">
                  {rec.responseText.slice(0, 800)}
                </pre>
              </div>
            )}
            {rec.error && (
              <div className="text-rose-700"><b>Error:</b> {rec.error}</div>
            )}
            {rec.hint && (
              <div className="text-amber-700"><b>Hint:</b> {rec.hint}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[92vw] max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EditOrderModal({
  order, onClose, onSaved,
}: {
  order: UIOrder;
  onClose: () => void;
  onSaved: (newStatus: string) => void;
}) {
  const [status, setStatus] = useState<string>(order.status);
  const [shipping, setShipping] = useState<string>("Standard");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    try {
      setSaving(true);
      await makeApiRequest(`/admin/orders/${order.id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          shipping_method: shipping,
          status: status, // Allowed: Pending | Processing | Completed | Cancelled | Delivered
        }),
      });
      setOk("Updated successfully.");
      onSaved(status);
    } catch (e: any) {
      setErr(e?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!order} onClose={onClose} title={`Edit Order #${order.id.toString().padStart(6, "0")}`}>
      <form onSubmit={handleSave} className="space-y-4">
        {err && <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">{err}</div>}
        {ok && <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">{ok}</div>}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Status</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Shipping Method</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            >
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------- Component -------------------------------- */

export default function AdminOrders() {
  const location = useLocation();
  const DEBUG_ON =
    new URLSearchParams(location.search).has("debug") ||
    (typeof localStorage !== "undefined" && localStorage.getItem("debug-orders") === "1");

  const [rows, setRows] = useState<UIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [editing, setEditing] = useState<UIOrder | null>(null);



  // controls
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "processing" | "completed" | "cancelled" | "delivered">(
    "all",
  );
  const [sort, setSort] = useState<"date-desc" | "date-asc" | "total-desc" | "total-asc">("date-desc");

  const [debugRec, setDebugRec] = useState<DebugRecord | null>(null);

  async function load() {
    const url = `${API_BASE}/admin/orders`;
    const rec: DebugRecord = {
      url,
      apiBase: API_BASE,
      method: "GET",
      requestHeaders: { Accept: "application/json", Credentials: "include" },
      timestamp: new Date().toLocaleString(),
      online: navigator.onLine,
    };

    // Heuristic: detect duplicate /api/v1/api/v1 in the URL
    if (url.replace(/https?:\/\/[^/]+/, "").includes("/api/v1/api/v1/")) {
      rec.hint =
        "The request URL contains '/api/v1/api/v1'. This usually means API_BASE already includes '/api/v1' and you appended it again.";
    }

    if (DEBUG_ON) {
      console.debug("[Orders] Fetching:", { API_BASE, url });
    }

    setLoading(true);
    setErr(null);
    setDebugRec(rec);
    (window as any).__ORDERS_DEBUG__ = rec;

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
        // mode: "cors" // usually default; uncomment if you want to be explicit
      });

      rec.status = res.status;
      rec.statusText = res.statusText;
      rec.responseUrl = res.url;

      // Read once as text so we can show it if JSON fails
      const text = await res.text();
      rec.responseText = text;

      if (!res.ok) {
        // Provide helpful hints by status
        if (res.status === 404) {
          rec.hint = rec.hint || "404 Not Found. Check the path on the server and your API_BASE.";
        } else if (res.status === 401 || res.status === 403) {
          rec.hint =
            rec.hint ||
            "Unauthorized/Forbidden. If your API requires cookies, make sure it sets CORS headers with 'Access-Control-Allow-Credentials: true' and a specific 'Access-Control-Allow-Origin' (not '*'), and the auth cookie is 'SameSite=None; Secure'.";
        }
        throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
      }

      let parsed: ApiEnvelope<ApiOrder[]> | ApiOrder[];
      try {
        parsed = text ? JSON.parse(text) : [];
      } catch {
        rec.hint =
          rec.hint ||
          "Response was not valid JSON. Ensure the server returns 'application/json' and valid JSON content.";
        throw new Error("Invalid JSON from /admins/orders");
      }

      const list: ApiOrder[] = Array.isArray(parsed) ? parsed : parsed.data ?? [];
      setRows(
        list.map((o) => ({
          id: o.order_id,
          uid: o.firebase_uid,
          total: Number(o.total_amount || 0),
          status: o.status,
          dateISO: o.order_date,
        })),
      );
    } catch (e: any) {
      // Network errors are usually CORS or connectivity
      if (String(e?.name) === "TypeError" && String(e?.message).includes("Failed to fetch")) {
        rec.hint =
          rec.hint ||
          "Network error. Common causes: CORS misconfiguration, server not running, or mixed-content (HTTP API on an HTTPS page). Check the Network tab.";
      }
      rec.error = e?.message || String(e);
      setErr(rec.error);
    } finally {
      setLoading(false);
      setDebugRec({ ...rec });
      (window as any).__ORDERS_DEBUG__ = { ...rec };
      if (DEBUG_ON) {
        console.debug("[Orders] Debug record:", rec);
      }
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = rows;

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (r) => String(r.id).includes(s) || r.uid.toLowerCase().includes(s) || r.status.toLowerCase().includes(s),
      );
    }

    if (status !== "all") list = list.filter((r) => r.status.toLowerCase() === status);

    switch (sort) {
      case "date-asc":
        list = [...list].sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
        break;
      case "total-desc":
        list = [...list].sort((a, b) => b.total - a.total);
        break;
      case "total-asc":
        list = [...list].sort((a, b) => a.total - b.total);
        break;
      default:
        list = [...list].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
    }

    return list;
  }, [rows, q, status, sort]);

  const stats = useMemo(() => {
    const totalOrders = rows.length;
    const pending = rows.filter((r) => r.status.toLowerCase() === "pending").length;
    const completed = rows.filter((r) => r.status.toLowerCase() === "completed").length;
    const revenue = rows
      .filter((r) => ["completed", "delivered"].includes(r.status.toLowerCase()))
      .reduce((sum, r) => sum + r.total, 0);
    return { totalOrders, pending, completed, revenue };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Orders</h1>
        <p className="text-slate-600 mt-1">View and manage orders.</p>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-green-700"
              placeholder="Search by order id, UID or status…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="absolute right-3 top-2.5 text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
          </div>

          <select className="rounded-lg border border-slate-300 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="delivered">Delivered</option>
          </select>

          <select className="rounded-lg border border-slate-300 px-3 py-2" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="date-desc">Sort by Date (newest)</option>
            <option value="date-asc">Sort by Date (oldest)</option>
            <option value="total-desc">Sort by Total (high→low)</option>
            <option value="total-asc">Sort by Total (low→high)</option>
          </select>

          <button className="rounded-lg bg-white border border-slate-300 px-3 py-2 hover:bg-slate-50" onClick={load} title="Refresh">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 12a9 9 0 01-9 9 9 9 0 110-18 9 9 0 018 5" strokeWidth="2" />
              <path d="M21 3v6h-6" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Customer UID</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Loading orders…
                </td>
              </tr>
            )}
            {err && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-rose-600">
                  {err}
                </td>
              </tr>
            )}
            {!loading && !err && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No orders found.
                </td>
              </tr>
            )}

            {!loading &&
              !err &&
              filtered.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3 text-slate-800 font-medium">ORD-{o.id.toString().padStart(6, "0")}</td>
                  <td className="px-4 py-3">{o.uid}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(o.dateISO)}</td>
                  <td className="px-4 py-3">
                    <StatusPill value={o.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-semibold">{money(o.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setViewing(o.id)}
                        className="px-3 py-1.5 rounded-lg text-slate-700 border border-slate-300 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setEditing(o)} 
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
                      >
                        Edit
                      </button>
                    </div>         
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.totalOrders} tone="green" />
        <StatCard label="Pending Orders" value={stats.pending} tone="amber" />
        <StatCard label="Revenue" value={money(stats.revenue)} tone="teal" />
        <StatCard label="Completed" value={stats.completed} tone="blue" />
      </div>

      {/* Debug panel (only when enabled) */}
      {DEBUG_ON && <DebugPanel rec={debugRec} />}

      {viewing && (
      <AdminOrderDetail
        orderId={viewing}
        onClose={() => setViewing(null)}
      />
      )}

      {editing && (
      <EditOrderModal
        order={editing}
        onClose={() => setEditing(null)}
        onSaved={(newStatus) => {
          setRows(prev => prev.map(r => r.id === editing.id ? { ...r, status: newStatus } : r));
          setEditing(null);
        }}
      />
      )}

    </div>
  );
}
