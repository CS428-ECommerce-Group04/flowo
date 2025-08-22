import React from 'react';

interface ItemIconsProps {
  items: string[];
}

export default function ItemIcons({ items }: ItemIconsProps) {
  return (
    <div className="flex gap-1">
      {items.map((imageUrl, index) => (
        <img
          key={index}
          src={imageUrl}
          alt={`Item ${index + 1}`}
          className="rounded-full border-2 border-white"
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'cover'
          }}
        />
      ))}
    </div>
  );
}
