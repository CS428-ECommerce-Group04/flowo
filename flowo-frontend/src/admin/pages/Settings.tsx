// src/admin/pages/Settings.tsx
import { useState } from "react";

export default function AdminSettings() {
  const [form, setForm] = useState({
    orgName: "Flowo",
    supportEmail: "support@flowo.com",
    theme: "light",
    dailyDigest: true,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-emerald-800">Settings</h1>

      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-4">General</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-slate-600">Organization Name</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.orgName}
              onChange={(e) => setForm({ ...form, orgName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Support Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Theme</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value as "light" | "dark" })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={form.dailyDigest}
              onChange={(e) => setForm({ ...form, dailyDigest: e.target.checked })}
            />
            <span className="text-sm text-slate-700">Send daily email digest</span>
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">Save changes</button>
          <button className="px-4 py-2 rounded-lg border hover:bg-slate-50">Cancel</button>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-600 mb-3">Irreversible actions for your organization.</p>
        <button className="text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50">Delete Organization</button>
      </div>
    </div>
  );
}
