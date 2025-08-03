import Button from "@/components/ui/Button";

interface FlowerCardProps {
  flower: {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    image: string;
    tags: string[];
  };
  onAddToCart: () => void;
  onViewDetails: () => void;
}

export default function FlowerCard({ flower, onAddToCart, onViewDetails }: FlowerCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
      <div className="w-full h-48 sm:h-56 md:h-64 overflow-hidden cursor-pointer" onClick={onViewDetails}>
        <img
          src={flower.image}
          alt={flower.name}
          className="w-full h-full object-fill hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-4 md:p-6 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-green-800 mb-2">{flower.name}</h3>
          <p className="text-slate-600 text-sm md:text-base leading-6 mb-4 line-clamp-2">{flower.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl md:text-2xl font-bold text-green-800">${flower.price.toFixed(2)}</span>
          <Button
            onClick={onAddToCart}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 md:px-6 py-2 text-xs md:text-sm"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
