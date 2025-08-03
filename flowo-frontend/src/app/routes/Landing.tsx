import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Carousel from "@/components/ui/Carousel";
import { useCart } from "@/store/cart";

// Import the reusable components we'll create
import FlowerCard from "@/components/landing/FlowerCard";
import ContactItem from "@/components/landing/ContactItem";
import FeatureItem from "@/components/landing/FeatureItem";
import ContactForm from "@/components/landing/ContactForm";

export default function Landing() {
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  const flowers = [
    {
      id: "red-roses",
      slug: "red-roses",
      name: "Red Roses",
      description: "Classic red roses perfect for romantic occasions and expressing love",
      price: 25.00,
      image: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b73e6924-8bf4-4d27-b230-6b3164b683d4",
      tags: ["romantic", "classic"]
    },
    {
      id: "sunflowers",
      slug: "sunflowers",
      name: "Sunflowers",
      description: "Bright and cheerful sunflowers to bring sunshine to any day",
      price: 20.00,
      image: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/98dd2aef-3f43-41cb-9231-e7bca795525a",
      tags: ["cheerful", "bright"]
    },
    {
      id: "tulips",
      slug: "tulips",
      name: "Tulips",
      description: "Elegant tulips in various colors, perfect for spring celebrations",
      price: 18.00,
      image: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9fcadf4d-b50a-4a20-93d9-2ee06ecd5138",
      tags: ["elegant", "spring"]
    },
    {
      id: "mixed-bouquet",
      slug: "mixed-bouquet",
      name: "Mixed Bouquet",
      description: "Beautiful mixed arrangement with seasonal flowers and greenery",
      price: 35.00,
      image: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7b45bee8-1e9e-45d6-bfac-c27c463e5fda",
      tags: ["mixed", "seasonal"]
    },
    {
      id: "white-lilies",
      slug: "white-lilies",
      name: "White Lilies",
      description: "Pure white lilies symbolizing peace and tranquility",
      price: 30.00,
      image: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c7f60e17-f1a0-4ac4-a8a3-9f72aa779ec2",
      tags: ["pure", "peaceful"]
    },
    {
      id: "pink-peonies",
      slug: "pink-peonies",
      name: "Pink Peonies",
      description: "Luxurious pink peonies for special occasions and celebrations",
      price: 40.00,
      image: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e6ac143e-ec43-4e84-b3cb-83c4f5cfe49d",
      tags: ["luxurious", "celebration"]
    },
  ];

  const handleAddToCart = (flower: typeof flowers[0]) => {
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
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-800 leading-tight mb-4 md:mb-6">
                Fresh Flowers for Every Occasion
              </h1>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-6 md:mb-8">
                Discover our beautiful collection of handpicked flowers, perfect for weddings, birthdays, anniversaries, and everyday moments that matter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => navigate("/shop")}>Shop Now</Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden rounded-2xl shadow-2xl">
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

      {/* Featured Flowers Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">Featured Flowers</h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Handpicked fresh flowers delivered daily to ensure the highest quality for our customers
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            <Carousel
              itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
              autoPlay={true}
              autoPlayInterval={4000}
            >
              {flowers.map((flower) => (
                <FlowerCard
                  key={flower.id}
                  flower={flower}
                  onAddToCart={() => handleAddToCart(flower)}
                  onViewDetails={() => navigate(`/products/${flower.slug}`)}
                />
              ))}
            </Carousel>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 md:py-20 bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
            <div>
              <div className="w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-2xl shadow-lg">
                <img
                  src="images/landingshop.png"
                  alt="Bloom & Blossom flower shop"
                  className="w-full h-full object-fill"
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4 md:mb-6">About Bloom & Blossom</h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-4 md:mb-6">
                For over 20 years, we have been creating beautiful floral arrangements that bring joy and beauty to life's most important moments. Our passionate team of florists carefully selects each flower to ensure freshness and quality.
              </p>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                From intimate bouquets to grand wedding arrangements, we take pride in our craftsmanship and attention to detail. Every arrangement tells a story and expresses emotions that words cannot capture.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureItem
              icon="🌸"
              title="Fresh Quality"
              description="Daily fresh deliveries"
            />
            <FeatureItem
              icon="🎨"
              title="Custom Design"
              description="Personalized arrangements"
            />
            <FeatureItem
              icon="👨‍🌾"
              title="Expert Care"
              description="Professional florists"
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">Get In Touch</h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Visit our shop or contact us for custom arrangements and special orders
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-green-800 mb-6 md:mb-8">Contact Information</h3>
              <ContactItem
                icon="📍"
                title="Address"
                details={["123 Garden Street", "Flower District, FD 12345"]}
              />
              <ContactItem
                icon="📞"
                title="Phone"
                details={["(555) 123-4567"]}
              />
              <ContactItem
                icon="✉️"
                title="Email"
                details={["hello@bloomandblossom.com"]}
              />
              <ContactItem
                icon="🕒"
                title="Hours"
                details={["Mon-Sat: 9AM-7PM", "Sunday: 10AM-5PM"]}
              />
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-bold text-green-800 mb-6 md:mb-8">Send us a Message</h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 py-6 md:py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-white text-sm">
              © Flowo 2025. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
