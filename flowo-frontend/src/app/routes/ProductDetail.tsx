import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import productsJson from "@/data/products.json";
import type { Product } from "@/types/product";
import { useCart } from "@/store/cart";

const products = productsJson as Product[];

// --- Pattern Components ---
function Badge({ 
  children, 
  variant = "primary" 
}: { 
  children: React.ReactNode; 
  variant?: "primary" | "secondary" | "discount";
}) {
  const styles = {
    primary: {
      background: "#e91e63",
      color: "#ffffff",
      borderRadius: "22369600px",
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 500,
      lineHeight: "16px",
    },
    secondary: {
      background: "#e8f5d8",
      color: "#2d5016",
      borderRadius: "22369600px",
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 400,
      lineHeight: "16px",
    },
    discount: {
      background: "#e91e63",
      color: "#ffffff",
      borderRadius: "4px",
      padding: "4px 9px",
      fontSize: 14,
      fontWeight: 400,
      lineHeight: "20px",
    },
  };

  return (
    <span style={styles[variant]}>
      {children}
    </span>
  );
}

function TagBadge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "light" }) {
  const styles = {
    default: {
      background: "#e8f5d8",
      color: "#2d5016",
    },
    light: {
      background: "#f8fdf4",
      color: "#2d5016",
    },
  };

  return (
    <span
      style={{
        ...styles[variant],
        borderRadius: "22369600px",
        padding: "4px 12px",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "20px",
        display: "inline-flex",
        alignItems: "center",
        marginRight: 8,
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  );
}

function SpecificationItem({ 
  label, 
  value 
}: { 
  label: string; 
  value: string;
}) {
  return (
    <div>
      <div
        style={{ 
          color: "#666666",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "20px",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{ 
          color: "#2d5016",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: "24px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function RatingBar({ 
  stars, 
  count, 
  total 
}: { 
  stars: string; 
  count: number; 
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div
      style={{ 
        display: "grid",
        gridTemplateColumns: "28px 1fr 20px",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <div
        style={{ 
          color: "#666666",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "20px",
        }}
      >
        {stars}★
      </div>
      <div
        style={{ 
          height: 8,
          borderRadius: "22369600px",
          background: "#f0f0f0",
          position: "relative",
        }}
      >
        <div
          style={{ 
            height: 8,
            borderRadius: "22369600px",
            background: "#ffd700",
            width: `${percentage}%`,
          }}
        />
      </div>
      <div
        style={{ 
          color: "#666666",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "20px",
          textAlign: "right",
        }}
      >
        {count}
      </div>
    </div>
  );
}

function QuantitySelector({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (value: number) => void;
}) {
  return (
    <div
      style={{ 
        display: "flex",
        alignItems: "center",
        border: "1px solid #dddddd",
        borderRadius: 8,
        width: 106,
        height: 41,
      }}
    >
      <button
        style={{ 
          width: 35,
          height: 39,
          border: "none",
          background: "transparent",
          color: "#2d5016",
          fontSize: 16,
          fontWeight: 400,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        style={{ 
          width: 36,
          height: 39,
          border: "none",
          borderLeft: "1px solid #dddddd",
          borderRight: "1px solid #dddddd",
          textAlign: "center",
          color: "#2d5016",
          fontSize: 16,
          fontWeight: 600,
          background: "transparent",
          outline: "none",
        }}
      />
      <button
        style={{ 
          width: 35,
          height: 39,
          border: "none",
          background: "transparent",
          color: "#2d5016",
          fontSize: 16,
          fontWeight: 400,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
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
      <div
        style={{ 
          width: "100%",
          minHeight: "100vh",
          background: "#fefefe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{ 
            background: "#ffffff",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{ 
              color: "#2d5016",
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Product not found
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ 
              background: "#2d5016",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const oldPrice = product.compareAtPrice ?? Number((product.price * 1.25).toFixed(2));
  const hasCompare = oldPrice > product.price;
  const discountPct = hasCompare
    ? Math.round(((oldPrice - product.price) / oldPrice) * 100)
    : 0;

  const stockText = product.stock != null ? `${product.stock} bouquets` : "12 bouquets";
  const typeText = product.type ?? "Peonies";
  const conditionText = product.condition ?? "Fresh & New";
  const careText = product.care ?? "Cool water daily";

  const rating = product.rating?.average ?? 4.7;
  const counts = product.rating?.counts ?? { "5": 2, "4": 1, "3": 0 };
  const totalReviews = Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  return (
    <div
      style={{ 
        width: "100%",
        minHeight: "100vh",
        background: "#fefefe",
        fontFamily: "Inter, sans-serif",
        position: "relative",
      }}
    >
      {/* Header */}
      <header
        style={{ 
          width: "100%",
          height: 64,
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{ 
            color: "#2d5016",
            fontSize: 24,
            fontWeight: 700,
            lineHeight: "32px",
          }}
        >
          Flowo
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7e3b4122-fd3b-4b68-adc9-665adccd54aa"
            alt=""
            width={24}
            height={24}
            style={{ opacity: 0.7 }}
          />
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9b863371-ecae-4267-98a7-4b592a292c58"
            alt=""
            width={24}
            height={24}
            style={{ opacity: 0.7 }}
          />
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: "32px", maxWidth: 1273, margin: "0 auto" }}>
        {/* Back to Collection */}
        <Link
          to="/"
          style={{ 
            display: "inline-flex",
            alignItems: "center",
            color: "#2d5016",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: "20px",
            textDecoration: "none",
            marginBottom: 32,
          }}
        >
          ← Back to Collection
        </Link>

        {/* Product Layout */}
        <div
          style={{ 
            display: "grid",
            gridTemplateColumns: "596px 1fr",
            gap: 81,
            marginBottom: 64,
          }}
        >
          {/* Product Image */}
          <div style={{ position: "relative" }}>
            <img
              src={product.image}
              alt={product.name}
              style={{ 
                width: 596,
                height: 384,
                objectFit: "cover",
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            />
            {/* Badges */}
            <div
              style={{ 
                position: "absolute",
                top: 16,
                left: 16,
                display: "flex",
                gap: 8,
              }}
            >
              {product.featured && <Badge variant="primary">Bestseller</Badge>}
              <Badge variant="secondary">New Arrival</Badge>
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Product Name */}
            <h1
              style={{ 
                color: "#2d5016",
                fontSize: 30,
                fontWeight: 700,
                lineHeight: "36px",
                margin: "0 0 16px 0",
              }}
            >
              {product.name}
            </h1>

            {/* Description */}
            <p
              style={{ 
                color: "#666666",
                fontSize: 18,
                fontWeight: 400,
                lineHeight: "29px",
                margin: "0 0 24px 0",
                maxWidth: 595,
              }}
            >
              {product.description}
            </p>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
              {product.tags.map((tag, index) => (
                <TagBadge key={tag} variant={index === 1 ? "light" : "default"}>
                  {tag}
                </TagBadge>
              ))}
            </div>

            {/* Specifications */}
            <div
              style={{ 
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                marginBottom: 32,
              }}
            >
              <SpecificationItem label="Flower Type" value={typeText} />
              <SpecificationItem label="Condition" value={conditionText} />
              <SpecificationItem label="Stock Available" value={stockText} />
              <SpecificationItem label="Care Instructions" value={careText} />
            </div>

            {/* Pricing */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                <span
                  style={{ 
                    color: "#2d5016",
                    fontSize: 36,
                    fontWeight: 700,
                    lineHeight: "40px",
                  }}
                >
                  ${product.price.toFixed(2)}
                </span>
                {hasCompare && (
                  <>
                    <span
                      style={{ 
                        color: "#999999",
                        fontSize: 18,
                        fontWeight: 400,
                        lineHeight: "28px",
                        textDecoration: "line-through",
                      }}
                    >
                      ${oldPrice.toFixed(2)}
                    </span>
                    <Badge variant="discount">{discountPct}% OFF</Badge>
                  </>
                )}
              </div>
              <div
                style={{ 
                  color: "#666666",
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: "20px",
                  marginBottom: 24,
                }}
              >
                Price includes delivery within 24 hours
              </div>
            </div>

            {/* Quantity and Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
              <span
                style={{ 
                  color: "#2d5016",
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: "24px",
                }}
              >
                Quantity:
              </span>
              <QuantitySelector value={qty} onChange={setQty} />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <button
                style={{ 
                  background: "#e91e63",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontSize: 18,
                  fontWeight: 500,
                  lineHeight: "28px",
                  cursor: "pointer",
                  width: 413,
                  height: 52,
                }}
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
              <button
                style={{ 
                  background: "transparent",
                  color: "#2d5016",
                  border: "1px solid #2d5016",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: "24px",
                  cursor: "pointer",
                  width: 167,
                  height: 52,
                }}
              >
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{ 
              borderBottom: "1px solid #dddddd",
              display: "flex",
              gap: 32,
              marginBottom: 24,
            }}
          >
            <button
              style={{ 
                background: "transparent",
                border: "none",
                borderBottom: tab === "reviews" ? "2px solid #2d5016" : "none",
                color: tab === "reviews" ? "#2d5016" : "#666666",
                fontSize: 16,
                fontWeight: 500,
                lineHeight: "24px",
                padding: "0 0 16px 0",
                cursor: "pointer",
              }}
              onClick={() => setTab("reviews")}
            >
              Customer Reviews ({totalReviews})
            </button>
            <button
              style={{ 
                background: "transparent",
                border: "none",
                borderBottom: tab === "care" ? "2px solid #2d5016" : "none",
                color: tab === "care" ? "#2d5016" : "#666666",
                fontSize: 16,
                fontWeight: 500,
                lineHeight: "24px",
                padding: "0 0 16px 0",
                cursor: "pointer",
              }}
              onClick={() => setTab("care")}
            >
              Care Instructions
            </button>
          </div>

          {/* Tab Content */}
          {tab === "reviews" ? (
            <div
              style={{ 
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: 32,
              }}
            >
              <div style={{ display: "flex", alignItems: "end", gap: 16, marginBottom: 24 }}>
                <div
                  style={{ 
                    color: "#2d5016",
                    fontSize: 30,
                    fontWeight: 700,
                    lineHeight: "36px",
                  }}
                >
                  {rating.toFixed(1)}
                </div>
                <div
                  style={{ 
                    color: "#000000",
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: "24px",
                  }}
                >
                  ★
                </div>
                <div
                  style={{ 
                    color: "#666666",
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: "20px",
                  }}
                >
                  Based on {totalReviews} reviews
                </div>
              </div>

              <div>
                <RatingBar stars="5" count={counts["5"] || 0} total={totalReviews} />
                <RatingBar stars="4" count={counts["4"] || 0} total={totalReviews} />
                <RatingBar stars="3" count={counts["3"] || 0} total={totalReviews} />
              </div>
            </div>
          ) : (
            <div
              style={{ 
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: 32,
              }}
            >
              <ul
                style={{ 
                  listStyle: "disc",
                  paddingLeft: 20,
                  margin: 0,
                  color: "#666666",
                  fontSize: 16,
                  lineHeight: "24px",
                }}
              >
                <li style={{ marginBottom: 8 }}>{careText}</li>
                <li style={{ marginBottom: 8 }}>Keep away from direct sunlight and heat sources.</li>
                <li>Trim stems at an angle every two days.</li>
              </ul>
            </div>
          )}

          {/* Review Item */}
          <div
            style={{ 
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              marginBottom: 32,
            }}
          >
            <div
              style={{ 
                color: "#000000",
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "24px",
              }}
            >
              ★
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div
          style={{ 
            background: "#6bb937ff",
            borderRadius: 16,
            padding: 48,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          <h2
            style={{ 
              color: "#000000ff",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: "32px",
              margin: "0 0 16px 0",
            }}
          >
            Need Help Choosing?
          </h2>
          <p
            style={{ 
              color: "#000000",
              fontSize: 16,
              fontWeight: 400,
              lineHeight: "24px",
              margin: "0 0 24px 0",
            }}
          >
            Our flower experts are here to help you find the perfect arrangement
          </p>
          <button
            style={{ 
              background: "#ffffff",
              color: "#6bb937ff",
              border: "none",
              borderRadius: 8,
              padding: "12px 22px",
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "24px",
              cursor: "pointer",
              width: 201,
              height: 48,
            }}
          >
            Contact Our Experts
          </button>
        </div>

        {/* Footer */}
        <div
          style={{ 
            textAlign: "center",
            color: "#666666",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: "20px",
          }}
        >
          © 2025 Flowo. All rights reserved.
        </div>
      </div>
    </div>
  );
}
