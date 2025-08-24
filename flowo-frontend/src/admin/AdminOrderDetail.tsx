import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { makeApiRequest } from "@/config/api";


type OrderItem = {
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product_name?: string; 
};

type OrderDetail = {
  order_id: number;
  status: string;
  order_date: string;
  total_amount: number;
  shipping_method: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
};

type Props = {
  orderId: number | null;
  onClose: () => void;
};
export default function AdminOrderDetail({ orderId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);

    makeApiRequest(`/admin/orders/${orderId}`)
      .then((data: OrderDetail) => {
        setOrder(data);
        setErr(null);
      })
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Dialog open={!!orderId} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-slate-800 flex justify-between">
            Order #{orderId}
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              ✕
            </button>
          </Dialog.Title>

          {loading && <p className="mt-4 text-slate-500">Loading order details…</p>}
          {err && <p className="mt-4 text-red-600">Error: {err}</p>}

          {order && (
            <div className="mt-4 space-y-4">
              {/* Customer Info */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-medium text-slate-700">Customer</h3>
                <p>{order.customer_name}</p>
                <p className="text-slate-500 text-sm">{order.customer_email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span> {order.status}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(order.order_date).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Shipping:</span>{" "}
                  {order.shipping_method}
                </div>
                <div>
                  <span className="font-medium">Total:</span>{" "}
                  ${order.total_amount.toFixed(2)}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-slate-700 mb-2">Items</h3>
                <table className="w-full text-sm border">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Product ID</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{it.product_id}</td>
                        <td className="px-3 py-2 text-center">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">${it.price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${it.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
