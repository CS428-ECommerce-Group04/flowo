import React, { useEffect, useMemo, useState } from "react";

/* ==================== Types & API config ==================== */

type ApiEnvelope<T> = { message?: string; data: T };

type ApiProduct = {
  id?: number;
  product_id?: number;
  name: string;
  description?: string;
  base_price?: number;
  effective_price?: number;
  price?: number;
  status?: "NewFlower" | "OldFlower" | "LowStock" | string;
  flower_type?: string;
  stock_quantity?: number;
  created_at?: string;
  updated_at?: string;
};

type UIProduct = {
  id: number;
  name: string;
  description: string;
  basePrice?: number;
  price: number;
  status?: string;
  flowerType: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

/* ==================== Helpers ==================== */

const mapApiToUI = (p: ApiProduct): UIProduct => ({
  id: Number(p.id ?? p.product_id ?? 0),
  name: p.name,
  description: p.description ?? "",
  basePrice: p.base_price,
  price: Number(p.effective_price ?? p.price ?? p.base_price ?? 0),
  status: p.status,
  flowerType: p.flower_type ?? "Uncategorized",
  stock: p.stock_quantity,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

const fmtPrice = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n) ? `$${n.toFixed(2)}` : "—";

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "—";

function Badge({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "gray";
}) {
  const styles: Record<string, string> = {
    green:
      "bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full text-xs",
    yellow:
      "bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-xs",
    red: "bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-xs",
    gray: "bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-xs",
  };
  return <span className={styles[variant]}>{children}</span>;
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  if (s.includes("new")) return <Badge variant="green">new</Badge>;
  if (s.includes("low")) return <Badge variant="yellow">low stock</Badge>;
  if (s.includes("old")) return <Badge variant="gray">archived</Badge>;
  return <Badge variant="gray">{status || "—"}</Badge>;
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
      <div className="relative w-[92vw] max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
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
  confirmText = "Delete",
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

/* ==================== Create/Edit form ==================== */

function ProductFormModal({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<UIProduct>;
  onClose: () => void;
  onSaved: (p: UIProduct) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [flowerType, setFlowerType] = useState(initial?.flowerType ?? "");
  const [basePrice, setBasePrice] = useState<number | string>(
    initial?.basePrice ?? ""
  );
  const [status, setStatus] = useState(initial?.status ?? "NewFlower");
  const [stock, setStock] = useState<number | string>(initial?.stock ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setFlowerType(initial?.flowerType ?? "");
      setBasePrice(initial?.basePrice ?? "");
      setStatus(initial?.status ?? "NewFlower");
      setStock(initial?.stock ?? "");
      setErr(null);
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!name.trim()) return setErr("Name is required.");
    if (!flowerType.trim()) return setErr("Flower type is required.");

    const payload = {
      name: name.trim(),
      description: description.trim(),
      flower_type: flowerType.trim(),
      base_price: Number(basePrice || 0),
      status: status || "NewFlower",
      stock_quantity: Number(stock || 0),
    };

    try {
      setSaving(true);

      const url =
        mode === "create"
          ? `${API_BASE}/product`
          : `${API_BASE}/product/${initial?.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
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

      const created = (Array.isArray(parsed?.data)
        ? parsed.data[0]
        : parsed?.data) || parsed;

      const ui = mapApiToUI(created as ApiProduct);
      onSaved(ui);
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add Product" : "Edit Product"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {err && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
            {err}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Red Rose Bouquet"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Flower Type
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={flowerType}
              onChange={(e) => setFlowerType(e.target.value)}
              required
              placeholder="Rose"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Description
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A beautiful bouquet..."
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Base Price
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="29.99"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Status</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="NewFlower">NewFlower</option>
              <option value="OldFlower">OldFlower</option>
              <option value="LowStock">LowStock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Stock</label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ==================== Main: All products in ONE table ==================== */

export default function AdminProductsTable() {
  const [rows, setRows] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [sortKey, setSortKey] = useState<"name" | "price" | "created">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState<UIProduct | null>(null);
  const [editing, setEditing] = useState<UIProduct | null>(null);
  const [toDelete, setToDelete] = useState<UIProduct | null>(null);

  // load all products
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/products`, {
          headers: { Accept: "application/json" },
        });
        const raw = await res.text();
        if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

        let parsed: ApiEnvelope<ApiProduct[]> | ApiProduct[];
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error("Invalid JSON from /products");
        }

        const list: ApiProduct[] = Array.isArray(parsed)
          ? parsed
          : parsed.data ?? [];
        const mapped = list.map(mapApiToUI);
        if (alive) setRows(mapped);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load products");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // filters + search + sort
  const filteredSorted = useMemo(() => {
    let list = rows;

    // search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.flowerType.toLowerCase().includes(q)
      );
    }

    // status filter
    if (statusFilter !== "all") {
      const target = statusFilter.toLowerCase();
      list = list.filter((p) => (p.status || "").toLowerCase() === target);
    }

    // flower_type filter
    if (typeFilter !== "all") {
      list = list.filter((p) => p.flowerType === typeFilter);
    }

    // sort
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return dir * a.name.localeCompare(b.name);
      if (sortKey === "price") return dir * ((a.price || 0) - (b.price || 0));
      // created
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dir * (at - bt);
    });

    return list;
  }, [rows, search, statusFilter, typeFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageRows = filteredSorted.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const allFlowerTypes = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.flowerType).filter(Boolean))).sort(),
    [rows]
  );

  /* CRUD handlers */
  function handleCreated(p: UIProduct) {
    setRows((prev) => [p, ...prev]);
    setPage(1);
  }
  function handleEdited(p: UIProduct) {
    setRows((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  }
  async function doDelete() {
    if (!toDelete) return;
    try {
      const res = await fetch(`${API_BASE}/product/${toDelete.id}`, {
        method: "DELETE",
        headers: { accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || `HTTP ${res.status}`);
      }
      setRows((prev) => prev.filter((p) => p.id !== toDelete.id));
      setToDelete(null);
    } catch (e: any) {
      alert(e?.message || "Failed to delete product");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Products</h1>
            <p className="text-slate-600">All products in a single table</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, type…"
              className="rounded-lg border border-slate-300 px-3 py-2 w-64"
            />
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
            >
              + Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="NewFlower">NewFlower</option>
            <option value="LowStock">LowStock</option>
            <option value="OldFlower">OldFlower</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="all">All Flower Types</option>
            {allFlowerTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="name">Sort: Name</option>
              <option value="price">Sort: Price</option>
              <option value="created">Sort: Created</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-6">Loading…</div>
          ) : err ? (
            <div className="p-6 text-rose-700 bg-rose-50">{err}</div>
          ) : filteredSorted.length === 0 ? (
            <div className="p-6">No products found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left w-[24rem]">Name</th>
                  <th className="px-4 py-3 text-left">Flower Type</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-slate-500 line-clamp-1">
                        {p.description || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-900">{p.flowerType}</td>
                    <td className="px-4 py-3 text-slate-900">
                      {fmtPrice(p.price) || fmtPrice(p.basePrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {typeof p.stock === "number" ? p.stock : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fmtDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewing(p)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setToDelete(p)}
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
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <div>
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filteredSorted.length)} of{" "}
            {filteredSorted.length}
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
      </div>

      {/* Create */}
      <ProductFormModal
        open={showCreate}
        mode="create"
        onClose={() => setShowCreate(false)}
        onSaved={handleCreated}
      />

      {/* Edit */}
      <ProductFormModal
        open={!!editing}
        mode="edit"
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSaved={handleEdited}
      />

      {/* View */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? viewing.name : "Product"}
      >
        {viewing && (
          <div className="space-y-3 text-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase text-slate-500">
                  Flower type
                </div>
                <div className="font-medium">{viewing.flowerType}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-500">Status</div>
                <div className="font-medium">
                  <StatusBadge status={viewing.status} />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">
                Description
              </div>
              <div>{viewing.description || "—"}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase text-slate-500">Price</div>
                <div className="font-medium">
                  {fmtPrice(viewing.price) || fmtPrice(viewing.basePrice)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-500">Stock</div>
                <div className="font-medium">
                  {typeof viewing.stock === "number" ? viewing.stock : "—"}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Created: {fmtDate(viewing.createdAt)} • Updated:{" "}
              {fmtDate(viewing.updatedAt)}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Confirm
        open={!!toDelete}
        title="Delete product"
        message={
          toDelete
            ? `Delete “${toDelete.name}”? This action cannot be undone.`
            : ""
        }
        onCancel={() => setToDelete(null)}
        onConfirm={doDelete}
        confirmText="Delete product"
      />
    </div>
  );
}
