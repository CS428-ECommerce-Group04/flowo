// src/app/routes/ProductDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/store/cart";
import { useProductsStore, type UIFlower } from "@/store/products";
import { resolveProductImage } from "@/data/productImages";

type ApiEnvelope<T> = { message?: string; data: T };

type ApiProduct = {
  product_id?: number;
  id?: number;
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
  image_url?: string;
  primaryImageUrl?: string;
  discount_percentage?: number;
  price_valid_until?: string;
  last_updated?: string;
};

type CartApiResponse = {
  message?: string;
  success?: boolean;
  error?: string;
  data?: {
    cart_id?: string;
    items?: Array<{
      product_id: number;
      quantity: number;
      price: number;
    }>;
  };
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

// Function to fetch product data from backend API
async function fetchProductById(productId: string): Promise<ApiProduct> {
  const productUrl = `${API_BASE}/product/${productId}`;
  console.log("[ProductDetail] Fetching product from:", productUrl);

  const response = await fetch(productUrl, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(raw || `HTTP ${response.status} - Failed to fetch product`);
  }

  let parsed: ApiEnvelope<ApiProduct> | ApiProduct;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON from product endpoint");
  }

  // Handle both direct response and envelope response
  const productData: ApiProduct = 'data' in parsed ? parsed.data : parsed as ApiProduct;

  if (!productData) {
    throw new Error("Invalid product data received from API");
  }

  return productData;
}

