import { twMerge } from "tailwind-merge";
import type { OrderStatus } from "@/types/order";

const styles: Record<OrderStatus, string> = {
  processing: "bg-amber-100 text-amber-700",
  out_for_delivery: "bg-sky-100 text-sky-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function StatusBadge({ status, className = "" }: { status: OrderStatus; className?: string }) {
  const label =
    status === "processing" ? "Processing" :
    status === "out_for_delivery" ? "Out for Delivery" : "Delivered";
  return (
    <span className={twMerge("rounded px-2 py-0.5 text-[11px] font-semibold", styles[status], className)}>
      {label}
    </span>
  );
}
