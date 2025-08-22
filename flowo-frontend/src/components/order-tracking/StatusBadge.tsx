import React from 'react';

type StatusType = 'processing' | 'out-for-delivery' | 'delivered';

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig = {
  'processing': {
    label: 'Processing',
    backgroundColor: '#ffc107',
    textColor: '#ffffff'
  },
  'out-for-delivery': {
    label: 'Out for Delivery',
    backgroundColor: '#2196f3',
    textColor: '#ffffff'
  },
  'delivered': {
    label: 'Delivered',
    backgroundColor: '#4caf50',
    textColor: '#ffffff'
  }
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full"
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '16px',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {config.label}
    </span>
  );
}
