import React, { useMemo, useState, useEffect } from "react";
import productsJson from "@/data/products.json";
import { useCart } from "@/store/cart";
import { useNavigate } from "react-router-dom";

// --- Pattern Components ---
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
        boxShadow:
          "0 0 0 2px #e91e63, 0 2px 8px 0 rgba(0,0,0,0.04), 0 1.5px 4px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.04), 0 0.5px 1px 0 rgba(0,0,0,0.04), 0 0.25px 0.5px 0 rgba(0,0,0,0.04)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isHighlighted
          ? "0 0 0 2px #e91e63, 0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 6px 0 rgba(0,0,0,0.08)"
          : "0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 6px 0 rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isHighlighted
          ? "0 0 0 2px #e91e63, 0 2px 8px 0 rgba(0,0,0,0.04), 0 1.5px 4px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.04), 0 0.5px 1px 0 rgba(0,0,0,0.04), 0 0.25px 0.5px 0 rgba(0,0,0,0.04)"
          : "0 2px 8px 0 rgba(0,0,0,0.04), 0 1.5px 4px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.04), 0 0.5px 1px 0 rgba(0,0,0,0.04), 0 0.25px 0.5px 0 rgba(0,0,0,0.04)";
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
            style={{
              color: "#2d5016",
              fontSize: 20,
              lineHeight: "28px",
              fontWeight: 700,
              transition: "opacity 0.2s",
            }}
            onClick={onNavigateToDetail}
          >
            {product.name}
          </h3>
          <p
            style={{
              color: "#666",
              fontSize: 16,
              lineHeight: "24px",
              fontWeight: 400,
              marginBottom: 4,
            }}
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
            <span
              style={{
                color: "#2d5016",
                fontWeight: 700,
                fontSize: 24,
                lineHeight: "32px",
                marginRight: 2,
              }}
            >
              $
            </span>
            <span
              style={{
                color: "#2d5016",
                fontWeight: 700,
                fontSize: 24,
                lineHeight: "32px",
              }}
            >
              {product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span
                style={{
                  color: "#666",
                  fontWeight: 400,
                  fontSize: 16,
                  lineHeight: "24px",
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
              lineHeight: "24px",
              minWidth: 135,
              minHeight: 40,
              transition: "background-color 0.2s",
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
        style={{
          minWidth: 91,
          minHeight: 41,
          color: "#2d5016",
          fontWeight: 400,
          fontSize: 16,
          lineHeight: "24px",
          background: "#fff",
          transition: "background-color 0.2s",
        }}
        onClick={onPrev}
        disabled={page === 1}
      >
        Previous
      </button>
      <button
        className="rounded-[8px] border border-[#dddddd] px-6 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          minWidth: 60,
          minHeight: 41,
          color: "#2d5016",
          fontWeight: 400,
          fontSize: 16,
          lineHeight: "24px",
          background: "#fff",
          transition: "background-color 0.2s",
        }}
        onClick={onNext}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}

