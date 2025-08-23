import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import OrderCard from '@/components/order-tracking/OrderCard';
import ErrorMessage from '@/components/ui/ErrorMessage';

// API response type with order items
interface ApiOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

// API response type with all possible status values
interface ApiOrder {
  order_id: string;
  status: 'Processing' | 'AwaitingPayment' | 'PaymentFailed' | 'Delivering' | 'Completed' | 'Cancelled' | 'Refunded' | 'COMPLETED' | 'CANCELLED' | string;
  order_date: string;
  total_amount: number;
  shipping_method?: string;
  items?: ApiOrderItem[]; // Order items from API
  order_items?: ApiOrderItem[]; // Alternative field name
}

// UI order type for OrderCard component - extended with new statuses
interface UIOrder {
  orderId: string;
  status: 'processing' | 'awaiting-payment' | 'payment-failed' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refunded';
  customerName: string;
  items: string[];
  total: number;
  orderDate: string;
}

const API_BASE = 'http://localhost:8081/api/v1';

// Hash function to convert numeric ID to unique string (same as in OrderCard)
function hashOrderId(orderId: string): string {
  // Extract numeric part if the ID contains non-numeric characters
  const numericId = orderId;
  
  if (!numericId) {
    // If no numeric part found, use the original string
    return orderId;
  }
  
  const id = parseInt(numericId, 10);
  
  // Simple hash function that creates a consistent string from numeric ID
  let hash = 0;
  const str = id.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and create alphanumeric string
  const positiveHash = Math.abs(hash);
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'hash';
  
  let temp = positiveHash;
  for (let i = 0; i < 8; i++) {
    result += chars[temp % chars.length];
    temp = Math.floor(temp / chars.length);
  }
  
  return result;
}

// Function to normalize and map API status to UI status
function normalizeOrderStatus(apiStatus: string): UIOrder['status'] {
  const normalizedStatus = apiStatus.toLowerCase().trim();
  
  switch (normalizedStatus) {
    case 'processing':
      return 'processing';
    case 'awaitingpayment':
    case 'awaiting_payment':
    case 'awaiting-payment':
      return 'awaiting-payment';
    case 'paymentfailed':
    case 'payment_failed':
    case 'payment-failed':
      return 'payment-failed';
    case 'delivering':
    case 'out-for-delivery':
    case 'out_for_delivery':
      return 'out-for-delivery';
    case 'completed':
    case 'delivered':
      return 'delivered';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    default:
      // Fallback for unknown statuses
      console.warn(`Unknown order status: ${apiStatus}, defaulting to 'processing'`);
      return 'processing';
  }
}

// Function to extract product names from order items
function extractProductNames(order: ApiOrder): string[] {
  const orderItems = order.items || order.order_items || [];
  
  if (orderItems.length === 0) {
    // Fallback to placeholder images if no items provided
    return [
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/8b756a1d-7b24-4e7b-8fc0-b7578e1a866c',
      'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/df98f9d2-392b-4860-9ac6-51ddf81b64dc'
    ];
  }
  
  // Extract product names from order items
  return orderItems.map(item => {
    const productName = item.product_name || `Product ${item.product_id}`;
    // Include quantity if more than 1
    return item.quantity > 1 ? `${productName} (${item.quantity})` : productName;
  });
}

export default function OrderTracking() {
  const { user, isLoading: authLoading } = useAuth();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check if user is authenticated
    if (!user) {
      setError('Please log in to view your orders');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Make API call using cookie-based authentication
        const response = await fetch(`${API_BASE}/orders`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies for authentication
        });

        if (!response.ok) {
          // Handle different error status codes
          switch (response.status) {
            case 400:
              throw new Error('Invalid request. Please try again.');
            case 401:
              throw new Error('Authentication failed. Please log in again.');
            case 500:
              throw new Error('Server error. Please try again later.');
            default:
              throw new Error(`Failed to fetch orders (${response.status})`);
          }
        }

        const apiOrders: ApiOrder[] = await response.json();

        // Map API response to UI format with normalized status and dynamic product names
        const uiOrders: UIOrder[] = apiOrders.map((order) => ({
          orderId: order.order_id,
          status: normalizeOrderStatus(order.status),
          customerName: `${user.firstName} ${user.lastName}`.trim() || user.email || 'Customer',
          items: extractProductNames(order), // Use actual product names from order data
          total: order.total_amount,
          orderDate: new Date(order.order_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }));

        setOrders(uiOrders);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading]);

  const handleTrackOrder = () => {
    if (orderIdInput.trim()) {
      const hashedId = hashOrderId(orderIdInput.trim());
      setTrackedOrder(hashedId);
      console.log('Tracking order:', hashedId);
    }
  };

  const handleTrackOrderFromCard = (orderId: string) => {
    const hashedId = hashOrderId(orderId);
    setOrderIdInput(hashedId);
    setTrackedOrder(hashedId);
    console.log('Tracking order from card:', hashedId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrackOrder();
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Authentication Required</h2>
          <p className="text-slate-600 mb-4">Please log in to view your orders.</p>
          <a href="/login" className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

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
                  placeholder="Enter Order ID (e.g., hashj2j2jsau)"
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

          {/* Error Message */}
          {error && (
            <ErrorMessage 
              message={error} 
              type="error"
              onClose={() => setError(null)}
            />
          )}

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
              Your Orders - Click to Track
            </h2>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                <p className="mt-2 text-gray-600">Loading your orders...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && orders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No orders found.</p>
                <button
                  onClick={handleRetry}
                  className="text-green-700 hover:underline"
                >
                  Refresh
                </button>
              </div>
            )}

            {/* Orders Grid */}
            {!loading && !error && orders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {orders.map((order) => (
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
            )}

            {/* Retry Button for Errors */}
            {error && (
              <div className="text-center py-4">
                <button
                  onClick={handleRetry}
                  className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
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
