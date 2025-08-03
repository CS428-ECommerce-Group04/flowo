import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ordersJson from "@/data/orders.json";
import type { Order } from "@/types/order";
import Container from "@/components/layout/Container";
import OrderCard from "@/components/orders/OrderCard";
import StatusBadge from "@/components/orders/StatusBadge";

const ORDERS: Order[] = ordersJson as Order[];

export default function TrackOrder() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ORDERS;
    return ORDERS.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q)
    );
  }, [query]);

  const onTrack = () => {
    const id = query.trim();
    if (!id) return;
    const found = ORDERS.find((o) => o.id.toLowerCase() === id.toLowerCase());
    if (found) navigate(`/orders/${found.id}`);
    else alert("Order not found. Try an ID like ORD-2024-001.");
  };

  return (
    <Container className="py-10">
      <h1 className="text-center text-2xl font-extrabold text-green-800">
        Track Your Order
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
        Enter your order ID below to track the status of your beautiful flower arrangement
      </p>

      {/* Search / Track */}
      <div className="mx-auto mt-6 max-w-3xl rounded-lg border bg-white p-3 shadow-sm">
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Enter Order ID (e.g., ORD-2024-001)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onTrack()}
          />
          <button
            onClick={onTrack}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Track Order
          </button>
        </div>
      </div>

      {/* Current Orders */}
      <div className="mt-8 rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-semibold text-slate-800">
            Current Orders - Click to Track
          </div>
          {/* optional legend */}
          <div className="hidden items-center gap-2 sm:flex">
            <StatusBadge status="processing" />
            <StatusBadge status="out_for_delivery" />
            <StatusBadge status="delivered" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      </div>
    </Container>
  );
}
