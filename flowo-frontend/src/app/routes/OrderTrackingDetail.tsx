import { Link, useParams, useNavigate } from "react-router-dom";
import detailsJson from "@/data/orderDetails.json";
import type { OrderDetail, TimelineStep } from "@/types/order";
import Container from "@/components/layout/Container";

const DETAILS = detailsJson as OrderDetail[];

function StatusPill({ status }: { status: OrderDetail["status"] }) {
  const m = {
    processing: "bg-amber-100 text-amber-700",
    out_for_delivery: "bg-sky-100 text-sky-700",
    delivered: "bg-emerald-100 text-emerald-700",
  } as const;
  const label =
    status === "processing" ? "Processing" :
    status === "out_for_delivery" ? "Out for Delivery" : "Delivered";
  return <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${m[status]}`}>{label}</span>;
}

function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative ml-4 border-l-2 border-emerald-200 pl-4">
      {steps.map((s, idx) => (
        <li key={s.key} className="mb-6 last:mb-0">
          {/* dot */}
          <span
            className={[
              "absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white",
              s.status === "done" || s.status === "current" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
            ].join(" ")}
          >
            {s.status === "pending" ? "•" : "✓"}
          </span>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">{s.title}</div>
              <p className="mt-1 text-xs text-slate-600">{s.desc}</p>
              {s.status === "current" && (
                <div className="mt-2 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  <div>📡 <b>Live Update</b></div>
                  <div>Your delivery is currently <b>15 minutes</b> away from the destination</div>
                </div>
              )}
            </div>
            {s.at && <div className="whitespace-nowrap text-[11px] text-slate-500">{s.at}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function OrderTrackingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = DETAILS.find((o) => o.id === id);

  if (!order) {
    return (
      <Container className="py-10">
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <div className="text-lg font-semibold">Order not found</div>
          <button onClick={() => navigate("/track")} className="mt-3 rounded-md border px-3 py-2 text-sm">
            ← Back to Orders
          </button>
        </div>
      </Container>
    );
  }

  const total = order.subtotal; // add shipping/discount here if needed

  return (
    <Container className="py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/track" className="text-sm text-slate-600 hover:underline">← Back to Orders</Link>
        <div className="flex items-center gap-2">
          <StatusPill status={order.status} />
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
        </div>
      </div>

      <h1 className="text-xl font-extrabold text-slate-900">Order Tracking</h1>
      <div className="mt-1 text-sm text-slate-500">Order ID: <span className="font-medium">{order.id}</span></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* LEFT: timeline */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 font-semibold text-slate-800">Delivery Timeline</div>
          <Timeline steps={order.timeline} />
        </section>

        {/* RIGHT: info cards */}
        <div className="space-y-4">
          {/* Delivery information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="font-semibold text-slate-800">Delivery Information</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Estimated Delivery</dt>
                <dd className="font-medium text-slate-800">{order.eta ?? "Today, 2:00 PM – 6:00 PM"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Delivery Address</dt>
                <dd className="font-medium text-slate-800">{order.address}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Customer</dt>
                <dd className="font-medium text-slate-800">{order.customer}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone Number</dt>
                <dd className="font-medium text-slate-800">
                  {order.phone} <button className="ml-1 text-xs text-emerald-700">Call</button>
                </dd>
              </div>
            </dl>
          </section>

          {/* Driver */}
          {order.driver && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-semibold text-slate-800">Delivery Driver</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold">
                    {order.driver.initials ?? order.driver.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{order.driver.name}</div>
                    <div className="text-xs text-slate-500">{order.driver.vehicle}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white">Call Driver</button>
                <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Track on Map</button>
              </div>
            </section>
          )}

          {/* Quick actions */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="font-semibold text-slate-800">Quick Actions</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button className="rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white">Modify Delivery</button>
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel Order</button>
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Contact Support</button>
            </div>
          </section>

          {/* Help */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm">
            <div className="font-semibold text-slate-800">Need Help?</div>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>📞 Call us: 1-555-123-FLOW</li>
              <li>💬 Live Chat Support</li>
              <li>✉️ help@flowo.com</li>
            </ul>
          </section>
        </div>
      </div>

      {/* Order items */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 font-semibold text-slate-800">Order Items</div>
        <div className="divide-y">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-rose-50 text-lg">{it.icon ?? "🌸"}</div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{it.name}</div>
                  <div className="text-xs text-slate-500">Quantity: {it.qty}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {it.tags?.map((t) => (
                      <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">${(it.price * it.qty).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-slate-500">Total Amount</div>
          <div className="text-base font-extrabold">${order.subtotal.toFixed(2)}</div>
        </div>
      </section>
    </Container>
  );
}