// --- Data fetching function (can be replaced with API call later) ---
function useProducts() {
  // This function simulates an API call and can be replaced with a real API call later
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      try {
        // Use the imported JSON data
        setData(productsJson);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
}

// --- Main Shop Page ---
export default function Shop() {
  const add = useCart((s) => s.add);
  const navigate = useNavigate();
  const { data: products, loading, error } = useProducts();

  // --- State ---
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<"name-asc" | "price-asc" | "price-desc">("name-asc");
  const [page, setPage] = useState(1);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // --- Extract all unique tags from products ---
  const ALL_TAGS = useMemo(() => {
    if (!products.length) return [];
    return [...new Set(products.flatMap((p) => p.tags || []))].sort();
  }, [products]);

  const PAGE_SIZE = 4;
  const MAX_VISIBLE_TAGS = 6; // Show filter button when more than this many tags

  // --- Filtering, Sorting, Pagination ---
  const filtered = useMemo(() => {
    if (!products.length) return [];

    let list = products;

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      list = list.filter((p) =>
        selectedTags.every((tag) => p.tags && p.tags.includes(tag))
      );
    }

    // Filter by highlighted product
    if (highlightedProductId) {
      list = list.filter((p) => p.id === highlightedProductId);
    }

    // Sort
    if (sortKey === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortKey === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, search, selectedTags, sortKey, highlightedProductId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Recommendation ---
  const recommended = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [filtered]);

  // --- Handlers ---
  function handleTagToggle(tag: string) {
    setHighlightedProductId(null);
    setPage(1);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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

    // Option 1: Filter by the recommended product's tags
    if (recommended.tags && recommended.tags.length > 0) {
      setSelectedTags(recommended.tags);
      setHighlightedProductId(null);
    } 
    // Option 2: Highlight the recommended product
    else {
      setHighlightedProductId(recommended.id);
    }
    setPage(1);
  }

  function toggleFilters() {
    setShowFilters(!showFilters);
  }

  function handleNavigateToProduct(product: any) {
    // Navigate to product detail page using the product slug
    navigate(`/products/${product.slug}`);
  }

  // --- Render ---
  return (
    <main
      className="w-full min-h-screen"
      style={{
        background: "#fefefe",
        fontFamily: "Inter, sans-serif",
        color: "#2d5016",
      }}
    >
      
      {/* Main Content */}
      <div className="flex flex-col items-center w-full px-2 md:px-0">
        {/* Title */}
        <h1
          className="mt-8 mb-2"
          style={{
            color: "#2d5016",
            fontWeight: 700,
            fontSize: 36,
            lineHeight: "40px",
            textAlign: "center",
            width: 435,
            maxWidth: "100%",
          }}
        >
          Fresh Flowers Collection
        </h1>
        <p
          className="mb-8"
          style={{
            color: "#666",
            fontWeight: 400,
            fontSize: 20,
            lineHeight: "28px",
            textAlign: "center",
            width: 618,
            maxWidth: "100%",
          }}
        >
          Discover our beautiful selection of handpicked flowers, perfect for every occasion and moment that matters.
        </p>

        {/* Controls Card */}
        <section
          className="w-full max-w-5xl mb-8"
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow:
              "0 2px 8px 0 rgba(0,0,0,0.04), 0 1.5px 4px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.04), 0 0.5px 1px 0 rgba(0,0,0,0.04), 0 0.25px 0.5px 0 rgba(0,0,0,0.04)",
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
              {/* Search and Filter Toggle */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search flowers..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedProductId(null);
                    setPage(1);
                  }}
                  className="rounded-[8px] border border-[#dddddd] px-4 py-3 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-[#2d5016] focus:border-transparent"
                  style={{
                    fontSize: 16,
                    color: "#2d5016",
                    background: "#fff",
                    minHeight: 49,
                    marginRight: 16,
                  }}
                />

                {/* Filter Toggle Button (shown when many tags) */}
                {ALL_TAGS.length > MAX_VISIBLE_TAGS && (
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-[8px] px-4 py-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
                      style={{
                        background: showFilters ? "#2d5016" : "#fff",
                        color: showFilters ? "#fff" : "#2d5016",
                        border: "1px solid #dddddd",
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: "24px",
                        minWidth: 100,
                      }}
                      onClick={toggleFilters}
                      type="button"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
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
                      className="rounded-[8px] px-4 py-2 hover:opacity-90 transition-opacity"
                      style={{
                        background: "#2d5016",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: "24px",
                        minWidth: 79,
                      }}
                      onClick={handleReset}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Filter Tags */}
              {(ALL_TAGS.length <= MAX_VISIBLE_TAGS || showFilters) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className="rounded-[8px] px-4 py-2 hover:opacity-90 transition-opacity"
                      style={{
                        background: selectedTags.includes(tag)
                          ? "#2d5016"
                          : "#fff",
                        color: selectedTags.includes(tag)
                          ? "#fff"
                          : "#2d5016",
                        border: "1px solid #dddddd",
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: "24px",
                        minWidth: 80,
                      }}
                      onClick={() => handleTagToggle(tag)}
                      type="button"
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                  {ALL_TAGS.length <= MAX_VISIBLE_TAGS && (
                    <button
                      className="rounded-[8px] px-4 py-2 hover:opacity-90 transition-opacity"
                      style={{
                        background: "#2d5016",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: "24px",
                        minWidth: 79,
                        marginLeft: 8,
                      }}
                      onClick={handleReset}
                      type="button"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-4 mt-2">
                <span
                  style={{
                    color: "#666",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: "20px",
                  }}
                >
                  Sort by:
                </span>
                <select
                  value={sortKey}
                  onChange={handleSortChange}
                  className="rounded-[8px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5016]"
                  style={{
                    background: "#d9d9d9",
                    fontSize: 16,
                    color: "#000",
                    minWidth: 185,
                    minHeight: 38,
                    border: "none",
                  }}
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
                <span
                  className="ml-auto"
                  style={{
                    color: "#666",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: "20px",
                  }}
                >
                  Showing {paged.length} of {filtered.length} products
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
                "0 2px 8px 0 rgba(0,0,0,0.04), 0 1.5px 4px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.04), 0 0.5px 1px 0 rgba(0,0,0,0.04), 0 0.25px 0.5px 0 rgba(0,0,0,0.04)",
              padding: 24,
              marginBottom: 32,
            }}
          >
            <div className="flex items-center gap-6">
              <img
                src={recommended.image}
                alt={recommended.name}
                style={{
                  width: 120,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 12,
                  marginRight: 24,
                }}
              />
              <div>
                <div
                  style={{
                    color: "#2d5016",
                    fontWeight: 700,
                    fontSize: 18,
                    lineHeight: "28px",
                  }}
                >
                  Recommended for you (click to filter)
                </div>
                <div
                  style={{
                    color: "#666",
                    fontWeight: 400,
                    fontSize: 16,
                    lineHeight: "24px",
                  }}
                >
                  {recommended.name} – {recommended.description}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Product List */}
        <section className="w-full max-w-5xl">
          {loading ? (
            <div className="text-center text-lg text-[#2d5016] py-12">
              Loading products...
            </div>
          ) : error ? (
            <div className="text-center text-lg text-red-500 py-12">
              Error loading products. Please try again.
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center text-lg text-[#2d5016] py-12">
              No products found.
            </div>
          ) : (
            paged.map((product) => (
              <FlowerCard
                key={product.id}
                product={product}
                isHighlighted={product.id === highlightedProductId}
                onAddToCart={() => (
                  add({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    qty: 1,
                    image: product.image,
                    description: product.description,
                    tags: product.tags,
                  })
                )}
                onNavigateToDetail={() => handleNavigateToProduct(product)}
              />
            ))
          )}
        </section>

        {/* Pagination */}
        {!loading && !error && filtered.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
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
          <span
            style={{
              color: "#fff",
              fontWeight: 400,
              fontSize: 18,
              lineHeight: "28px",
              textAlign: "center",
            }}
          >
            © 2024 Flowo. All rights reserved.
          </span>
        </footer>
      </div>
    </main>
  );
}
