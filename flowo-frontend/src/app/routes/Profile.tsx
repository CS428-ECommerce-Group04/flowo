import React, { useEffect, useMemo, useState } from "react";
import { makeApiRequest } from "@/config/api";
import { Link } from "react-router-dom";

type ApiEnvelope<T> = { data?: T; message?: string };

type ApiProfile = {
  firebase_info?: {
    uid?: string;
    email?: string;
    display_name?: string;
    email_verified?: boolean;
    photo_url?: string;
    disabled?: boolean;
    created_at?: string;
    last_login_at?: string;
  };
  local_user?: {
    firebase_uid?: string;
    email?: string;
    username?: string;
    full_name?: string;
    gender?: string;
    role?: string;
    created_at?: string;
    updated_at?: string;
  };
};

type UIProfile = {
  email: string;
  username: string;
  fullName: string;
  displayName: string;
  gender: string;
  role?: string;
  emailVerified?: boolean;
  photoUrl?: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

function VerifiedBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 border border-emerald-200">
      Verified
    </span>
  );
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<UIProfile | null>(null);
  const [editing, setEditing] = useState(false);

  // local form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("Other");

  const avatarText = useMemo(
    () => initials(profile?.fullName || profile?.displayName || profile?.email || "U"),
    [profile]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // NOTE: endpoint includes /api/v1 to match your Swagger
      const res = await makeApiRequest<ApiEnvelope<ApiProfile>>("/users/profile");
      const p = res?.data || {};
      const email = p.local_user?.email || p.firebase_info?.email || "";
      const dn = p.firebase_info?.display_name || "";
      const fn = p.local_user?.full_name || dn || "";
      const un = p.local_user?.username || "";
      const g  = p.local_user?.gender || "Other";

      const ui: UIProfile = {
        email,
        username: un,
        fullName: fn,
        displayName: dn || fn || email,
        gender: g,
        role: p.local_user?.role,
        emailVerified: p.firebase_info?.email_verified,
        photoUrl: p.firebase_info?.photo_url || undefined,
      };
      setProfile(ui);
      setFullName(ui.fullName);
      setUsername(ui.username);
      setGender(ui.gender || "Other");
    } catch (e: any) {
      setErr(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setErr(null);
    try {
      const body = {
        full_name: fullName.trim(),
        username: username.trim(),
        gender,
      };
      const res = await makeApiRequest<ApiEnvelope<ApiProfile>>("/users/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      // reflect latest
      const p = res?.data || {};
      const ui: UIProfile = {
        email: p.local_user?.email || profile.email,
        username: p.local_user?.username || username,
        fullName: p.local_user?.full_name || fullName,
        displayName: p.firebase_info?.display_name || p.local_user?.full_name || profile.displayName,
        gender: p.local_user?.gender || gender,
        role: p.local_user?.role || profile.role,
        emailVerified: p.firebase_info?.email_verified ?? profile.emailVerified,
        photoUrl: p.firebase_info?.photo_url || profile.photoUrl,
      };
      setProfile(ui);
      setEditing(false);
    } catch (e: any) {
      setErr(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Account</h1>

        {/* Tabs (only first is implemented) */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-6 px-6 border-b">
            <button className="py-3 text-green-700 border-b-2 border-green-700">Profile Information</button>
            <button className="py-3 text-slate-500 hover:text-slate-700">Security & Privacy</button>
            <button className="py-3 text-slate-500 hover:text-slate-700">Account Activity</button>
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="text-slate-500">Loading profile…</div>
            ) : err ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 p-3">{err}</div>
            ) : !profile ? (
              <div className="text-slate-600">
                You’re not signed in.{" "}
                <Link className="text-green-700 underline" to="/login">Sign in</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-700 text-white flex items-center justify-center text-xl font-bold">
                      {avatarText}
                    </div>
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                      title="Change photo (not implemented)"
                    >
                      Change Photo
                    </button>
                  </div>

                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFullName(profile.fullName);
                          setUsername(profile.username);
                          setGender(profile.gender || "Other");
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={save as any}
                        disabled={saving}
                        className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                {!editing ? (
                  <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <div className="text-sm text-slate-500">Display Name</div>
                      <div className="font-medium text-slate-900">{profile.displayName || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Full Name</div>
                      <div className="font-medium text-slate-900">{profile.fullName || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Username</div>
                      <div className="font-medium text-slate-900">@{profile.username || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Gender</div>
                      <div className="font-medium text-slate-900">{profile.gender || "—"}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">Email Address</div>
                      <div className="font-medium text-slate-900 flex items-center">
                        {profile.email || "—"}
                        {profile.emailVerified && <VerifiedBadge />}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Role</div>
                      <div className="font-medium text-slate-900">{profile.role || "—"}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Full Name</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Username</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="yourusername"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Gender</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help section */}
        <div className="mt-8 rounded-xl border border-green-100 bg-green-50 p-8 text-center">
          <h2 className="text-xl font-bold text-green-800 mb-2">Need Help with Your Account?</h2>
          <p className="text-slate-700 mb-4">
            Our support team is here to help with any questions or concerns about your profile.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800" href="#support">
              Contact Support
            </a>
            <a className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-white" href="#help">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
