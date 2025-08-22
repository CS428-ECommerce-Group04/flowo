import React from 'react';

type StatusType = 'processing' | 'awaiting-payment' | 'payment-failed' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refunded';

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig = {
  'processing': {
    label: 'Processing',
    backgroundColor: '#ffc107',
    textColor: '#ffffff'
  },
  'awaiting-payment': {
    label: 'Awaiting Payment',
    backgroundColor: '#ff9800',
    textColor: '#ffffff'
  },
  'payment-failed': {
    label: 'Payment Failed',
    backgroundColor: '#f44336',
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
  },
  'cancelled': {
    label: 'Cancelled',
    backgroundColor: '#9e9e9e',
    textColor: '#ffffff'
  },
  'refunded': {
    label: 'Refunded',
    backgroundColor: '#607d8b',
    textColor: '#ffffff'
  }
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['processing']; // Fallback to processing

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
