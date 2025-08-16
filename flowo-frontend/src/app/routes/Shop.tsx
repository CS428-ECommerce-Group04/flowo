import React, { useMemo, useState, useEffect, useRef } from "react";
import { useCart } from "@/store/cart";
import { useNavigate } from "react-router-dom";
import { resolveProductImage } from "@/data/productImages";

/* ------------------------------- API types ------------------------------- */

type ApiResponse<T> = { message?: string; data: T };

type ApiProduct = {
  id?: number;
  product_id?: number;
  name: string;
  description?: string;
  base_price?: number;
  effective_price?: number;
  price?: number;
  image_url?: string;
  primaryImageUrl?: string;
  status?: string; // 'NewFlower' | 'OldFlower' | 'LowStock'
  flower_type?: string;
  stock_quantity?: number;
  slug?: string;
  tags?: string[];
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

/* ------------------------- Small helpers/utilities ------------------------ */

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Map API product -> UI product */
function mapApiToShopUI(p: ApiProduct) {
  const id = String(p.id ?? p.product_id ?? "");
  const price = Number(p.effective_price ?? p.price ?? p.base_price ?? 0);
  const slug = p.slug ?? (p.name ? slugify(p.name) : id);

  const imageFromApi = p.image_url ?? p.primaryImageUrl;
  const image = imageFromApi ?? resolveProductImage(p.name, slug);

  return {
    id,
    name: p.name,
    description: p.description ?? "",
    type: p.flower_type ?? "bouquet",
    price,
    image,
    tags: Array.isArray(p.tags)
      ? p.tags
      : ([p.flower_type, p.status].filter(Boolean) as string[]),
    compareAtPrice:
      p.base_price && price && price < p.base_price
        ? Number(p.base_price)
        : undefined,
    stock: p.stock_quantity ?? undefined,
    slug,
    care: "", // optional field your UI reads
    featured: p.status === "NewFlower",
  };
}

/* ------------------------------ UI bits ---------------------------------- */

function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-normal"
      style={{
        background: "var(--puck-color-green-10)",
        color: "var(--puck-color-green-03)",
        fontWeight: 400,
        fontSize: 12,
        lineHeight: "16px",
        marginRight: 8,
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  );
}

function BestsellerBadge() {
  return (
    <span
      className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: "#e91e63",
        color: "#fff",
        fontWeight: 500,
        fontSize: 12,
        lineHeight: "16px",
        marginRight: 8,
        marginBottom: 4,
      }}
    >
      Bestseller
    </span>
  );
}

/* ------------------------ Search Autocomplete ---------------------------- */

