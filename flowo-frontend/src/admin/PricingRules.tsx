import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/config/api";

/* ==================== Types ==================== */

type ApiRule = {
  rule_id?: number;
  rule_name: string;
  priority: number;
  adjustment_type: "percentage_discount" | "fixed_discount" | string;
  adjustment_value: number;

  // optional targets
  applicable_product_id?: number;
  applicable_flower_type_id?: number;
  applicable_product_status?: string;

  // schedule / date time
  time_of_day_start?: string; // "HH:MM:SS"
  time_of_day_end?: string;   // "HH:MM:SS"
  special_day_id?: number;

  valid_from?: string; // ISO
  valid_to?: string;   // ISO
  is_active: boolean;
};

type UIRule = {
  id: number;
  name: string;
  priority: number;
  type: "Fixed Discount" | "Percentage Discount" | string;
  rawType: ApiRule["adjustment_type"];
  value: number; // % or $
  productStatus?: string;
  validFrom?: string; // ISO
  validTo?: string;   // ISO
  timeStart?: string; // HH:MM:SS
  timeEnd?: string;   // HH:MM:SS
  active: boolean;

  productId?: number;
  flowerTypeId?: number;
  specialDayId?: number;
};

type ApiEnvelope<T> = { message?: string; data?: T };

/* ==================== Helpers ==================== */

const mapApiToUI = (r: ApiRule): UIRule => ({
  id: Number(r.rule_id ?? 0),
  name: r.rule_name,
  priority: Number(r.priority ?? 0),
  rawType: r.adjustment_type,
  type:
    r.adjustment_type === "fixed_discount"
      ? "Fixed Discount"
      : r.adjustment_type === "percentage_discount"
      ? "Percentage Discount"
      : r.adjustment_type || "—",
  value: Number(r.adjustment_value ?? 0),
  productStatus: r.applicable_product_status,
  validFrom: r.valid_from,
  validTo: r.valid_to,
  timeStart: r.time_of_day_start,
  timeEnd: r.time_of_day_end,
  active: Boolean(r.is_active),
  productId: r.applicable_product_id,
  flowerTypeId: r.applicable_flower_type_id,
  specialDayId: r.special_day_id,
});

const mapUIToApi = (u: Partial<UIRule>): ApiRule => ({
  rule_id: u.id,
  rule_name: u.name || "",
  priority: Number(u.priority || 0),
  adjustment_type: u.rawType || (u.type?.includes("Fixed") ? "fixed_discount" : "percentage_discount"),
  adjustment_value: Number(u.value || 0),
  applicable_product_status: u.productStatus || undefined,
  applicable_product_id: u.productId || undefined,
  applicable_flower_type_id: u.flowerTypeId || undefined,
  special_day_id: u.specialDayId || undefined,
  time_of_day_start: u.timeStart || "00:00:00",
  time_of_day_end: u.timeEnd || "23:59:59",
  valid_from: u.validFrom,
  valid_to: u.validTo,
  is_active: Boolean(u.active),
});

const money = (n: number) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

/** combine local date (YYYY-MM-DD) + time (HH:MM:SS) => ISO string (UTC) */
function toISO(date: string, time: string) {
  if (!date) return undefined;
  const t = time && /^\d{2}:\d{2}/.test(time) ? time : "00:00:00";
  const d = new Date(`${date}T${t}`);
  return d.toISOString();
}

