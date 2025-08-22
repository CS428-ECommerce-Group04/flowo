import React from 'react';

interface FlowerCardProps {
  image: string;
  name: string;
  description: string;
  price: string;
  onAddToCart: () => void;
}

export const FlowerCard: React.FC<FlowerCardProps> = ({
  image,
  name,
  description,
  price,
  onAddToCart
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <img 
        src={image} 
        alt={name}
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-bold text-[#2d5016] mb-2">{name}</h3>
        <p className="text-[#666666] text-base leading-6 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[#2d5016]">{price}</span>
          <button
            onClick={onAddToCart}
            className="bg-[#e91e63] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#c2185b] transition-colors duration-200"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
