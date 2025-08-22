import React from 'react';
import { Link, useParams } from 'react-router-dom';
import TimelineStep from '@/components/order-tracking/TimelineStep';
import OrderItem from '@/components/order-tracking/OrderItem';
import InfoCard from '@/components/order-tracking/InfoCard';
import ActionButton from '@/components/order-tracking/ActionButton';

// Mock data for the order
const mockOrderData = {
  orderId: 'ORD-2024-001',
  status: 'out-for-delivery',
  customer: {
    name: 'Sarah Johnson',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Anytown, ST 12345'
  },
  delivery: {
    estimatedTime: 'Today, 2:00 PM - 6:00 PM',
    driver: {
      name: 'Mike Rodriguez',
      vehicle: 'White Honda Civic - ABC 123',
      avatar: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5db99e59-839d-49ee-b6ea-62fc2f6f5906'
    }
  },
  timeline: [
    {
      icon: '✓',
      title: 'Order Placed',
      date: 'January 15, 2024 - 9:30 AM',
      description: 'Your order has been successfully placed and payment confirmed',
      isCompleted: true
    },
    {
      icon: '✓',
      title: 'Order Confirmed',
      date: 'January 15, 2024 - 9:45 AM',
      description: 'We have received your order and are preparing your beautiful flowers',
      isCompleted: true
    },
    {
      icon: '✓',
      title: 'Preparing Your Order',
      date: 'January 15, 2024 - 11:15 AM',
      description: 'Our florists are carefully arranging your fresh flowers',
      isCompleted: true
    },
    {
      icon: '✓',
      title: 'Quality Check',
      date: 'January 15, 2024 - 1:20 PM',
      description: 'Final quality inspection to ensure perfection',
      isCompleted: true
    },
    {
      icon: '🚚',
      title: 'Out for Delivery',
      date: 'January 15, 2024 - 1:45 PM',
      description: 'Your order is on its way! Our delivery partner will contact you shortly',
      isCompleted: true,
      isActive: true,
      liveUpdate: {
        message: 'Your delivery is currently 15 minutes away from the destination'
      }
    },
    {
      icon: '🏠',
      title: 'Delivered',
      date: 'Estimated: Today, 2:00 PM - 6:00 PM',
      description: 'Your beautiful flowers have been delivered successfully',
      isCompleted: false
    }
  ],
  items: [
    {
      id: 1,
      name: 'Mixed Bouquet',
      image: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/4317b197-b71d-483c-ab29-392b29a130b6',
      tags: ['bouquets', 'anniversary'],
      quantity: 1,
      price: 35.00
    },
    {
      id: 2,
      name: 'Pink Roses',
      image: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/dd150037-d1c7-4144-9ee8-6c923033d27d',
      tags: ['roses', 'mothers-day'],
      quantity: 2,
      price: 25.00
    }
  ],
  total: 85.00
};

