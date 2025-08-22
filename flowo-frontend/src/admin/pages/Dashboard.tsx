// src/admin/pages/Dashboard.tsx
import { Link, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-emerald-800">Dashboard Overview</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: "156", sub: "+12% from last month", icon: "👤" },
          { label: "Active Users", value: "142", sub: "91% active rate", icon: "✅" },
          { label: "Categories", value: "24", sub: "+4 new this week", icon: "🗂️" },
          { label: "Total Products", value: "342", sub: "Across all categories", icon: "🧺" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl">{c.icon}</div>
              <div className="text-3xl font-bold text-slate-800">{c.value}</div>
            </div>
            <div className="text-sm font-semibold text-slate-700 mt-2">{c.label}</div>
            <div className="text-xs text-slate-500">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-slate-50">
              <span className="text-emerald-600">＋</span>
              <div>
                <div className="text-sm font-semibold text-slate-800">Add New User</div>
                <div className="text-xs text-slate-500">Create a new user account</div>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-slate-50"
              onClick={() => navigate("/admin/settings")}
            >
              <span className="text-emerald-600">⚙️</span>
              <div>
                <div className="text-sm font-semibold text-slate-800">Settings</div>
                <div className="text-xs text-slate-500">Open admin settings</div>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Recent Activity</h2>
          <ul className="space-y-3">
            {[
              { badge: "🟢", title: "New user registered", sub: "Sarah Jones · 2h ago" },
              { badge: "🔵", title: "Category updated", sub: "Wedding bouquets · 4h ago" },
              { badge: "🟣", title: "Products added", sub: "15 new products in Birthday Flowers" },
            ].map((a, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <span className="text-lg">{a.badge}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{a.title}</div>
                  <div className="text-xs text-slate-500">{a.sub}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
