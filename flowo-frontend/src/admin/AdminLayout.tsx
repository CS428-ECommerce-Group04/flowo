// src/components/admin/AdminLayout.tsx
import React, { useState, useMemo } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
type Item = { to: string; label: string; icon: React.ReactNode };

const Icon = {
  // small inline icons so you don't depend on other files
  burger: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" strokeWidth="2" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" strokeWidth="2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 2a1 1 0 010 4l-1.52.3a7.99 7.99 0 01-1.06 1.84l.9 1.38a1 1 0 01-1.37 1.37l-1.38-.9a8.04 8.04 0 01-1.84 1.06l-.3 1.52a1 1 0 01-4 0l-.3-1.52a7.99 7.99 0 01-1.84-1.06l-1.38.9A1 1 0 014.24 18l.9-1.38A8.04 8.04 0 013.78 14.8L2.26 14.5a1 1 0 010-4l1.52-.3a7.99 7.99 0 011.06-1.84l-.9-1.38A1 1 0 015.31 5.6l1.38.9a8.04 8.04 0 011.84-1.06l.3-1.52a1 1 0 014 0l.3 1.52a7.99 7.99 0 011.84 1.06l1.38-.9a1 1 0 011.37 1.37l-.9 1.38c.4.56.76 1.18 1.06 1.84l1.52.3z" strokeWidth="1.5" />
    </svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M9 9a3 3 0 116 0c0 2-3 2-3 5m0 3h.01" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
    </svg>
  ),
  billing: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
      <path d="M3 10h18" strokeWidth="2" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M4 19h16M7 10v6m5-9v9m5-5v5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M4 19V5m6 14V9m6 10V3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M3 7l9-4 9 4-9 4-9-4z" strokeWidth="2" />
      <path d="M3 7v10l9 4 9-4V7" strokeWidth="2" />
    </svg>
  ),
  categories: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
      <path d="M16 14a4 4 0 10-8 0v2h8v-2z" />
      <circle cx="12" cy="8" r="3" />
      <path d="M19 21v-2a4 4 0 00-3-3.87M5 21v-2a4 4 0 013-3.87" />
    </svg>
  ),
    orders: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3h10l2 4v14H5V3h2z" />
      <path d="M7 7h10M9 12h6M9 16h6" />
    </svg>
  ),
};

const items: Item[] = [
  { to: "/admin",            label: "Dashboard",          icon: Icon.dashboard },
  { to: "/admin/users",      label: "User Management",    icon: Icon.users },
  { to: "/admin/categories", label: "Product Categories", icon: Icon.categories },
  { to: "/admin/orders",     label: "Order Management",   icon: Icon.users },
  { to: "/admin/pricing-rules", label: "Pricing Rules",   icon: Icon.billing },
  { to: "/admin/messages",   label: "Messages",           icon: Icon.messages },
  { to: "/admin/settings",   label: "Settings",           icon: Icon.settings },
  { to: "/admin/support",    label: "Help & Support",     icon: Icon.help },
  { to: "/admin/reports",    label: "Reports",            icon: Icon.reports },

  // { to: "/admin/billing",    label: "Billing",            icon: Icon.billing },
  // { to: "/admin/reports",    label: "Reports",            icon: Icon.reports },
  // { to: "/admin/analytics",  label: "Analytics",          icon: Icon.analytics },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = useMemo(
    () => (
      <aside
        className={`h-full bg-white border-r border-slate-200 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
<div className="h-16 flex items-center justify-between px-4 border-b">
  <Link
    to="/"
    className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 rounded-sm"
    aria-label="Go to Flowo home"
    title="Go to Flowo home"
  >

      {/* Brand text (hidden when collapsed) */}
      {!collapsed && (
        <span className="font-extrabold text-green-800 group-hover:text-green-900">
          Flowo
        </span>
      )}
    </Link>

    <button
      className="hidden md:block rounded p-2 text-slate-500 hover:bg-slate-100"
      onClick={() => setCollapsed((c) => !c)}
      aria-label="Toggle sidebar"
    >
      {Icon.burger}
    </button>
  </div>
        <nav className="p-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/admin"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2 mb-1 transition-colors",
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")
              }
            >
              <span className="shrink-0">{it.icon}</span>
              <span className={`${collapsed ? "md:hidden" : ""} hidden md:inline`}>
                {it.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    ),
    [collapsed]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Mobile trigger + drawer */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          className="rounded-lg bg-white shadow px-3 py-2 text-slate-700"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          {Icon.burger}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-lg">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              className="hidden md:inline-flex rounded p-2 hover:bg-slate-100"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
            >
              {Icon.burger}
            </button>
            <h1 className="font-semibold text-slate-800">Admin</h1>
          </div>
        </header>

        {/* Routed content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
