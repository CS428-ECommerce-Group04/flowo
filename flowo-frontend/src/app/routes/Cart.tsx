import Container from "@/components/layout/Container";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { useCart } from "@/store/cart";

export default function Cart() {
  const items = useCart((s) => s.items);
  const itemCount = useCart((s) => s.itemCount());

  return (
    <Container className="py-10">
      <h1 className="text-center text-2xl font-extrabold text-green-800">
        Shopping Cart
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Review your beautiful flower selections
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* left: items */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold text-slate-800">Cart Items</div>
            <div className="text-xs text-slate-500">{itemCount} Items</div>
          </div>

          <div className="space-y-3">
            {items.length ? (
              items.map((it) => <CartItem key={it.id} item={it} />)
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Your cart is empty.
              </div>
            )}
          </div>
        </section>

        {/* right: summary */}
        <CartSummary />
      </div>
    </Container>
  );
}
