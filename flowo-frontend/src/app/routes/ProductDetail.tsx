// src/app/routes/ProductDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/store/cart";
import { useProductsStore, type UIFlower } from "@/store/products";
import { getSimilarRecommendations, type RecommendationResponseDTO, recordRecommendationFeedback } from "@/services/recommendations";

type ApiEnvelope<T> = { message?: string; data: T };

type ApiDetailProduct = {
  product_id?: number;
  name?: string;
  description?: string;
  flower_type?: string;
  base_price?: number;
  effective_price?: number;
  current_price?: number;
  price?: number;
  status?: string;
  stock_quantity?: number;
  created_at?: string;
  updated_at?: string;
  average_rating?: number;
  review_count?: number;
  sales_rank?: number;
  // Add other fields your API returns if needed (e.g., image urls)
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

// Utility: choose a detail record from the list that best matches a product
function pickDetailForProduct(
  list: ApiDetailProduct[],
  base: UIFlower | undefined
): ApiDetailProduct | undefined {
  if (!list.length) return undefined;
  if (!base) return list[0];

  // try name match (case-insensitive)
  const byName = list.find(
    (d) => (d.name || "").toLowerCase() === base.name.toLowerCase()
  );
  if (byName) return byName;

  // try flower type match
  const byType = list.find(
    (d) =>
      (d.flower_type || "").toLowerCase() ===
      (base.flower_type || "").toLowerCase()
  );
  if (byType) return byType;

  return list[0];
}

export default function ProductDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { product?: UIFlower } };
  const add = useCart((s) => s.add);

  // Zustand store access
  const loaded = useProductsStore((s) => s.loaded);
  const list = useProductsStore((s) => s.list);
  const setAll = useProductsStore((s) => s.setAll);
  const findBySlug = useProductsStore((s) => s.findBySlug);

  // If navigated from Landing, this can be present
  const productFromState = location.state?.product;

  // Fast candidate from state OR store
  const productFromStore = findBySlug(slug);
  const baseProduct = productFromState || productFromStore;

  const [ui, setUi] = useState<{
    id: string;
    name: string;
    description: string;
    flowerType: string;
    price: number;
    stock?: number;
    rating?: number;
    reviews?: number;
    image: string;
    tags: string[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [similar, setSimilar] = useState<RecommendationResponseDTO | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // Ensure we have the base product (with flower_type) even on hard-refresh
        let base: UIFlower | undefined = baseProduct;

        if (!base) {
          console.log("[ProductDetail] store empty or product not found, fetching /products…");
          const res = await fetch(`${API_BASE}/products`, {
            headers: { Accept: "application/json" },
          });
          const raw = await res.text();
          if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

          let parsed: ApiEnvelope<any[]> | any[];
          try {
            parsed = JSON.parse(raw);
          } catch {
            throw new Error("Invalid JSON from /products");
          }

          const arr: any[] = Array.isArray(parsed) ? parsed : parsed.data ?? [];

          // Map minimal fields to reuse your UIFlower structure
          const mapped: UIFlower[] = arr.map((p) => ({
            id: String(p.id ?? p.product_id ?? ""),
            slug:
              p.slug ??
              (p.name
                ? p.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")
                : String(p.id ?? p.product_id ?? "")),
            name: p.name,
            description: p.description ?? "",
            price: Number(p.effective_price ?? p.price ?? p.base_price ?? 0),
            image: p.image_url ?? p.primaryImageUrl ?? "/images/placeholder.png",
            tags: Array.isArray(p.tags)
              ? p.tags
              : [p.flower_type, p.status].filter(Boolean) as string[],
            flower_type: p.flower_type,
          }));

          // Put into the cache for future pages
          setAll(mapped);

          base = mapped.find((x) => x.slug === slug);
          if (!base) {
            throw new Error("Product not found.");
          }
        }

        // We must have a proper flower type
        const flowerType = (base.flower_type || "").trim();
        if (!flowerType) {
          throw new Error("Missing flower type for this product.");
        }

        // Fetch detail by flower type — use EXACT string from store, url-encoded
        const detailUrl = `${API_BASE}/product/flower-type/${encodeURIComponent(
          flowerType
        )}`;
        console.log("[ProductDetail] GET", detailUrl);

        const dRes = await fetch(detailUrl, {
          headers: { Accept: "application/json" },
        });
        const dRaw = await dRes.text();
        if (!dRes.ok) throw new Error(dRaw || `HTTP ${dRes.status}`);

        let dParsed: ApiEnvelope<ApiDetailProduct[]> | ApiDetailProduct[];
        try {
          dParsed = JSON.parse(dRaw);
        } catch (e) {
          console.error("[ProductDetail] JSON parse error (detail):", e);
          throw new Error("Invalid JSON from detail endpoint");
        }

        const detailList: ApiDetailProduct[] = Array.isArray(dParsed)
          ? dParsed
          : dParsed.data ?? [];

        if (!detailList.length) {
          throw new Error("No product found for this flower type.");
        }

        const best = pickDetailForProduct(detailList, base) || detailList[0];

        // Calculate price preference: current -> effective -> price -> base
        const price = Number(
          best.current_price ??
            best.effective_price ??
            best.price ??
            best.base_price ??
            base.price ??
            0
        );

        const uiObj = {
          id: String(
            best.product_id ?? base.id ?? ""
          ),
          name: best.name || base.name,
          description: best.description || base.description,
          flowerType,
          price: Number.isFinite(price) ? price : 0,
          stock: best.stock_quantity,
          rating: best.average_rating,
          reviews: best.review_count,
          image: base.image, // replace with detailed image if your API provides it
          tags: [flowerType, best.status || ""].filter(Boolean) as string[],
        };

        if (!alive) return;
        setUi(uiObj);
        setLoading(false);
      } catch (e: any) {
        console.error("[ProductDetail] error:", e);
        if (!alive) return;
        setErr(e?.message || "Failed to load product");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug, baseProduct, setAll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const productId = baseProduct?.id || ui?.id;
        const pidNum = productId ? parseInt(String(productId), 10) : undefined;
        if (!pidNum || Number.isNaN(pidNum)) return;
        const rec = await getSimilarRecommendations(pidNum, 8);
        if (!cancelled) setSimilar(rec);
      } catch (e) {
        if (!cancelled) setSimilar(null);
      }
    })();
    return () => { cancelled = true; };
  }, [baseProduct?.id, ui?.id]);

  const oldPrice = useMemo(() => (ui ? Number((ui.price * 1.25).toFixed(2)) : 0), [ui]);
  const hasCompare = ui ? oldPrice > ui.price : false;
  const discountPct = hasCompare ? Math.round(((oldPrice - (ui?.price || 0)) / oldPrice) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-slate-600">Loading product…</div>
      </div>
    );
  }

  if (err || !ui) {
    return (
      <div className="min-h-screen grid place-items-center bg-white p-4">
        <div className="max-w-md w-full rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <div className="font-semibold mb-1">Failed to load product</div>
          <div className="text-sm mb-3">{err || "Unknown error"}</div>
          <button
            onClick={() => navigate(-1)}
            className="rounded bg-green-700 text-white px-4 py-2 text-sm"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fefefe]">
      {/* Header mini */}
      <header className="sticky top-0 z-10 h-16 bg-white shadow flex items-center justify-between px-6">
        <Link to="/" className="text-2xl font-extrabold text-green-800">
          Flowo
        </Link>
        <div className="flex gap-4 opacity-70">
          <div className="w-5 h-5 bg-slate-200 rounded" />
          <div className="w-5 h-5 bg-slate-200 rounded" />
        </div>
      </header>

      {/* Main */}
      <div className="max-w-6xl mx-auto p-6">
        <Link to="/" className="text-sm text-green-800 hover:underline">
          ← Back to Collection
        </Link>

        <div className="grid md:grid-cols-2 gap-10 mt-8">
          {/* Image */}
          <div className="relative">
            <img
              src={ui.image}
              alt={ui.name}
              className="w-full h-96 object-cover rounded-2xl shadow"
            />
            <div className="absolute left-3 top-3 flex gap-2">
              <span className="bg-pink-600 text-white rounded-full px-3 py-0.5 text-xs font-medium">
                Bestseller
              </span>
              <span className="bg-[#e8f5d8] text-[#2d5016] rounded-full px-3 py-0.5 text-xs">
                New Arrival
              </span>
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-[#2d5016]">{ui.name}</h1>
            <p className="mt-3 text-slate-600">{ui.description}</p>

            {/* tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {ui.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[#e8f5d8] text-[#2d5016] px-3 py-1 text-sm"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* specs */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white p-4 shadow">
              <div>
                <div className="text-slate-500 text-xs">Flower Type</div>
                <div className="text-[#2d5016] font-semibold">{ui.flowerType}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Stock Available</div>
                <div className="text-[#2d5016] font-semibold">
                  {ui.stock != null ? ui.stock : "In stock"}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Rating</div>
                <div className="text-[#2d5016] font-semibold">
                  {ui.rating != null ? ui.rating.toFixed(1) : "—"}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Reviews</div>
                <div className="text-[#2d5016] font-semibold">{ui.reviews ?? 0}</div>
              </div>
            </div>

            {/* price */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-[#2d5016]">${ui.price.toFixed(2)}</div>
                {hasCompare && (
                  <>
                    <div className="text-slate-400 line-through">${oldPrice.toFixed(2)}</div>
                    <span className="bg-pink-600 text-white rounded px-2 py-0.5 text-sm">
                      {discountPct}% OFF
                    </span>
                  </>
                )}
              </div>
              <div className="text-slate-500 text-sm mt-1">
                Price includes delivery within 24 hours
              </div>
            </div>

            {/* qty + actions */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-slate-300 rounded">
                <button
                  className="w-9 h-10"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  –
                </button>
                <input
                  className="w-12 h-10 border-x border-slate-300 text-center"
                  type="number"
                  value={qty}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setQty(Number.isFinite(n) && n > 0 ? n : 1);
                  }}
                />
                <button className="w-9 h-10" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>

              <button
                className="rounded bg-pink-600 text-white px-6 py-2 font-medium"
                onClick={() =>
                  add({
                    id: ui.id,
                    name: ui.name,
                    price: ui.price,
                    qty,
                    image: ui.image,
                    description: ui.description,
                    tags: ui.tags,
                  })
                }
              >
                Add to Cart
              </button>

              <button className="rounded border border-[#2d5016] text-[#2d5016] px-4 py-2">
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>

        {/* Simple tabs (placeholder) */}
        <div className="mt-10">
          <div className="border-b border-slate-200 flex gap-8">
            <button className="py-2 border-b-2 border-[#2d5016] text-[#2d5016] font-medium">
              Customer Reviews ({ui.reviews ?? 0})
            </button>
            <button className="py-2 text-slate-600">Care Instructions</button>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 shadow">
            <div className="text-slate-600 text-sm">No reviews yet.</div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-10 rounded-2xl bg-[#6bb937] p-8 text-center">
          <h2 className="text-black text-xl font-bold mb-2">Need Help Choosing?</h2>
          <p className="text-black mb-4">
            Our flower experts are here to help you find the perfect arrangement
          </p>
          <button className="rounded bg-white text-[#6bb937] px-5 py-3">
            Contact Our Experts
          </button>
        </div>

        {/* Similar products */}
        {similar && similar.recommendations?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-[#2d5016] mb-4">You may also like</h2>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"}}>
              {similar.recommendations.slice(0, 6).map((rec) => (
                <button
                  key={rec.product.product_id}
                  className="text-left bg-white rounded-xl shadow hover:shadow-md transition p-3"
                  onClick={() => {
                    recordRecommendationFeedback({ product_id: rec.product.product_id, recommendation_type: "similar", action: "clicked" });
                    navigate(`/products/${(rec.product.name || String(rec.product.product_id)).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
                  }}
                >
                  <img
                    src={baseProduct?.image || "/images/placeholder.png"}
                    alt={rec.product.name}
                    className="w-full h-40 object-cover rounded-lg mb-2"
                  />
                  <div className="font-semibold text-[#2d5016] truncate">{rec.product.name}</div>
                  <div className="text-sm text-slate-600 truncate">{rec.reason}</div>
                  <div className="text-[#2d5016] font-bold mt-1">${(rec.product.effective_price ?? rec.product.base_price ?? 0).toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm mt-10">
          © 2025 Flowo. All rights reserved.
        </div>
      </div>
    </div>
  );
}
