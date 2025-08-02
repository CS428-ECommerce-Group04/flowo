import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import productsJson from "@/data/products.json";
import type { Product } from "@/types/product";
import Container from "@/components/layout/Container";
import { useCart } from "@/store/cart";
import Button from "@/components/ui/Button";

const products = productsJson as Product[];

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
      {children}
    </span>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"reviews" | "care">("reviews");

  const product = useMemo(
    () => products.find((p) => p.slug === slug),
    [slug]
  );

  if (!product) {
    return (
      <Container className="py-12">
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <div className="text-lg font-semibold text-slate-800">
            Product not found
          </div>
          <Button className="mt-4" variant="outline" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
        </div>
      </Container>
    );
  }

  const oldPrice = product.compareAtPrice ?? Number((product.price * 1.25).toFixed(2));
  const hasCompare = oldPrice > product.price;
  const discountPct = hasCompare
    ? Math.round(((oldPrice - product.price) / oldPrice) * 100)
    : 0;

  const stockText = product.stock != null ? `${product.stock} bouquets` : "In stock";
  const typeText = product.type ?? product.name;
  const conditionText = product.condition ?? "Fresh & New";
  const careText = product.care ?? "Cool water daily";

  const rating = product.rating?.average ?? 4.7;
  const counts = product.rating?.counts ?? { "5": 2, "4": 1, "3": 0 };

  return (
    <Container className="py-8">
      <Link to="/" className="mb-4 inline-flex items-center text-sm text-slate-600 hover:underline">
        ← Back to Collection
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT: image */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {product.featured && (
            <span className="absolute left-4 top-4 rounded bg-pink-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
              Bestseller
            </span>
          )}
          <img
            src={product.image}
            alt={product.name}
            className="h-[340px] w-full rounded-lg object-cover md:h-[420px]"
          />
        </div>

        {/* RIGHT: info */}
        <div>
          <h1 className="text-2xl font-extrabold text-green-800">{product.name}</h1>

          <p className="mt-2 max-w-prose text-sm text-slate-600">
            {product.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1">
            {product.tags.map((t) => <Tag key={t}>{t}</Tag>)}
          </div>

          {/* specs */}
          <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500">Flower Type</div>
              <div className="font-medium text-slate-800">{typeText}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Condition</div>
              <div className="font-medium text-slate-800">{conditionText}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Stock Available</div>
              <div className="font-medium text-slate-800">{stockText}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Care Instructions</div>
              <div className="font-medium text-slate-800">{careText}</div>
            </div>
          </div>

          {/* price */}
          <div className="mt-5 flex items-end gap-3">
            <div className="text-2xl font-extrabold text-emerald-700">
              ${product.price.toFixed(2)}
            </div>
            {hasCompare && (
              <>
                <div className="text-sm text-slate-400 line-through">
                  ${oldPrice.toFixed(2)}
                </div>
                <span className="rounded bg-pink-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {discountPct}% Off
                </span>
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Price includes delivery within 24 hours
          </div>

          {/* qty + actions */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-sm text-slate-600">Quantity:</div>
            <div className="flex items-center rounded-md border border-slate-300">
              <button className="h-8 w-8" onClick={() => setQty((q) => Math.max(1, q - 1))}>–</button>
              <input
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="h-8 w-10 border-l border-r border-slate-300 text-center text-sm outline-none"
              />
              <button className="h-8 w-8" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>

            <button
              className="rounded-md bg-pink-600 px-5 py-2 text-sm font-semibold text-white"
              onClick={() =>
                add({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  qty,
                  image: product.image,
                  description: product.description,
                  tags: product.tags,
                })
              }
            >
              Add to Cart
            </button>

            <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Add to Wishlist
            </button>
          </div>

          {/* tabs */}
          <div className="mt-8">
            <div className="flex gap-6 border-b border-slate-200 text-sm">
              <button
                className={`pb-2 ${tab === "reviews" ? "border-b-2 border-emerald-600 font-semibold text-emerald-700" : "text-slate-500"}`}
                onClick={() => setTab("reviews")}
              >
                Customer Reviews ({Object.values(counts).reduce((a, b) => a + (b || 0), 0)})
              </button>
              <button
                className={`pb-2 ${tab === "care" ? "border-b-2 border-emerald-600 font-semibold text-emerald-700" : "text-slate-500"}`}
                onClick={() => setTab("care")}
              >
                Care Instructions
              </button>
            </div>

            {tab === "reviews" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold text-slate-800">{rating.toFixed(1)}</div>
                  <div className="text-xs text-slate-500">
                    Based on {Object.values(counts).reduce((a, b) => a + (b || 0), 0)} reviews
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  {(["5","4","3","2","1"] as const).map((k) => (
                    <div key={k} className="grid grid-cols-[28px_1fr_20px] items-center gap-2">
                      <div className="text-slate-600">{k}★</div>
                      <div className="h-2 rounded bg-slate-100">
                        <div
                          className="h-2 rounded bg-amber-400"
                          style={{
                            width: `${((counts[k] || 0) / Math.max(1, (counts["5"]||0)+(counts["4"]||0)+(counts["3"]||0)+(counts["2"]||0)+(counts["1"]||0))) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-right text-slate-500">{counts[k] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <ul className="list-disc space-y-2 pl-5 text-slate-600">
                  <li>{careText}</li>
                  <li>Keep away from direct sunlight and heat sources.</li>
                  <li>Trim stems at an angle every two days.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
