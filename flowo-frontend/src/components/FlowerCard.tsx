import React from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  base_price?: number;
  effective_price?: number;
  slug: string;
  tags?: string[];
}

interface FlowerCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const FlowerCard: React.FC<FlowerCardProps> = ({
  product,
  onAddToCart,
  onViewDetails
}) => {
  const currentPrice = product.effective_price ?? product.price;
  const basePrice = product.base_price;
  const hasDiscount = basePrice && currentPrice < basePrice;

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`View details for ${product.name}`}
    >
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-64 object-cover"
          loading="lazy"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
            Sale
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-[#2d5016] mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-[#666666] text-base leading-6 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#2d5016]">
              ${currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-500 line-through">
                ${basePrice!.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="bg-[#e91e63] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#c2185b] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#e91e63] focus:ring-offset-2"
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
