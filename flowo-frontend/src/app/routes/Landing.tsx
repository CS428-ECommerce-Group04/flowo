import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Carousel from "@/components/ui/Carousel";
import { useCart } from "@/store/cart";

// Reusable components
import FlowerCard from "@/components/landing/FlowerCard";
import ContactItem from "@/components/landing/ContactItem";
import FeatureItem from "@/components/landing/FeatureItem";
import ContactForm from "@/components/landing/ContactForm";


type UIFlower = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
};


type ApiResponse<T> = { message?: string; data: T };

type ApiProduct = {
  id?: number;
  product_id?: number;
  name: string;
  description?: string;
  base_price?: number;
  effective_price?: number;   // ⬅️ add this
  price?: number;
  image_url?: string;
  primaryImageUrl?: string;
  status?: string;
  flower_type?: string;
  slug?: string;
  tags?: string[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

export default function Landing() {
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  const [flowers, setFlowers] = useState<UIFlower[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

 // replace your entire useEffect with this
// replace your entire useEffect with this
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = `${API_BASE}/products`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });

        // Read once, then parse – avoids "body stream already read"
        const raw = await res.text();
        if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

        let parsed: ApiResponse<ApiProduct[]> | ApiProduct[];
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error("Invalid JSON from /products");
        }

        // SUPPORT BOTH: array OR { data: array }
        const list: ApiProduct[] = Array.isArray(parsed)
          ? parsed
          : (parsed as ApiResponse<ApiProduct[]>).data ?? [];

        console.log("[products] count:", list.length);
        if (!alive) return;

        const mapped: UIFlower[] = list.map((p) => {
          const id = String(p.id ?? p.product_id ?? "");
          const slug =
            p.slug ??
            (p.name
              ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
              : id);
          // prefer effective_price, then price, then base_price
          const price = Number(p.effective_price ?? p.price ?? p.base_price ?? 0);
          const image = p.image_url ?? p.primaryImageUrl ?? "/images/placeholder.png";
          const tags = Array.isArray(p.tags)
            ? p.tags
            : [p.flower_type, p.status].filter(Boolean) as string[];

          return {
            id,
            slug,
            name: p.name,
            description: p.description ?? "",
            price,
            image,
            tags,
          };
        });

        setFlowers(mapped);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load products");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);


  const handleAddToCart = (flower: UIFlower) => {
    add({
      id: flower.id,
      name: flower.name,
      price: flower.price,
      qty: 1,
      image: flower.image,
      description: flower.description,
      tags: flower.tags,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section
        className="py-12 md:py-20 bg-slate-50 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(to bottom, #F8FDF4, #E8F5D8)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-green-800 leading-tight mb-4 md:mb-6">
                Fresh Flowers for Every Occasion
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-slate-600 leading-relaxed mb-6 md:mb-8">
                Discover our beautiful collection of handpicked flowers, perfect for weddings, birthdays, anniversaries, and everyday moments that matter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => navigate("/shop")}>Shop Now</Button>
                <Button variant="outline" onClick={() => navigate("/learn-more")}>
                  Learn More
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src="images/landingflowo.png"
                  alt="Beautiful flower bouquet"
                  className="w-full h-full object-fill"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Flowers */}
      <section className="py-12 md:py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-800 mb-4">
              Featured Flowers
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto">
              Handpicked fresh flowers delivered daily to ensure the highest quality for our customers
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : err ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
                Failed to load products: {err}
              </div>
            ) : flowers.length === 0 ? (
              <div className="text-center text-slate-500">No products available.</div>
            ) : (
              <Carousel itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }} autoPlay autoPlayInterval={4000}>
                {flowers.map((flower) => (
                  <FlowerCard
                    key={flower.id}
                    flower={flower}
                    onAddToCart={() => handleAddToCart(flower)}
                    onViewDetails={() => navigate(`/products/${flower.slug}`)}
                  />
                ))}
              </Carousel>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        className="py-12 md:py-20 bg-slate-50 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(to bottom, #F8FDF4, #E8F5D8)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
            <div>
              <div className="w-full h-64 sm:h-80 lg:h-96 xl:h-[500px] overflow-hidden rounded-2xl shadow-lg">
                <img
                  src="images/landingshop.png"
                  alt="Bloom & Blossom flower shop"
                  className="w-full h-full object-fill"
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-800 mb-4 md:mb-6">
                About Bloom & Blossom
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed mb-4 md:mb-6">
                For over 20 years, we have been creating beautiful floral arrangements that bring joy and beauty to life's most important moments. Our passionate team of florists carefully selects each flower to ensure freshness and quality.
              </p>
              <p className="text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed">
                From intimate bouquets to grand wedding arrangements, we take pride in our craftsmanship and attention to detail. Every arrangement tells a story and expresses emotions that words cannot capture.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureItem icon="🌸" title="Fresh Quality" description="Daily fresh deliveries" />
            <FeatureItem icon="🎨" title="Custom Design" description="Personalized arrangements" />
            <FeatureItem icon="👨‍🌾" title="Expert Care" description="Professional florists" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 md:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-800 mb-4">
              Get In Touch
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto">
              Visit our shop or contact us for custom arrangements and special orders
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-green-800 mb-6 md:mb-8">
                Contact Information
              </h3>
              <ContactItem icon="📍" title="Address" details={["123 Garden Street", "Flower District, FD 12345"]} />
              <ContactItem icon="📞" title="Phone" details={["(555) 123-4567"]} />
              <ContactItem icon="✉️" title="Email" details={["hello@bloomandblossom.com"]} />
              <ContactItem icon="🕒" title="Hours" details={["Mon-Sat: 9AM-7PM", "Sunday: 10AM-5PM"]} />
            </div>

            <div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-green-800 mb-6 md:mb-8">
                Send us a Message
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 py-8 md:py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-white text-sm md:text-base lg:text-lg">© Flowo 2025. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
