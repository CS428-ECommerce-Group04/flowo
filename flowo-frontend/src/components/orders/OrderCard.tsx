import { Link } from "react-router-dom";
import type { Order } from "@/types/order";
import StatusBadge from "./StatusBadge";

export default function OrderCard({ order }: { order: Order }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-extrabold text-slate-800">{order.id}</div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-2 text-xs text-slate-500">Customer</div>
        <div className="text-sm font-medium text-slate-800">{order.customer}</div>

        <div className="mt-3 text-xs text-slate-500">Items</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {order.items.map((it, i) => (
            <span key={i} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-base">
              {it}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">Total</div>
            <div className="font-bold">${order.total.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Order Date</div>
            <div className="font-medium">
              {new Date(order.orderDate).toLocaleDateString(undefined, {
                year: "numeric", month: "long", day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      <Link
        to={`/orders/${order.id}`}
        className="mt-4 inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
        title="Click to track this order"
      >
        Click to track this order
      </Link>
    </article>
  );
}
