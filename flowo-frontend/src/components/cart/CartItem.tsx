import type { CartItem as Item } from "@/store/cart";
import { useCart } from "@/store/cart";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
      {children}
    </span>
  );
}

export default function CartItem({ item }: { item: Item }) {
  const { increment, decrement, remove } = useCart();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="grid grid-cols-[72px_1fr] gap-3 sm:grid-cols-[96px_1fr]">
        {/* image */}
        <img
          src={item.image}
          alt={item.name}
          className="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
        />

        {/* content */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-800">
                {item.name}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                {item.description}
              </p>
              {item.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="text-sm font-bold">${item.price.toFixed(2)}</div>
          </div>

          {/* qty + total + remove */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-600"
                onClick={() => decrement(item.id)}
                aria-label="decrease"
              >
                –
              </button>
              <div className="min-w-[32px] text-center text-sm font-semibold">
                {item.qty}
              </div>
              <button
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-green-700 text-white"
                onClick={() => increment(item.id)}
                aria-label="increase"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="text-slate-500">
                Total:{" "}
                <span className="font-semibold text-slate-800">
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </div>
              <button
                className="text-pink-600 hover:underline"
                onClick={() => remove(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
