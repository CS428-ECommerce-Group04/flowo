export type CreateOrderBody = {
  billing_address_id: number;
  shipping_address_id: number;
  shipping_method: string;
  notes?: string;
};

export type CreateOrderResp = {
  order_id: number;
  order_code?: string;
};

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

export async function createOrder(userId: number, body: CreateOrderBody) {
  const url = `${BASE}/orders?user_id=${encodeURIComponent(String(userId))}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as CreateOrderResp;
}