/** extract YYYY-MM-DD from ISO */
function dateOnly(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/* ==================== Small UI bits ==================== */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs border border-emerald-200">
      {children}
    </span>
  );
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs border ${
        on
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-green-600" : "bg-slate-500"}`} />
      {on ? "Active" : "Inactive"}
    </span>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[92vw] max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Confirm({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Cancel
        </button>
        <button onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">
          Delete
        </button>
      </div>
    </Modal>
  );
}

/* ==================== Create/Edit Form ==================== */

function RuleForm({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial?: Partial<UIRule>;
  onClose: () => void;
  onSaved: (r: UIRule) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [priority, setPriority] = useState<number | string>(initial?.priority ?? 0);
  const [rawType, setRawType] = useState<ApiRule["adjustment_type"]>(initial?.rawType || "percentage_discount");
  const [value, setValue] = useState<number | string>(initial?.value ?? "");
  const [productStatus, setProductStatus] = useState(initial?.productStatus ?? "");
  const [validFromDate, setValidFromDate] = useState(dateOnly(initial?.validFrom));
  const [validToDate, setValidToDate] = useState(dateOnly(initial?.validTo));
  const [timeStart, setTimeStart] = useState(initial?.timeStart ?? "00:00:00");
  const [timeEnd, setTimeEnd] = useState(initial?.timeEnd ?? "23:59:59");
  const [active, setActive] = useState(Boolean(initial?.active ?? true));

  const [productId, setProductId] = useState<number | string>(initial?.productId ?? "");
  const [flowerTypeId, setFlowerTypeId] = useState<number | string>(initial?.flowerTypeId ?? "");
  const [specialDayId, setSpecialDayId] = useState<number | string>(initial?.specialDayId ?? "");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!name.trim()) return setErr("Rule name is required");
    if (!value && value !== 0) return setErr("Value is required");

    const payload = mapUIToApi({
      id: initial?.id,
      name: name.trim(),
      priority: Number(priority || 0),
      rawType,
      value: Number(value || 0),
      productStatus: productStatus || undefined,
      validFrom: toISO(validFromDate, timeStart || "00:00:00"),
      validTo: toISO(validToDate, timeEnd || "23:59:59"),
      timeStart,
      timeEnd,
      active,
      productId: productId ? Number(productId) : undefined,
      flowerTypeId: flowerTypeId ? Number(flowerTypeId) : undefined,
      specialDayId: specialDayId ? Number(specialDayId) : undefined,
    });

    try {
      setSaving(true);

      const url = mode === "create" ? api("/pricing/rule") : api(`/pricing/rule/${initial?.id}`);
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }

      const created = (Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data) || parsed;
      onSaved(mapApiToUI(created as ApiRule));
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">{err}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Rule Name</label>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Priority</label>
          <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Type</label>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={rawType}
                  onChange={(e) => setRawType(e.target.value as any)}>
            <option value="percentage_discount">Percentage Discount</option>
            <option value="fixed_discount">Fixed Discount</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Value {rawType === "percentage_discount" ? "(%)" : "($)"}
          </label>
          <input type="number" step="0.01" className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Product Status</label>
          <input list="status-options"
                 className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={productStatus ?? ""} onChange={(e) => setProductStatus(e.target.value)}
                 placeholder="NewFlower / Standard / Premium…" />
          <datalist id="status-options">
            <option value="NewFlower" />
            <option value="Standard" />
            <option value="Premium" />
            <option value="OldFlower" />
            <option value="LowStock" />
          </datalist>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Valid From</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={validFromDate} onChange={(e) => setValidFromDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Valid To</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={validToDate} onChange={(e) => setValidToDate(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Time Start (HH:MM:SS)</label>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={timeStart} onChange={(e) => setTimeStart(e.target.value)} placeholder="00:00:00" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Time End (HH:MM:SS)</label>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} placeholder="23:59:59" />
        </div>
        <div className="flex items-end gap-2">
          <input id="active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm text-slate-700">Active</label>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Product ID (optional)</label>
          <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={productId} onChange={(e) => setProductId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Flower Type ID (optional)</label>
          <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={flowerTypeId} onChange={(e) => setFlowerTypeId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Special Day ID (optional)</label>
          <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2"
                 value={specialDayId} onChange={(e) => setSpecialDayId(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
                className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-60">
          {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}

/* ==================== Main Page ==================== */

export default function PricingRules() {
  const [rows, setRows] = useState<UIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // controls
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"priority" | "name">("priority");

  // pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // modals
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UIRule | null>(null);
  const [toDelete, setToDelete] = useState<UIRule | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(api("/pricing/rules"), {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const raw = await res.text();
      if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

      let parsed: ApiEnvelope<ApiRule[]> | ApiRule[];
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("Invalid JSON from /pricing/rules");
      }
      const list = (Array.isArray(parsed) ? parsed : parsed.data ?? []).map(mapApiToUI);
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || "Failed to load pricing rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = rows;

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(s) ||
          r.productStatus?.toLowerCase().includes(s) ||
          String(r.priority).includes(s)
      );
    }

    if (status !== "all") {
      const wantActive = status === "active";
      list = list.filter((r) => r.active === wantActive);
    }

    list = [...list].sort((a, b) => {
      if (sort === "priority") return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [rows, q, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCreated(r: UIRule) {
    setRows((prev) => [r, ...prev]);
    setShowCreate(false);
    setPage(1);
  }

  function handleEdited(r: UIRule) {
    setRows((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    setEditing(null);
  }

  async function doDelete() {
    if (!toDelete) return;
    try {
      const res = await fetch(api(`/pricing/rule/${toDelete.id}`), {
        method: "DELETE",
        headers: { accept: "application/json" },
        credentials: "include",
      });
      const raw = await res.text();
      if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);
      setRows((prev) => prev.filter((x) => x.id !== toDelete.id));
      setToDelete(null);
    } catch (e: any) {
      alert(e?.message || "Failed to delete rule");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Pricing Rules</h1>
          <p className="text-slate-600">Create, edit, and manage dynamic pricing.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
        >
          + Add New Rule
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 pr-9 w-72"
            placeholder="Search rules…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <span className="absolute right-3 top-2.5 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
        </div>

        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="priority">Sort by Priority</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Rule Name</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Value</th>
              <th className="px-4 py-3 text-left">Product Status</th>
              <th className="px-4 py-3 text-left">Valid Period</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
            )}
            {err && !loading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-rose-600">{err}</td></tr>
            )}
            {!loading && !err && pageRows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No rules found.</td></tr>
            )}

            {!loading && !err && pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{r.name}</div>
                  <div className="text-slate-400 text-xs">ID: {r.id}</div>
                </td>
                <td className="px-4 py-3"><Badge>{r.priority}</Badge></td>
                <td className="px-4 py-3 text-slate-900">{r.type}</td>
                <td className="px-4 py-3 text-slate-900">
                  {r.rawType === "fixed_discount" ? money(r.value) : `${r.value}%`}
                </td>
                <td className="px-4 py-3">
                  {r.productStatus ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs border border-slate-200">
                      {r.productStatus}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {fmtDate(r.validFrom)} to {fmtDate(r.validTo)}
                </td>
                <td className="px-4 py-3"><StatusDot on={r.active} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(r)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setToDelete(r)}
                      className="rounded-md bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !err && filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Rule">
        <RuleForm mode="create" onClose={() => setShowCreate(false)} onSaved={handleCreated} />
      </Modal>

      {/* Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit: ${editing.name}` : "Edit Rule"}>
        {editing && (
          <RuleForm
            mode="edit"
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={handleEdited}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Confirm
        open={!!toDelete}
        title="Delete pricing rule"
        message={toDelete ? `Delete “${toDelete.name}”? This action cannot be undone.` : ""}
        onCancel={() => setToDelete(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
