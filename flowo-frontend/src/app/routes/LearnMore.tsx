import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import InfoCard from "@/components/learn-more/InfoCard";

export default function LearnMore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(to bottom, #F8FDF4, #E8F5D8)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-green-800 mb-6">
            Learn More About Flowo
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Discover the passion, craftsmanship, and dedication behind every beautiful arrangement we create for life's most precious moments.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Flower Market Image */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d33f21a9-ff39-492c-b065-60fa676fd93a"
              alt="Vibrant flower market with colorful blooms"
              className="w-full h-80 object-cover"
            />
            
            {/* Our Story Section */}
            <div className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-8">Our Story</h2>
              
              <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
                <p>
                  Founded in 2003 by Maria and James Thompson, Flowo began as a small neighborhood flower shop with a simple mission: to bring the beauty and joy of fresh flowers to every corner of our community.
                </p>
                
                <p>
                  What started as a passion project in a modest storefront has grown into a beloved local institution. Over the past 20 years, we've had the privilege of being part of countless special moments - from intimate proposals to grand weddings, from celebrating new life to honoring cherished memories.
                </p>
                
                <p>
                  Our commitment to excellence and personal service has remained unchanged. Every arrangement that leaves our shop carries with it the same love and attention to detail that Maria and James put into their very first bouquet.
                </p>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16 justify-items-center">
            <InfoCard
              icon="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9c362d4b-6530-4f69-868c-663e4faa1487"
              title="20+ Years"
              description="Of dedicated service to our community"
            />
            <InfoCard
              icon="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/63733994-4139-48c6-a542-fbc211ffdfb0"
              title="10,000+"
              description="Happy customers and counting"
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(to bottom, #F8FDF4, #E8F5D8)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-800 mb-6">
            Ready to Experience the Flowo Difference?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-slate-600 leading-relaxed mb-8 max-w-3xl mx-auto">
            Visit our shop or browse our collection online to discover the perfect flowers for your special moment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/shop")}>
              Shop Now
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 py-8 md:py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-white text-sm md:text-base lg:text-lg">
              © 2024 Flowo. All rights reserved. | Bringing beauty to life, one flower at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}