// Function to add product to cart via API
async function addProductToCart(productId: string, quantity: number): Promise<CartApiResponse> {
  const cartUrl = `${API_BASE}/cart/add`;
  console.log("[ProductDetail] Adding to cart:", { productId, quantity });

  const response = await fetch(cartUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      product_id: Number(productId),
      quantity: quantity
    })
  });

  const raw = await response.text();
  let parsed: CartApiResponse;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // If we can't parse the response, create a generic error response
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status} - Failed to add to cart`
      };
    }
    return {
      success: true,
      message: "Product added to cart"
    };
  }

  // If the API returned an error message
  if (!response.ok || parsed.error) {
    return {
      success: false,
      error: parsed.error || parsed.message || `HTTP ${response.status} - Failed to add to cart`
    };
  }

  return {
    success: true,
    message: parsed.message || "Product added to cart",
    data: parsed.data
  };
}

// --- Cart store helpers (optimistic update) ---
function setCartFromApiPayload(items?: Array<{ product_id: number; quantity: number; price: number }>) {
  if (!items) return false;
  // Map API -> store shape (id, qty, price)
  const mapped = items.map((it) => ({
    id: it.product_id,
    qty: it.quantity,
    price: it.price,
  }));
  try {
    // Zustand hook has setState on it:
    (useCart as any).setState((s: any) => ({ ...s, items: mapped }));
    // Optionally update any derived counts in the store:
    (useCart as any).getState()?.updateCount?.();
  } catch {}
  return true;
}

function optimisticBumpCart(productId: number, qty: number, unitPrice: number) {
  try {
    (useCart as any).setState((s: any) => {
      const items = Array.isArray(s.items) ? [...s.items] : [];
      const idx = items.findIndex(
        (i: any) => (i.id ?? i.product_id) === productId
      );
      if (idx >= 0) {
        const prev = items[idx];
        const prevQty = prev.qty ?? prev.quantity ?? 0;
        items[idx] = { ...prev, id: productId, qty: prevQty + qty, price: unitPrice };
      } else {
        items.push({ id: productId, qty, price: unitPrice });
      }
      return { ...s, items };
    });
    (useCart as any).getState()?.updateCount?.();
  } catch {}
}

// Fallback function to find product ID from slug using products list
async function findProductIdBySlug(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { Accept: "application/json" },
    });
    const raw = await res.text();
    if (!res.ok) return null;

    let parsed: ApiEnvelope<any[]> | any[];
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    const arr: any[] = Array.isArray(parsed) ? parsed : parsed.data ?? [];

    // Find product by slug
    const product = arr.find(p => {
      const productSlug = p.slug ?? (p.name
        ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : String(p.id ?? p.product_id ?? ""));
      return productSlug === slug;
    });

    return product ? String(product.id ?? product.product_id ?? "") : null;
  } catch {
    return null;
  }
}

export default function ProductDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { product?: UIFlower } };
  
  // Cart store access for updating header state


  // Zustand store access
  const findBySlug = useProductsStore((s) => s.findBySlug);

  // If navigated from Landing, this can be present
  const productFromState = location.state?.product;
  const productFromStore = findBySlug(slug);
  const baseProduct = productFromState || productFromStore;

  const [ui, setUi] = useState<{
    id: string;
    name: string;
    description: string;
    flowerType: string;
    effectivePrice: number;
    basePrice?: number;
    currentPrice?: number;
    discountPercentage?: number;
    stock?: number;
    rating?: number;
    reviews?: number;
    image: string;
    tags: string[];
    lastUpdated?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // Add to cart states
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  // Function to refresh product data
  const refreshProduct = async (productId: string) => {
    setRefreshing(true);
    setErr(null);

    try {
      const productData = await fetchProductById(productId);

      // Use consistent image resolution logic
      const imageFromApi = productData.image_url ?? productData.primaryImageUrl;
      const resolvedImage = resolveProductImage(productData.name || "", slug);
      const finalImage = imageFromApi || resolvedImage;

      const updatedUi = {
        id: String(productData.product_id ?? productData.id ?? productId),
        name: productData.name || "Unknown Product",
        description: productData.description || "",
        flowerType: productData.flower_type || "",
        effectivePrice: productData.effective_price ?? 0,
        basePrice: productData.base_price,
        currentPrice: productData.current_price,
        discountPercentage: productData.discount_percentage,
        stock: productData.stock_quantity,
        rating: productData.average_rating,
        reviews: productData.review_count,
        image: finalImage,
        tags: [productData.flower_type, productData.status].filter(Boolean) as string[],
        lastUpdated: productData.last_updated,
      };

      setUi(updatedUi);
    } catch (error: any) {
      console.error("[ProductDetail] Product refresh error:", error);
      setErr(error?.message || "Failed to refresh product data");
    } finally {
      setRefreshing(false);
    }
  };

  // Function to handle adding product to cart
  const handleAddToCart = async () => {
    if (!ui) return;

    // Clear previous messages
    setCartSuccess(null);
    setCartError(null);

    // Validate quantity against stock
    if (ui.stock !== undefined && qty > ui.stock) {
      setCartError(`Cannot add ${qty} items. Only ${ui.stock} available in stock.`);
      return;
    }

    // Validate minimum quantity
    if (qty <= 0) {
      setCartError("Quantity must be at least 1");
      return;
    }

    setAddingToCart(true);

    try {
      const result = await addProductToCart(ui.id, qty);

      if (result.success) {
        // 1) Instant UI update: try to hydrate from API payload if present,
        //    otherwise do an optimistic local bump so Header updates immediately.
        const unitPrice = pricingInfo.displayPrice;
        const pid = Number(ui.id);

        const applied = setCartFromApiPayload(result.data?.items);
        if (!applied) {
          optimisticBumpCart(pid, qty, unitPrice);
        }

        setCartSuccess(result.message || `Added ${qty} ${ui.name} to your cart`);

        // Auto-hide success message after 3s
        setTimeout(() => setCartSuccess(null), 3000);
      } else {
        setCartError(result.error || "Failed to add item to cart");

        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          setCartError(null);
        }, 5000);
      }
    } catch (error: any) {
      console.error("[ProductDetail] Add to cart error:", error);
      setCartError(error?.message || "Failed to add item to cart");
    } finally {
      setAddingToCart(false);
    }

    // Refresh product data to get updated stock levels
    refreshProduct(ui.id);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // Try to get product ID from various sources
        let productId: string | null = null;

        // First, try from state or store
        if (baseProduct?.id) {
          productId = baseProduct.id;
        } else {
          // Fallback: find product ID by slug from products list
          productId = await findProductIdBySlug(slug);
        }

        if (!productId) {
          throw new Error("Product not found.");
        }

        // Fetch product data from backend API
        const productData = await fetchProductById(productId);

        if (!alive) return;

        // Use consistent image resolution logic
        const imageFromApi = productData.image_url ?? productData.primaryImageUrl;
        const resolvedImage = resolveProductImage(productData.name || "", slug);
        const finalImage = imageFromApi || resolvedImage;

        const uiObj = {
          id: String(productData.product_id ?? productData.id ?? productId),
          name: productData.name || "Unknown Product",
          description: productData.description || "",
          flowerType: productData.flower_type || "",
          effectivePrice: productData.effective_price ?? 0,
          basePrice: productData.base_price,
          currentPrice: productData.current_price,
          discountPercentage: productData.discount_percentage,
          stock: productData.stock_quantity,
          rating: productData.average_rating,
          reviews: productData.review_count,
          image: finalImage,
          tags: [productData.flower_type, productData.status].filter(Boolean) as string[],
          lastUpdated: productData.last_updated,
        };

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
  }, [slug, baseProduct]);

  // Auto-refresh product data every 60 seconds to keep it current
  useEffect(() => {
    if (!ui?.id) return;

    const interval = setInterval(() => {
      refreshProduct(ui.id);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [ui?.id]);

  // Pricing logic using effective_price from backend API
  const pricingInfo = useMemo(() => {
    if (!ui) {
      return {
        displayPrice: 0,
        strikethroughPrice: undefined,
        hasDiscount: false,
        discountPct: 0,
        isLoading: refreshing
      };
    }

    const effectivePrice = ui.effectivePrice;
    const basePrice = ui.basePrice;
    const currentPrice = ui.currentPrice;

    // Use current price if available, otherwise effective price
    const displayPrice = currentPrice ?? effectivePrice;

    if (basePrice && displayPrice !== basePrice && displayPrice < basePrice) {
      // Show discount pricing
      return {
        displayPrice,
        strikethroughPrice: basePrice,
        hasDiscount: true,
        discountPct: ui.discountPercentage ?? Math.round(((basePrice - displayPrice) / basePrice) * 100),
        isLoading: refreshing
      };
    } else {
      // Show regular pricing
      return {
        displayPrice,
        strikethroughPrice: undefined,
        hasDiscount: false,
        discountPct: 0,
        isLoading: refreshing
      };
    }
  }, [ui, refreshing]);

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
      {/* Main */}
      <div className="max-w-6xl mx-auto p-6">
        <Link to="/" className="text-sm text-green-800 hover:underline">
          ← Back to Collection
        </Link>

        {/* Cart Success Message */}
        {cartSuccess && (
          <div className="mt-4 mb-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="text-green-600 text-sm"> {cartSuccess}</div>
                <button
                  onClick={() => setCartSuccess(null)}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Error Message */}
        {cartError && (
          <div className="mt-4 mb-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="text-red-600 text-sm"> {cartError}</div>
                <button
                  onClick={() => setCartError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

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
                <div className="text-[#2d5016] font-semibtml">{ui.reviews ?? 0}</div>
              </div>
            </div>

            {/* Updated price display using effective_price from backend API */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold text-[#2d5016] ${pricingInfo.isLoading ? 'opacity-50' : ''}`}>
                  ${pricingInfo.displayPrice.toFixed(2)}
                  {pricingInfo.isLoading && (
                    <span className="ml-2 text-sm text-slate-500">Updating...</span>
                  )}
                </div>
                {pricingInfo.strikethroughPrice && (
                  <div className="text-slate-400 line-through">
                    ${pricingInfo.strikethroughPrice.toFixed(2)}
                  </div>
                )}
                {pricingInfo.hasDiscount && (
                  <span className="bg-pink-600 text-white rounded px-2 py-0.5 text-sm">
                    {pricingInfo.discountPct}% OFF
                  </span>
                )}
                <button
                  onClick={() => refreshProduct(ui.id)}
                  className="ml-2 text-xs text-slate-500 hover:text-slate-700 underline"
                  disabled={pricingInfo.isLoading}
                >
                  {pricingInfo.isLoading ? 'Updating...' : 'Refresh Price'}
                </button>
              </div>
              <div className="text-slate-500 text-sm mt-1">
                Price includes delivery within 24 hours
                {ui.lastUpdated && (
                  <span className="ml-2">
                    • Updated {new Date(ui.lastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* qty + actions */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-slate-300 rounded">
                <button
                  className="w-9 h-10 hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={addingToCart}
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
                  disabled={addingToCart}
                  min="1"
                  max={ui.stock !== undefined ? ui.stock : undefined}
                />
                <button
                  className="w-9 h-10 hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setQty((q) => q + 1)}
                  disabled={addingToCart || (ui.stock !== undefined && qty >= ui.stock)}
                >
                  +
                </button>
              </div>

              <button
                className="rounded bg-pink-600 text-white px-6 py-2 font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={addingToCart || pricingInfo.isLoading || (ui.stock !== undefined && ui.stock <= 0)}
                onClick={handleAddToCart}
              >
                {addingToCart ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </span>
                ) : pricingInfo.isLoading ? (
                  'Loading Price...'
                ) : (ui.stock !== undefined && ui.stock <= 0) ? (
                  'Out of Stock'
                ) : (
                  `Add ${qty} to Cart`
                )}
              </button>

              <button className="rounded border border-[#2d5016] text-[#2d5016] px-4 py-2 hover:bg-[#2d5016] hover:text-white transition-colors">
                Add to Wishlist
              </button>
            </div>

            {/* Stock warning */}
            {ui.stock !== undefined && ui.stock <= 5 && ui.stock > 0 && (
              <div className="mt-2 text-amber-600 text-sm">
                ⚠️ Only {ui.stock} left in stock
              </div>
            )}

            {/* Quantity validation warning */}
            {ui.stock !== undefined && qty > ui.stock && (
              <div className="mt-2 text-red-600 text-sm">
                ⚠️ Requested quantity exceeds available stock
              </div>
            )}
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

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm mt-10">
          © 2025 Flowo. All rights reserved.
        </div>
      </div>
    </div>
  );
}
