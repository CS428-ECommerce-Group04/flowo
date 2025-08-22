import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ItemIcons from './ItemIcons';

type StatusType = 'processing' | 'out-for-delivery' | 'delivered';

interface OrderCardProps {
  orderId: string;
  status: StatusType;
  customerName: string;
  items: string[];
  total: number;
  orderDate: string;
  onTrackOrder: (orderId: string) => void;
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
      className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      style={{
        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
        width: '315px',
        height: '334px'
      }}
      onClick={handleCardClick}
    >
      {/* Header with Order ID and Status */}
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
          {orderId}
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

      {/* Items */}
      <div className="mb-4">
        <p
          className="text-sm mb-2"
          style={{
            color: '#666666',
            fontSize: '14px',
            lineHeight: '20px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Items
        </p>
        <ItemIcons items={items} />
      </div>

      {/* Total and Order Date */}
      <div className="flex justify-between items-start mb-6">
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

      {/* Track Button */}
      <button
        onClick={handleTrackClick}
        className="w-full py-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors duration-200"
        style={{
          height: '40px',
          borderColor: '#e5e5e5'
        }}
      >
        <span
          style={{
            color: '#2d5016',
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Click to track this order
        </span>
      </button>
    </div>
  );
}
