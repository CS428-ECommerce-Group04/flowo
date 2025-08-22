import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_CONFIG } from "@/config/api";

type ApiEnvelope<T> = { message?: string; data: T };

type ApiUser = {
  firebase_uid?: string;
  email: string;
  username?: string;
  full_name?: string;
  gender?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  default_address?: {
    address_id: number;
    recipient_name?: string;
    phone_number?: string;
    street_address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    is_default_shipping?: boolean;
  };
};

type UIUser = {
  id?: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
  addressLine?: string;
  phone?: string;
};

const toUI = (u: ApiUser): UIUser => {
  const local = u.email?.split("@")[0] ?? "";
  const name =
    (u.full_name && u.full_name.trim()) ||
    (u.username && u.username.trim()) ||
    local;

  const a = u.default_address;
  const addressLine = [a?.street_address, a?.city, a?.country]
    .filter(Boolean)
    .join(", ");

  return {
    id: u.firebase_uid,
    name,
    email: u.email,
    username: u.username,
    role: u.role,
    gender: u.gender,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    phone: a?.phone_number,
    addressLine: addressLine || undefined,
  };
};

const initials = (text: string) => {
  const parts = (text || "").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (text || "").slice(0, 2).toUpperCase();
};

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");
const API_BASE = API_CONFIG.BASE_URL || "http://localhost:8081";

export default function AdminUserDetail() {
  const { email = "" } = useParams<{ email: string }>();
  const decodedEmail = useMemo(() => decodeURIComponent(email), [email]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<UIUser | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/users/email/${encodeURIComponent(decodedEmail)}`,
          { headers: { Accept: "application/json" }, credentials: "include" }
        );
        const raw = await res.text();
        if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

        let parsed: ApiUser | ApiEnvelope<ApiUser> | ApiEnvelope<ApiUser[]> | ApiUser[];
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error("Invalid JSON from /users/email/{email}");
        }

        // Accept plain object, {data: obj}, array, or {data: array}
        const candidate =
          Array.isArray(parsed)
            ? parsed[0]
            : (parsed as any)?.data
            ? Array.isArray((parsed as any).data)
              ? (parsed as any).data[0]
              : (parsed as any).data
            : (parsed as ApiUser);

        if (!candidate) throw new Error("User not found");
        if (!alive) return;
        setUser(toUI(candidate));
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [decodedEmail]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-800">User Detail</h1>
          <p className="text-slate-600">User profile for <span className="font-mono">{decodedEmail}</span></p>
        </div>
        <Link
          to="/admin/users"
          className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50"
        >
          ← Back to Users
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : err ? (
          <div className="p-8 text-center text-rose-600">{err}</div>
        ) : !user ? (
          <div className="p-8 text-center text-slate-500">No user found.</div>
        ) : (
          <div className="p-6 md:p-8 grid gap-6 md:grid-cols-3">
            {/* Left: avatar + basics */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-800 grid place-items-center text-lg font-bold">
                  {initials(user.name)}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                  {user.username && (
                    <div className="text-xs text-slate-400">@{user.username}</div>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <InfoRow label="Role" value={user.role} />
                <InfoRow label="Gender" value={user.gender || "—"} />
                <InfoRow label="Joined" value={fmt(user.createdAt)} />
                <InfoRow label="Updated" value={fmt(user.updatedAt)} />
              </div>
            </div>

            {/* Right: contact/address */}
            <div className="md:col-span-2 grid gap-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-800 mb-2">Contact</h2>
                <div className="text-sm text-slate-700">
                  <div>Phone: {user.phone || "—"}</div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-800 mb-2">Default Address</h2>
                <div className="text-sm text-slate-700">
                  {user.addressLine ? user.addressLine : "No default address."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