function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  products,
  placeholder = "Search flowers...",
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: any) => void;
  products: any[];
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const generateSuggestions = (query: string) => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.type.toLowerCase().includes(lower) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(lower)) ||
        p.care?.toLowerCase().includes(lower)
    );
    return matches
      .sort((a, b) => {
        const aName = a.name.toLowerCase().includes(lower);
        const bName = b.name.toLowerCase().includes(lower);
        if (aName && !bName) return -1;
        if (!aName && bName) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v.trim()) {
      const list = generateSuggestions(v);
      setSuggestions(list);
      setShowSuggestions(list.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((p) => (p < suggestions.length - 1 ? p + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((p) => (p > 0 ? p - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) handleSuggestionSelect(suggestions[selectedIndex]);
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionSelect = (product: any) => {
    onChange(product.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelect(product);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim() && suggestions.length > 0) setShowSuggestions(true);
          }}
          className="rounded-[8px] border border-[#dddddd] px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#2d5016] focus:border-transparent pr-10"
          style={{
            fontSize: 16,
            color: "#2d5016",
            background: "#fff",
            minHeight: 49,
          }}
        />

        {/* Search icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear */}
        {value && (
          <button
            onClick={() => {
              onChange("");
              setShowSuggestions(false);
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#dddddd] rounded-[8px] shadow-lg max-h-80 overflow-y-auto z-50"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.10)" }}
        >
          {suggestions.map((p, index) => (
            <div
              key={p.id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? "bg-[#f0f8f0] border-l-4 border-l-[#2d5016]" : "hover:bg-gray-50"
              }`}
              onClick={() => handleSuggestionSelect(p)}
            >
              <div className="flex items-start gap-3">
                <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#2d5016] text-sm mb-1">
                    {highlightMatch(p.name, value)}
                    {p.featured && (
                      <span className="ml-2 text-xs bg-[#e91e63] text-white px-2 py-0.5 rounded">Bestseller</span>
                    )}
                  </div>
                  <div className="text-gray-600 text-xs mb-1 line-clamp-2">
                    {highlightMatch(p.description, value)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{p.type}</span>
                    {p.tags && p.tags.length > 0 && (
                      <span>
                        {p.tags.slice(0, 2).map((t: string) => (
                          <span key={t} className="text-blue-600 mr-1">#{t}</span>
                        ))}
                      </span>
                    )}
                    <span className="text-green-600">{p.stock} in stock</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {p.compareAtPrice && (
                    <div className="text-xs text-gray-400 line-through">${p.compareAtPrice}</div>
                  )}
                  <div className="font-semibold text-[#2d5016]">${p.price}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
            {suggestions.length} result{suggestions.length !== 1 ? "s" : ""} • Use ↑↓, Enter
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Cards ------------------------------------ */

function FlowerCard({
  product,
  onAddToCart,
  onNavigateToDetail,
  isHighlighted = false,
}: {
  product: any;
  onAddToCart: () => void;
  onNavigateToDetail: () => void;
  isHighlighted?: boolean;
}) {
  return (
    <div
      className="w-full rounded-[16px] bg-white shadow cursor-pointer"
      style={{
        marginBottom: 32,
        boxShadow: isHighlighted
          ? "0 0 0 2px #e91e63, 0 2px 8px rgba(0,0,0,0.04)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="relative" onClick={onNavigateToDetail}>
        {product.featured && (
          <div style={{ position: "absolute", left: 8, top: 8, zIndex: 2 }}>
            <BestsellerBadge />
          </div>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="w-full"
          style={{
            height: 256,
            objectFit: "cover",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        />
      </div>
      <div className="p-6 flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h3
            className="font-bold cursor-pointer hover:text-opacity-80"
            style={{ color: "#2d5016", fontSize: 20, lineHeight: "28px", fontWeight: 700 }}
            onClick={onNavigateToDetail}
          >
            {product.name}
          </h3>
          <p
            style={{ color: "#666", fontSize: 16, lineHeight: "24px", fontWeight: 400, marginBottom: 4 }}
            onClick={onNavigateToDetail}
          >
            {product.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 mb-2" onClick={onNavigateToDetail}>
          {product.tags?.map((tag: string) => (
            <TagBadge key={tag}>{tag}</TagBadge>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-baseline" onClick={onNavigateToDetail}>
            <span style={{ color: "#2d5016", fontWeight: 700, fontSize: 24, marginRight: 2 }}>$</span>
            <span style={{ color: "#2d5016", fontWeight: 700, fontSize: 24 }}>
              {product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span
                style={{
                  color: "#666",
                  fontWeight: 400,
                  fontSize: 16,
                  textDecoration: "line-through",
                  marginLeft: 8,
                }}
              >
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </span>
          <button
            className="rounded-[8px] px-6 py-2 font-medium hover:bg-opacity-90"
            style={{
              background: "#e91e63",
              color: "#fff",
              fontWeight: 500,
              fontSize: 16,
              minWidth: 135,
              minHeight: 40,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Pagination -------------------------------- */

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex gap-2 justify-center my-8">
      <button
        className="rounded-[8px] border border-[#dddddd] px-6 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minWidth: 91, minHeight: 41, color: "#2d5016", background: "#fff" }}
        onClick={onPrev}
        disabled={page === 1}
      >
        Previous
      </button>
      <button
        className="rounded-[8px] border border-[#dddddd] px-6 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minWidth: 60, minHeight: 41, color: "#2d5016", background: "#fff" }}
        onClick={onNext}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}

/* ----------------------------- Data hook --------------------------------- */

function useProducts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any[]>([]); // UI product[]

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/products`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        const raw = await res.text();
        if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

        let parsed: ApiResponse<ApiProduct[]> | ApiProduct[];
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error("Invalid JSON from /products");
        }

        const list: ApiProduct[] = Array.isArray(parsed)
          ? parsed
          : (parsed as ApiResponse<ApiProduct[]>).data ?? [];

        const mapped = list.map(mapApiToShopUI);
        if (alive) setData(mapped);
      } catch (e: any) {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
}

/* ------------------------------- Page ------------------------------------ */

export default function Shop() {
  const add = useCart((s) => s.add);
  const navigate = useNavigate();
  const { data: products, loading, error } = useProducts();

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortKey, setSortKey] =
    useState<"name-asc" | "price-asc" | "price-desc">("name-asc");
  const [page, setPage] = useState(1);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const ALL_TAGS = useMemo(() => {
    if (!products.length) return [];
    return [...new Set(products.flatMap((p) => p.tags || []))].sort();
  }, [products]);

  const PAGE_SIZE = 4;
  const MAX_VISIBLE_TAGS = 6;

  const filtered = useMemo(() => {
    if (!products.length) return [];
    let list = products;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q))) ||
          (p.care && p.care.toLowerCase().includes(q))
      );
    }

    if (selectedTags.length > 0) {
      list = list.filter((p) => selectedTags.every((tag) => p.tags && p.tags.includes(tag)));
    }

    if (highlightedProductId) {
      list = list.filter((p) => p.id === highlightedProductId);
    }

    if (sortKey === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, search, selectedTags, sortKey, highlightedProductId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const recommended = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [filtered]);

  function handleTagToggle(tag: string) {
    setHighlightedProductId(null);
    setPage(1);
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleReset() {
    setSearch("");
    setSelectedTags([]);
    setSortKey("name-asc");
    setPage(1);
    setHighlightedProductId(null);
    setShowFilters(false);
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSortKey(e.target.value as any);
    setPage(1);
  }

  function handleRecommendationClick() {
    if (!recommended) return;
    if (recommended.tags && recommended.tags.length > 0) {
      setSelectedTags(recommended.tags);
      setHighlightedProductId(null);
    } else {
      setHighlightedProductId(recommended.id);
    }
    setPage(1);
  }

  function toggleFilters() {
    setShowFilters(!showFilters);
  }

  function handleNavigateToProduct(product: any) {
    navigate(`/products/${product.slug}`);
  }

  function handleProductSelect(product: any) {
    setHighlightedProductId(product.id);
    setPage(1);
    setTimeout(() => {
      const el = document.getElementById(`product-${product.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  return (
    <main
      className="w-full min-h-screen"
      style={{ background: "#fefefe", fontFamily: "Inter, sans-serif", color: "#2d5016" }}
    >
      <div className="flex flex-col items-center w-full px-2 md:px-0">
        <h1
          className="mt-8 mb-2"
          style={{ color: "#2d5016", fontWeight: 700, fontSize: 36, lineHeight: "40px", textAlign: "center", width: 435, maxWidth: "100%" }}
        >
          Fresh Flowers Collection
        </h1>
        <p
          className="mb-8"
          style={{ color: "#666", fontWeight: 400, fontSize: 20, lineHeight: "28px", textAlign: "center", width: 618, maxWidth: "100%" }}
        >
          Discover our beautiful selection of handpicked flowers, perfect for every occasion and moment that matters.
        </p>

        {/* Controls */}
        <section
          className="w-full max-w-5xl mb-8"
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 1.5px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.04), 0 0.25px 0.5px rgba(0,0,0,0.04)",
            padding: 32,
            marginBottom: 32,
          }}
        >
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Error loading products. Please try again.</div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div className="w-full md:w-1/2">
                  <SearchAutocomplete
                    value={search}
                    onChange={(v) => {
                      setSearch(v);
                      setHighlightedProductId(null);
                      setPage(1);
                    }}
                    onSelect={handleProductSelect}
                    products={products}
                    placeholder="Search flowers by name, description, or type..."
                  />
                </div>

                {ALL_TAGS.length > 6 && (
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-[8px] px-4 py-2 flex items-center gap-2 hover:opacity-90"
                      style={{
                        background: showFilters ? "#2d5016" : "#fff",
                        color: showFilters ? "#fff" : "#2d5016",
                        border: "1px solid #dddddd",
                        fontWeight: 500,
                        fontSize: 16,
                        minWidth: 100,
                      }}
                      onClick={toggleFilters}
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
                      </svg>
                      Filters
                      {selectedTags.length > 0 && (
                        <span
                          className="rounded-full text-xs px-2 py-0.5"
                          style={{
                            background: showFilters ? "#fff" : "#2d5016",
                            color: showFilters ? "#2d5016" : "#fff",
                            marginLeft: 4,
                          }}
                        >
                          {selectedTags.length}
                        </span>
                      )}
                    </button>
                    <button
                      className="rounded-[8px] px-4 py-2 hover:opacity-90"
                      style={{ background: "#2d5016", color: "#fff", fontWeight: 500, fontSize: 16, minWidth: 79 }}
                      onClick={handleReset}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {(ALL_TAGS.length <= 6 || showFilters) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className="rounded-[8px] px-4 py-2 hover:opacity-90"
                      style={{
                        background: selectedTags.includes(tag) ? "#2d5016" : "#fff",
                        color: selectedTags.includes(tag) ? "#fff" : "#2d5016",
                        border: "1px solid #dddddd",
                        fontWeight: 500,
                        fontSize: 16,
                        minWidth: 80,
                      }}
                      onClick={() => {
                        setHighlightedProductId(null);
                        setPage(1);
                        setSelectedTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        );
                      }}
                      type="button"
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                  {ALL_TAGS.length <= 6 && (
                    <button
                      className="rounded-[8px] px-4 py-2 hover:opacity-90"
                      style={{ background: "#2d5016", color: "#fff", fontWeight: 500, fontSize: 16, minWidth: 79, marginLeft: 8 }}
                      onClick={handleReset}
                      type="button"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-2">
                <span style={{ color: "#666", fontSize: 14 }}>Sort by:</span>
                <select
                  value={sortKey}
                  onChange={(e) => {
                    setSortKey(e.target.value as any);
                    setPage(1);
                  }}
                  className="rounded-[8px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5016]"
                  style={{ background: "#d9d9d9", fontSize: 16, color: "#000", minWidth: 185, border: "none" }}
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
                <span className="ml-auto" style={{ color: "#666", fontSize: 14 }}>
                  Showing {Math.min(filtered.length - (page - 1) * 4, paged.length)} of {filtered.length} products
                </span>
              </div>
            </>
          )}
        </section>

        {/* Recommendation */}
        {!loading && !error && recommended && (
          <section
            className="w-full max-w-5xl mb-8 cursor-pointer hover:transform hover:-translate-y-1 transition-all duration-200"
            onClick={handleRecommendationClick}
            style={{
              background: "#f8fdf4",
              borderRadius: 16,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.04), 0 1.5px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)",
              padding: 24,
              marginBottom: 32,
            }}
          >
            <div className="flex items-center gap-6">
              <img
                src={recommended.image}
                alt={recommended.name}
                style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 12, marginRight: 24 }}
              />
              <div>
                <div style={{ color: "#2d5016", fontWeight: 700, fontSize: 18 }}>Recommended for you (click to filter)</div>
                <div style={{ color: "#666", fontSize: 16 }}>
                  {recommended.name} – {recommended.description}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Product list */}
        <section className="w-full max-w-5xl">
          {loading ? (
            <div className="text-center text-lg text-[#2d5016] py-12">Loading products...</div>
          ) : error ? (
            <div className="text-center text-lg text-red-500 py-12">Error loading products. Please try again.</div>
          ) : paged.length === 0 ? (
            <div className="text-center text-lg text-[#2d5016] py-12">No products found.</div>
          ) : (
            paged.map((p) => (
              <div key={p.id} id={`product-${p.id}`}>
                <FlowerCard
                  product={p}
                  isHighlighted={p.id === highlightedProductId}
                  onAddToCart={() =>
                    add({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      qty: 1,
                      image: p.image,
                      description: p.description,
                      tags: p.tags,
                    })
                  }
                  onNavigateToDetail={() => navigate(`/products/${p.slug}`)}
                />
              </div>
            ))
          )}
        </section>

        {/* Pagination */}
        {!loading && !error && filtered.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((x) => Math.max(1, x - 1))}
            onNext={() => setPage((x) => Math.min(totalPages, x + 1))}
          />
        )}

        {/* Footer */}
        <footer
          className="w-full mt-12"
          style={{
            background: "#2d5016",
            minHeight: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: 18 }}>© 2024 Flowo. All rights reserved.</span>
        </footer>
      </div>
    </main>
  );
}
