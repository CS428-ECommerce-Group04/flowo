import type { Product } from "@/types/product";
import Button from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { Link } from "react-router-dom";
import { recordRecommendationFeedback } from "@/services/recommendations";

export default function ProductRow({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  return (
    <article className="relative mb-8 overflow-hidden rounded-md border bg-white shadow-sm">
      {p.featured && <span className="badge-hot">Bestseller</span>}

      <Link to={`/products/${p.slug}`}>
        <img src={p.image} alt={p.name} className="h-56 w-full object-cover" />
      </Link>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-800">{p.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.description}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold">${p.price.toFixed(2)}</span>
          <Button variant="primary" className="px-3 py-1 text-xs" onClick={() =>   add({id: p.id,
                                                                                        name: p.name,
                                                                                        price: p.price,
                                                                                        qty: 1,
                                                                                        image: p.image,
                                                                                        description: p.description,
                                                                                        tags: p.tags,
                                                                                      })}>
            Add to Cart
          </Button>
        </div>
      </div>
    </article>
  );
}
