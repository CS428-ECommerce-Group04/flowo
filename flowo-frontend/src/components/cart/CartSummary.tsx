import { useMemo, useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { useNavigate } from "react-router-dom";

const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FLAT = 7; // used when below threshold
const VALID_CODE = "FLOWER10"; // 10% off demo code

export default function CartSummary() {
  const subtotal = useCart((s) => s.subtotal());
  const loading = useCart((s) => s.loading);
  const error = useCart((s) => s.error);
  const clearError = useCart((s) => s.clearError);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const navigate = useNavigate();

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  const total = useMemo(() => {
    const d = Math.min(discount, subtotal); // guard
    return Math.max(0, subtotal - d + shipping);
  }, [subtotal, discount, shipping]);

  const apply = () => {
    if (code.trim().toUpperCase() === VALID_CODE) {
      setDiscount(Number((subtotal * 0.1).toFixed(2)));
    } else {
      setDiscount(0);
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <aside className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="text-red-600 text-sm">⚠️ {error}</div>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Promo */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="font-semibold text-slate-800">Promo Code</div>
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter promo code"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            disabled={loading}
          />
          <button
            onClick={apply}
            disabled={loading}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="font-semibold text-slate-800">Order Summary</div>

        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="font-medium">
              {loading ? "..." : `$${subtotal.toFixed(2)}`}
            </dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-medium text-pink-600">–${discount.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">Shipping</dt>
            <dd className="font-medium">
              {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
            </dd>
          </div>
        </dl>

        <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          🎉 Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}!
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-xl font-extrabold text-slate-900">
            {loading ? "..." : `$${total.toFixed(2)}`}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/checkout")}
          disabled={loading || subtotal === 0}
          className="mt-4 w-full rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Loading..." : "Proceed to Checkout"}
        </button>

        <button
          className="mt-2 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          disabled={loading}
        >
          Continue Shopping
        </button>
      </div>

      {/* Delivery info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm">
        <div className="font-semibold text-slate-800">Delivery Information</div>
        <ul className="mt-3 space-y-2 text-slate-600">
          <li>🚚 Same-day delivery available</li>
          <li>⏰ Order by 2 PM for same-day delivery</li>
          <li>🌿 Fresh flowers guaranteed</li>
        </ul>
      </div>
    </aside>
  );
}
