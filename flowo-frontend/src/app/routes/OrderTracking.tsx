import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import OrderCard from '@/components/order-tracking/OrderCard';

// Mock data for orders
const mockOrders = [
  {
    orderId: 'ORD-2024-001',
    status: 'out-for-delivery' as const,
    customerName: 'Sarah Johnson',
    items: [
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/8b756a1d-7b24-4e7b-8fc0-b7578e1a866c',
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/df98f9d2-392b-4860-9ac6-51ddf81b64dc'
    ],
    total: 85.00,
    orderDate: 'January 15, 2024'
  },
  {
    orderId: 'ORD-2024-002',
    status: 'processing' as const,
    customerName: 'Michael Chen',
    items: [
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/666f5e36-f3ce-4731-9191-c012071198c0',
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eb172ed8-4073-48ce-8c45-724a8a53b755'
    ],
    total: 50.00,
    orderDate: 'January 16, 2024'
  },
  {
    orderId: 'ORD-2024-003',
    status: 'delivered' as const,
    customerName: 'Emily Rodriguez',
    items: [
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7d2e6dfc-f182-455c-9a26-eda51e2c20ec',
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/4f4a85b9-e7cb-4fa6-b4de-be819ff4c5c7'
    ],
    total: 76.00,
    orderDate: 'January 12, 2024'
  },
  {
    orderId: 'ORD-2024-004',
    status: 'out-for-delivery' as const,
    customerName: 'David Wilson',
    items: [
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f141673b-2688-4cc6-a8a8-48a830a091d6',
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/967ba690-3b2a-414b-a1f5-82bfdd41e4b7'
    ],
    total: 157.00,
    orderDate: 'January 14, 2024'
  },
  {
    orderId: 'ORD-2024-005',
    status: 'processing' as const,
    customerName: 'Lisa Thompson',
    items: [
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eba67259-aded-4ae6-9b0c-5df0fbcfb23e'
    ],
    total: 65.00,
    orderDate: 'January 16, 2024'
  },
  {
    orderId: 'ORD-2024-006',
    status: 'delivered' as const,
    customerName: 'Robert Kim',
    items: [
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/71562124-bb54-4d08-9dbc-dedd42882d20',
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7491f084-2a3a-4728-84e1-153078b92af8'
    ],
    total: 69.00,
    orderDate: 'January 10, 2024'
  }
];

export default function OrderTracking() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<string | null>(null);

  const handleTrackOrder = () => {
    if (orderIdInput.trim()) {
      setTrackedOrder(orderIdInput.trim());
      // Here you would typically make an API call to track the order
      console.log('Tracking order:', orderIdInput.trim());
    }
  };

  const handleTrackOrderFromCard = (orderId: string) => {
    setOrderIdInput(orderId);
    setTrackedOrder(orderId);
    // Here you would typically navigate to a detailed tracking page or show tracking details
    console.log('Tracking order from card:', orderId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrackOrder();
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#fefefe',
        fontFamily: 'Inter, sans-serif'
      }}
    >

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto py-8">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1
              className="font-bold mb-4"
              style={{
                color: '#2d5016',
                fontSize: '48px',
                lineHeight: '60px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Track Your Order
            </h1>
            <p
              className="max-w-2xl mx-auto"
              style={{
                color: '#666666',
                fontSize: '20px',
                lineHeight: '32px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Enter your order ID below to track the status of your beautiful flower arrangement
            </p>
          </div>

          {/* Search Section */}
          <div
            className="bg-white rounded-2xl p-8 mb-8 mx-auto"
            style={{
              maxWidth: '1056px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1.5px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.04), 0 0.25px 0.5px rgba(0,0,0,0.04)'
            }}
          >
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Order ID (e.g., ORD-2024-001)"
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  style={{
                    fontSize: '18px',
                    lineHeight: '22px',
                    fontFamily: 'Inter, sans-serif',
                    borderColor: '#dddddd',
                    height: '56px'
                  }}
                />
              </div>
              <button
                onClick={handleTrackOrder}
                className="px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: '#2d5016',
                  color: '#ffffff',
                  fontSize: '18px',
                  lineHeight: '28px',
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                  height: '56px',
                  minWidth: '165px'
                }}
              >
                Track Order
              </button>
            </div>
          </div>

          {/* Orders Section */}
          <div
            className="bg-white rounded-2xl p-8"
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1.5px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.04), 0 0.25px 0.5px rgba(0,0,0,0.04)'
            }}
          >
            <h2
              className="font-bold mb-8"
              style={{
                color: '#2d5016',
                fontSize: '24px',
                lineHeight: '32px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Current Orders - Click to Track
            </h2>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {mockOrders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  orderId={order.orderId}
                  status={order.status}
                  customerName={order.customerName}
                  items={order.items}
                  total={order.total}
                  orderDate={order.orderDate}
                  onTrackOrder={handleTrackOrderFromCard}
                />
              ))}
            </div>
          </div>

          {/* Tracked Order Indicator */}
          {trackedOrder && (
            <div
              className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center"
            >
              <p
                style={{
                  color: '#2d5016',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Now tracking order: <strong>{trackedOrder}</strong>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
