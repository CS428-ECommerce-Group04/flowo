import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

type StatusType = 'processing' | 'awaiting-payment' | 'payment-failed' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refunded';

interface OrderCardProps {
  orderId: string;
  status: StatusType;
  customerName: string;
  items: string[];
  total: number;
  orderDate: string;
  onTrackOrder: (orderId: string) => void;
}

// Parse item string to extract name and quantity
function parseItemString(itemString: string): { name: string; quantity: number } {
  // Check if item already has quantity in parentheses (e.g., "Rose Bouquet (2)")
  const match = itemString.match(/^(.+?)\s*\((\d+)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      quantity: parseInt(match[2], 10)
    };
  }

  // If no quantity specified, assume quantity is 1
  return {
    name: itemString.trim(),
    quantity: 1
  };
}

// Component to display product names with quantities
function ProductNames({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        No items
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.slice(0, 3).map((item, index) => {
        const { name, quantity } = parseItemString(item);
        return (
          <div
            key={index}
            className="text-sm font-medium text-slate-700 truncate"
            title={`${name} x ${quantity}`}
          >
            {name.toLowerCase()} x {quantity}
          </div>
        );
      })}
      {items.length > 3 && (
        <div className="text-xs text-slate-500">
          +{items.length - 3} more items
        </div>
      )}
    </div>
  );
}

export default function OrderCard({
  orderId,
  status,
  customerName,
  items,
  total,
  orderDate,
  onTrackOrder
}: OrderCardProps) {
  const navigate = useNavigate();
  const orderDisplayName = `Order ${orderId}`;

  const handleCardClick = () => {
    navigate(`/order-tracking/${orderId}`);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTrackOrder(orderId);
    navigate(`/order-tracking/${orderId}`);
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col"
      style={{
        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
        width: '315px',
        height: '334px'
      }}
      onClick={handleCardClick}
    >
      {/* Content Container - grows to fill available space */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Header with Order Name and Status */}
        <div className="flex items-start justify-between mb-4">
          <h3
            className="font-bold"
            style={{
              color: '#2d5016',
              fontSize: '18px',
              lineHeight: '28px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {orderDisplayName}
          </h3>
          <StatusBadge status={status} />
        </div>

        {/* Customer */}
        <div className="mb-4">
          <p
            className="text-sm mb-1"
            style={{
              color: '#666666',
              fontSize: '14px',
              lineHeight: '20px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Customer
          </p>
          <p
            className="font-medium"
            style={{
              color: '#2d5016',
              fontSize: '16px',
              lineHeight: '24px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {customerName}
          </p>
        </div>

        {/* Total and Order Date - grows to fill remaining space */}
        <div className="flex justify-between items-start flex-1">
          <div>
            <p
              className="text-sm mb-1"
              style={{
                color: '#666666',
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Total
            </p>
            <p
              className="font-bold"
              style={{
                color: '#2d5016',
                fontSize: '18px',
                lineHeight: '28px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              ${total.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-sm mb-1"
              style={{
                color: '#666666',
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Order Date
            </p>
            <p
              className="font-medium"
              style={{
                color: '#2d5016',
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {orderDate}
            </p>
          </div>
        </div>
      </div>

      {/* Track Button - Fixed at bottom */}
      <div className="p-6 pt-0">
        <button
          onClick={handleTrackClick}
          className="w-full py-3 rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-sm"
          style={{
            backgroundColor: '#2d5016',
            color: '#ffffff',
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Track Order
        </button>
      </div>
    </div>
  );
}
