import { useMemo, useState } from "react";
import productsJson from "@/data/products.json";
import type { Product } from "@/types/product";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import ProductRow from "@/components/catalog/ProductRow";
import FilterDrawer from "@/components/catalog/FilterDrawer";

const products: Product[] = productsJson as Product[];

export default function Shop() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "price">("name");
  const [drawer, setDrawer] = useState(false);

  const list = useMemo(() => {
    let res = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    res = [...res].sort((a, b) =>
      sortKey === "name" ? a.name.localeCompare(b.name) : a.price - b.price
    );
    return res;
  }, [search, sortKey]);

  return (
    <>
      {drawer && <FilterDrawer onClose={() => setDrawer(false)} />}

      <Container className="py-10">
        <h1 className="text-center text-2xl font-extrabold text-green-800">
          Fresh Flowers Collection
        </h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500">
          Discover our beautiful selection of hand-picked flowers, perfect
          for every occasion and moment that matters.
        </p>

        <div className="mt-8 rounded-lg border bg-white p-4">
          <input
            placeholder="Search flowers..."
            className="input mb-3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setDrawer(true)}>
              Filters
            </Button>
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => { setSearch(""); setSortKey("name"); }}>
              Reset
            </Button>

            <div className="ml-auto flex items-center gap-2 text-xs">
              <label htmlFor="sort">Sort:</label>
              <select
                id="sort"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as "name" | "price")}
              >
                <option value="name">Name A-Z</option>
                <option value="price">Price ↑</option>
              </select>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Showing {list.length} product{list.length !== 1 && "s"}
          </p>
        </div>

        <div className="mt-6">
          {list.map((p) => <ProductRow key={p.id} p={p} />)}
        </div>
      </Container>
    </>
  );
}
