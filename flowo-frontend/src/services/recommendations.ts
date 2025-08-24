// Recommendation API client
import { API_CONFIG } from "@/config/api";

export type ProductResponse = {
  product_id: number;
  name: string;
  description?: string;
  flower_type?: string;
  base_price?: number;
  effective_price?: number;
  status?: string;
  stock_quantity?: number;
  created_at?: string;
  updated_at?: string;
};

export type RecommendedProductDTO = {
  product: ProductResponse;
  score: number;
  reason?: string;
  category?: string;
};

export type RecommendationResponseDTO = {
  recommendation_type: string;
  recommendations: RecommendedProductDTO[];
  explanation?: string;
  generated_at?: string;
  total?: number;
};

const BASE = API_CONFIG.BASE_URL;

export async function getTrendingRecommendations(period: "daily" | "weekly" | "monthly" = "weekly", limit = 8): Promise<RecommendationResponseDTO> {
  const res = await fetch(`${BASE}/api/recommendations/trending?period=${encodeURIComponent(period)}&limit=${limit}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return JSON.parse(text);
}

export async function getSimilarRecommendations(productId: number, limit = 8): Promise<RecommendationResponseDTO> {
  const res = await fetch(`${BASE}/api/recommendations/similar/${productId}?limit=${limit}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return JSON.parse(text);
}

export async function getPersonalizedRecommendations(firebaseUid: string, limit = 8): Promise<RecommendationResponseDTO> {
  const qs = new URLSearchParams({ recommendation_type: "personalized", firebase_uid: firebaseUid, limit: String(limit) });
  const res = await fetch(`${BASE}/api/recommendations?${qs.toString()}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return JSON.parse(text);
}

export type RecommendationFeedback = {
  firebase_uid?: string;
  product_id: number;
  recommendation_type: string; // personalized | similar | trending | occasion_based | price_based
  action: "clicked" | "purchased" | "dismissed" | "liked";
  session_id?: string;
};

export async function recordRecommendationFeedback(payload: RecommendationFeedback): Promise<void> {
  const res = await fetch(`${BASE}/api/recommendations/feedback`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      firebase_uid: payload.firebase_uid || "anonymous",
      product_id: payload.product_id,
      recommendation_type: payload.recommendation_type,
      action: payload.action,
      session_id: payload.session_id,
    }),
  });
  if (!res.ok) {
    // Non-blocking: swallow errors but log for diagnostics
    const text = await res.text();
    console.warn("recordRecommendationFeedback failed:", res.status, text);
  }
}