export default function OrderDetails() {
  const { orderId } = useParams();

  const handleCallCustomer = () => {
    window.location.href = `tel:${mockOrderData.customer.phone}`;
  };

  const handleCallDriver = () => {
    console.log('Calling driver...');
  };

  const handleTrackOnMap = () => {
    console.log('Opening map tracking...');
  };

  const handleModifyDelivery = () => {
    console.log('Modifying delivery...');
  };

  const handleCancelOrder = () => {
    console.log('Canceling order...');
  };

  const handleContactSupport = () => {
    console.log('Contacting support...');
  };

  const handleLiveChat = () => {
    console.log('Opening live chat...');
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:help@flowo.com';
  };

  const handleCallSupport = () => {
    window.location.href = 'tel:(555)123-3569';
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
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1
              className="font-bold"
              style={{ 
                color: '#2d5016',
                fontSize: '36px',
                lineHeight: '40px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Order Tracking
            </h1>
            <div className="flex items-center gap-2">
              <span
                className="px-4 py-2 rounded-full text-white font-medium"
                style={{ 
                  backgroundColor: '#2196f3',
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Out for Delivery
              </span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#4caf50' }}
              />
            </div>
          </div>
          <p
            style={{ 
              color: '#666666',
              fontSize: '20px',
              lineHeight: '28px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Order ID: {mockOrderData.orderId}
          </p>
        </div>

        {/* Content Grid - Updated to 4 columns with 3:1 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8">
          {/* Left Section - Timeline and Items (3 columns) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Delivery Timeline */}
            <InfoCard title="Delivery Timeline">
              <div className="space-y-0">
                {mockOrderData.timeline.map((step, index) => (
                  <TimelineStep
                    key={index}
                    icon={step.icon}
                    title={step.title}
                    date={step.date}
                    description={step.description}
                    isCompleted={step.isCompleted}
                    isActive={step.isActive}
                    liveUpdate={step.liveUpdate}
                  />
                ))}
              </div>
            </InfoCard>

            {/* Order Items */}
            <InfoCard title="Order Items">
              <div className="space-y-4">
                {mockOrderData.items.map((item) => (
                  <OrderItem
                    key={item.id}
                    image={item.image}
                    name={item.name}
                    tags={item.tags}
                    quantity={item.quantity}
                    price={item.price}
                  />
                ))}
                
                {/* Total */}
                <div
                  className="flex justify-between items-center pt-4 border-t"
                  style={{ borderColor: '#e5e5e5' }}
                >
                  <span
                    className="font-bold"
                    style={{ 
                      color: '#2d5016',
                      fontSize: '20px',
                      lineHeight: '28px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    Total Amount
                  </span>
                  <span
                    className="font-bold"
                    style={{ 
                      color: '#2d5016',
                      fontSize: '24px',
                      lineHeight: '32px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    ${mockOrderData.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Right Section - Info Cards (1 column) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Delivery Information */}
            <InfoCard title="Delivery Information">
              <div className="space-y-4">
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
                    Estimated Delivery
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
                    {mockOrderData.delivery.estimatedTime}
                  </p>
                </div>
                
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
                    Delivery Address
                  </p>
                  <p
                    style={{ 
                      color: '#2d5016',
                      fontSize: '16px',
                      lineHeight: '24px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {mockOrderData.customer.address}
                  </p>
                </div>
                
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
                    {mockOrderData.customer.name}
                  </p>
                </div>
                
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
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      style={{ 
                        color: '#2d5016',
                        fontSize: '16px',
                        lineHeight: '24px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {mockOrderData.customer.phone}
                    </span>
                    <button
                      onClick={handleCallCustomer}
                      className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-sm px-1"
                      style={{ 
                        fontSize: '14px',
                        lineHeight: '20px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      aria-label={`Call customer at ${mockOrderData.customer.phone}`}
                    >
                      Call
                    </button>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Delivery Driver */}
            <InfoCard title="Delivery Driver">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={mockOrderData.delivery.driver.avatar}
                    alt={mockOrderData.delivery.driver.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p
                      className="font-medium"
                      style={{ 
                        color: '#2d5016',
                        fontSize: '16px',
                        lineHeight: '24px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {mockOrderData.delivery.driver.name}
                    </p>
                    <p
                      className="text-sm"
                      style={{ 
                        color: '#666666',
                        fontSize: '14px',
                        lineHeight: '20px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {mockOrderData.delivery.driver.vehicle}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <ActionButton variant="primary" onClick={handleCallDriver}>
                    Call Driver
                  </ActionButton>
                  <ActionButton variant="outlined" onClick={handleTrackOnMap}>
                    Track on Map
                  </ActionButton>
                </div>
              </div>
            </InfoCard>

            {/* Quick Actions */}
            <InfoCard title="Quick Actions">
              <div className="space-y-3">
                <ActionButton variant="pink" onClick={handleModifyDelivery}>
                  Modify Delivery
                </ActionButton>
                <ActionButton variant="pink-outlined" onClick={handleCancelOrder}>
                  Cancel Order
                </ActionButton>
                <ActionButton variant="outlined" onClick={handleContactSupport}>
                  Contact Support
                </ActionButton>
              </div>
            </InfoCard>

            {/* Need Help */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#f8f9fa' }}
            >
              <h3
                className="font-bold mb-4"
                style={{ 
                  color: '#2d5016',
                  fontSize: '18px',
                  lineHeight: '28px',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Need Help?
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleCallSupport}
                  className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm p-1"
                  aria-label="Call support at (555) 123-FLOW"
                >
                  <span style={{ fontSize: '14px' }}>📞</span>
                  <span
                    style={{ 
                      color: '#2d5016',
                      fontSize: '14px',
                      lineHeight: '20px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    Call us: (555) 123-FLOW
                  </span>
                </button>
                
                <button
                  onClick={handleLiveChat}
                  className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm p-1"
                  aria-label="Start live chat support"
                >
                  <span style={{ fontSize: '14px' }}>💬</span>
                  <span
                    style={{ 
                      color: '#2d5016',
                      fontSize: '14px',
                      lineHeight: '20px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    Live Chat Support
                  </span>
                </button>
                
                <button
                  onClick={handleEmailSupport}
                  className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm p-1"
                  aria-label="Email support at help@flowo.com"
                >
                  <span style={{ fontSize: '14px' }}>📧</span>
                  <span
                    style={{ 
                      color: '#2d5016',
                      fontSize: '14px',
                      lineHeight: '20px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    help@flowo.com
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
