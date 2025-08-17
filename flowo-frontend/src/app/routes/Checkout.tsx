import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "@/components/layout/Container";
import { useCart } from "@/store/cart";
import { createOrder } from "@/services/orders";

type Payment = "cod" | "paypal" | "vnpay" | "momo";
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FLAT = 7;

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 font-semibold text-slate-800">{title}</div>
      {children}
    </section>
  );
}

function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "pink" | "blue" | "emerald" }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    pink: "bg-pink-600 text-white",
    blue: "bg-sky-600 text-white",
    emerald: "bg-emerald-600 text-white",
  };
  return <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${map[color]}`}>{children}</span>;
}

export default function Checkout() {
  const navigate = useNavigate();

  // cart
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());

  // ui state
  const [method, setMethod] = useState<Payment>("cod");
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", postal: "", note: "" });
  const [busy, setBusy] = useState(false);

  // totals
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  // TODO: replace with real user + address IDs from your profile
  const firebaseUID = ""; // Get this from auth context
  const SHIPPING_ADDRESS_ID = 1;
  const BILLING_ADDRESS_ID = 2;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.city || !form.postal) {
      alert("Please fill all required fields.");
      return;
    }
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setBusy(true);
    try {
      const resp = await createOrder(firebaseUID, {
        billing_address_id: BILLING_ADDRESS_ID,
        shipping_address_id: SHIPPING_ADDRESS_ID,
        shipping_method: "Standard",
        notes: form.note?.trim() || `Payment: ${method.toUpperCase()}`,
      });

      const codeOrId = resp.order_code ?? String(resp.order_id);
      navigate(`/orders/${encodeURIComponent(codeOrId)}`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create order: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-8">
      <h1 className="text-center text-2xl font-extrabold text-green-800">Secure Payment</h1>
      <p className="mt-1 text-center text-sm text-slate-500">Complete your beautiful flower order</p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Payment Method */}
          <SectionCard title="Payment Method">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["cod","paypal","vnpay","momo"] as Payment[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMethod(key)}
                  className={`rounded-xl border p-4 text-left shadow-sm transition ${
                    method === key ? "border-emerald-300 ring-2 ring-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input type="radio" checked={method === key} readOnly className="mt-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-800">
                          {key === "cod" ? "Cash on Delivery" : key === "paypal" ? "PayPal" : key === "vnpay" ? "VNPAY" : "MoMo"}
                        </div>
                        {key === "paypal" && <Badge color="blue">PayPal</Badge>}
                        {key === "vnpay" && <Badge color="blue">VNPAY</Badge>}
                        {key === "momo" && <Badge color="pink">MoMo</Badge>}
                      </div>
                      <div className="text-xs text-slate-500">
                        {key === "cod" ? "Pay when you receive" : key === "paypal" ? "Secure online payment" : key === "vnpay" ? "Vietnamese payment gateway" : "Mobile wallet payment"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Delivery Information */}
          <SectionCard title="Delivery Information">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-600">Full Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">Phone Number</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" required />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-slate-600">Delivery Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street, District 1" required />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-600">City</label>
                <select className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required>
                  <option value="">Select city</option>
                  <option>Ho Chi Minh City</option>
                  <option>Hanoi</option>
                  <option>Da Nang</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">Postal Code</label>
                <input className="input" value={form.postal} onChange={(e) => setForm({ ...form, postal: e.target.value })} placeholder="700000" required />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-slate-600">Special Instructions (Optional)</label>
              <textarea className="input h-24 resize-none" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g., Leave with the receptionist" />
            </div>
          </SectionCard>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="rounded-md bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? "Processing..." : "Complete Payment"}
            </button>
            <Link to="/cart" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
              Back to Cart
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <SectionCard title="Order Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium">${subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Delivery</dt>
                <dd className="font-medium">{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</dd>
              </div>
            </dl>
            <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              🎉 Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}!
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-slate-500">Total</div>
              <div className="text-xl font-extrabold text-slate-900">${total.toFixed(2)}</div>
            </div>
          </SectionCard>

          <SectionCard title="Order Items">
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt={it.name} className="h-12 w-12 rounded object-cover" />
                    <div>
                      <div className="text-sm font-medium text-slate-800">{it.name}</div>
                      <div className="text-xs text-slate-500">qty: {it.qty}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">${(it.price * it.qty).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Security & Trust">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>🔒 256-bit SSL encryption</li>
              <li>✅ 100% secure payment</li>
              <li>💳 Money-back guarantee</li>
            </ul>
          </SectionCard>
        </div>
      </form>
    </Container>
  );
}
