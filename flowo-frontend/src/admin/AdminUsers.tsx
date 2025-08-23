import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/api";

type ApiEnvelope<T> = { message?: string; data: T };

type ApiUser = {
  firebase_uid: string;
  email: string;
  username?: string;
  full_name?: string;
  gender?: "Male" | "Female" | "Other" | string;
  role: string; // e.g. "Admin" | "RegisteredBuyer" | ...
  created_at?: string;
  updated_at?: string;
  default_address?: {
    address_id: number;
    firebase_uid: string;
    recipient_name: string;
    phone_number?: string;
    street_address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    is_default_shipping?: boolean;
  };
};

type UIUser = {
  id: string;               // firebase_uid
  name: string;             // full_name | username | email local part
  email: string;
  username?: string;
  gender?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  phone?: string;
  addressLine?: string;     // "street, city, country"
};

const API_BASE = API_CONFIG.BASE_URL || "http://localhost:8081";

/* -------------------------------- utils -------------------------------- */

const toUI = (u: ApiUser): UIUser => {
  const local = u.email?.split("@")[0] ?? "";
  const name = (u.full_name && u.full_name.trim()) || (u.username && u.username.trim()) || local;

  const adr = u.default_address;
  const addrLine = [adr?.street_address, adr?.city, adr?.country]
    .filter(Boolean)
    .join(", ");

  return {
    id: u.firebase_uid,
    name,
    email: u.email,
    username: u.username,
    gender: u.gender,
    role: u.role,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    phone: adr?.phone_number,
    addressLine: addrLine || undefined,
  };
};

const initials = (text: string) => {
  const base = text || "";
  const parts = base.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
};

const fmtDT = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

/* ------------------------------- component ------------------------------ */

export default function AdminUsers() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<UIUser[]>([]);

  // controls
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [gender, setGender] = useState<string>("all");
  const [sort, setSort] = useState<"name" | "created" | "updated">("name");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetch(`${API_BASE}/admin/users`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        let parsed: ApiEnvelope<ApiUser[]> | ApiUser[];
        try { parsed = JSON.parse(text); } catch { throw new Error("Invalid JSON from /admin/users"); }
        const list: ApiUser[] = Array.isArray(parsed) ? parsed : parsed.data ?? [];

        if (!alive) return;
        setRows(list.map(toUI));
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to fetch users");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // stats
  const total = rows.length;
  const admins = rows.filter(r => r.role.toLowerCase() === "admin").length;
  const buyers = rows.filter(r => r.role.toLowerCase().includes("buyer")).length;
  const others = total - admins - buyers;

  const filtered = useMemo(() => {
    let list = rows;

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.username ?? "").toLowerCase().includes(s) ||
        (r.phone ?? "").toLowerCase().includes(s) ||
        (r.addressLine ?? "").toLowerCase().includes(s)
      );
    }
    if (role !== "all") list = list.filter(r => r.role.toLowerCase() === role);
    if (gender !== "all") list = list.filter(r => (r.gender ?? "").toLowerCase() === gender);

    if (sort === "name") list = [...list].sort((a,b) => a.name.localeCompare(b.name));
    if (sort === "created") list = [...list].sort((a,b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    if (sort === "updated") list = [...list].sort((a,b) =>
      new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());

    return list;
  }, [rows, q, role, gender, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // NOTE: You only shared GET. If you have a DELETE endpoint, adjust the URL here.
  const handleDelete = async (uid: string) => {
    const ok = confirm("Delete this user?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${uid}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      setRows(prev => prev.filter(r => r.id !== uid));
    } catch (e: any) {
      alert(e?.message || "Failed to delete user");
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">User Management</h1>
        <p className="text-slate-600 mt-1">View and manage all users.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={total} tone="green" />
        <StatCard label="Admins" value={admins} tone="amber" />
        <StatCard label="Registered Buyers" value={buyers} tone="blue" />
        <StatCard label="Other Roles" value={others} tone="teal" />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-green-700"
              placeholder="Search by name, email, username, phone, address…"
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
            />
            <span className="absolute right-3 top-2.5 text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
          </div>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={role}
            onChange={e => { setRole(e.target.value); setPage(1); }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="registeredbuyer">RegisteredBuyer</option>
          </select>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={gender}
            onChange={e => { setGender(e.target.value); setPage(1); }}
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={sort}
            onChange={e => setSort(e.target.value as any)}
          >
            <option value="name">Sort by Name</option>
            <option value="created">Sort by Joined</option>
            <option value="updated">Sort by Updated</option>
          </select>

          <button
            className="ml-auto rounded-lg bg-green-700 text-white px-4 py-2 hover:bg-green-800"
            onClick={() => navigate("/admin/users/new")}
          >
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-10 px-4 py-3 text-left"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Gender</th>
                <th className="px-4 py-3 text-left">Joined / Updated</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading users…</td></tr>
              )}
              {err && !loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-red-600">{err}</td></tr>
              )}
              {!loading && !err && paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No users found.</td></tr>
              )}

              {!loading && !err && paged.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" /></td>

                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 text-green-800 grid place-items-center font-semibold">
                        {initials(u.name)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                        {u.username && <div className="text-xs text-slate-400">@{u.username}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{u.phone || "—"}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{u.addressLine || ""}</div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <Pill tone={u.role.toLowerCase() === "admin" ? "amber" : "indigo"}>{u.role}</Pill>
                  </td>

                  {/* Gender */}
                  <td className="px-4 py-3">
                    <Pill tone="slate">{u.gender || "—"}</Pill>
                  </td>

                  {/* Dates */}
                  <td className="px-4 py-3 text-slate-600">
                    <div className="text-xs">Joined: {fmtDT(u.createdAt)}</div>
                    <div className="text-xs">Updated: {fmtDT(u.updatedAt)}</div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg text-slate-700 border border-slate-300 hover:bg-slate-50"
                        onClick={() => navigate(`/admin/users/email/${encodeURIComponent(u.email)}`)}
                      >
                        View
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-slate-700 border border-slate-300 hover:bg-slate-50"
                        onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700"
                        onClick={() => handleDelete(u.id)}
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
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <div className="text-slate-600">
              Showing {paged.length} of {filtered.length} users
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="px-2 py-1.5">{page} / {totalPages}</span>
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ small ui bits ----------------------------- */

function Pill({
  children,
  tone = "slate",
}: { children: React.ReactNode; tone?: "green" | "amber" | "slate" | "indigo" }) {
  const tones: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({
  label, value, tone = "green",
}: { label: string; value: number | string; tone?: "green" | "teal" | "blue" | "amber" }) {
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