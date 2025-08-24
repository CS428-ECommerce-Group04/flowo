// src/config/api.ts

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Default includes /api/v1 so you can call api("/pricing/rules")
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

export const API_CONFIG = {
  BASE_URL: String(RAW_BASE).replace(/\/$/, ""), // strip trailing slash
} as const;

/** Join base + path safely without double slashes */
export const api = (path: string) =>
  `${API_CONFIG.BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

function buildHeaders(options: RequestInit) {
  const base: Record<string, string> = { Accept: "application/json" };
  const hasBody = options.body != null || ["POST", "PUT", "PATCH"].includes(String(options.method || "").toUpperCase());
  if (hasBody && !(options.headers as any)?.["Content-Type"]) {
    base["Content-Type"] = "application/json";
  }
  return { ...base, ...(options.headers as any) };
}

/** Fetch JSON with credentials included */
export async function makeApiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(api(path), {
    ...options,
    credentials: "include",
    headers: buildHeaders(options),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      message = j?.message || j?.error || message;
    } catch {
      /* ignore parse error, keep generic message */
    }
    throw new Error(message);
  }

  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

/* Optional tiny helpers */
export const get  = <T = unknown>(p: string, init: RequestInit = {}) =>
  makeApiRequest<T>(p, { ...init, method: "GET" });
export const post = <T = unknown>(p: string, body?: any, init: RequestInit = {}) =>
  makeApiRequest<T>(p, { ...init, method: "POST", body: JSON.stringify(body ?? {}) });
export const put  = <T = unknown>(p: string, body?: any, init: RequestInit = {}) =>
  makeApiRequest<T>(p, { ...init, method: "PUT", body: JSON.stringify(body ?? {}) });
export const del  = <T = unknown>(p: string, init: RequestInit = {}) =>
  makeApiRequest<T>(p, { ...init, method: "DELETE" });
