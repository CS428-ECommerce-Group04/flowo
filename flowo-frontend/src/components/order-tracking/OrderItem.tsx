import React from 'react';

interface OrderItemProps {
  image: string;
  name: string;
  tags: string[];
  quantity: number;
  price: number;
}

export default function OrderItem({ image, name, tags, quantity, price }: OrderItemProps) {
  return (
    <div
      className="flex items-center gap-4 p-6 rounded-xl border"
      style={{
        borderColor: '#e5e5e5'
      }}
    >
      {/* Image */}
      <img
        src={image}
        alt={name}
        className="rounded-lg"
        style={{
          width: '80px',
          height: '80px',
          objectFit: 'cover'
        }}
      />

      {/* Details */}
      <div className="flex-1">
        <h3
          className="font-bold mb-2"
          style={{
            color: '#2d5016',
            fontSize: '18px',
            lineHeight: '28px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {name}
        </h3>
        
        <div className="flex gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: '#e8f5d8',
                color: '#2d5016',
                fontSize: '12px',
                lineHeight: '16px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        
        <p
          style={{
            color: '#666666',
            fontSize: '14px',
            lineHeight: '20px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Quantity: {quantity}
        </p>
      </div>

      {/* Price */}
      <div
        className="font-bold"
        style={{
          color: '#2d5016',
          fontSize: '18px',
          lineHeight: '28px',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        ${price.toFixed(2)}
      </div>
    </div>
  );
}
