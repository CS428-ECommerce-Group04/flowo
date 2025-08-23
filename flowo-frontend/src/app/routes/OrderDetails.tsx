import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TimelineStep from '@/components/order-tracking/TimelineStep';
import OrderItem from '@/components/order-tracking/OrderItem';
import InfoCard from '@/components/order-tracking/InfoCard';
import ActionButton from '@/components/order-tracking/ActionButton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { resolveProductImage } from '@/data/productImages';

// API response types
interface ApiOrderItem {
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product_name?: string; // May be included in response
}

interface ApiOrderResponse {
  order_id: string;
  status: string;
  order_date: string;
  total_amount: number;
  shipping_method?: string;
  items: ApiOrderItem[];
  customer_name?: string;
  shipping_address?: string;
  phone?: string;
}

interface ApiProductResponse {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  primaryImageUrl?: string;
  slug?: string;
}

// UI types
interface OrderItemUI {
  id: string;
  name: string;
  image: string;
  tags: string[];
  quantity: number;
  price: number;
  loading: boolean;
  error: boolean;
}

const API_BASE = 'http://localhost:8081/api/v1';

// Function to create slug from name or id (for image resolution)
function createSlug(name: string, id: string): string {
  if (name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  return id;
}

// Function to fetch product details by ID
async function fetchProductDetails(productId: string): Promise<ApiProductResponse> {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product details (${response.status})`);
    }

    const data = await response.json();
    return data.data || data; // Handle both envelope and direct response formats
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
}

// Function to normalize order status for timeline
function normalizeOrderStatus(apiStatus: string): string {
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
      return 'processing';
  }
}

// Function to get status display name
function getStatusDisplayName(status: string): string {
  switch (status) {
    case 'processing':
      return 'Processing';
    case 'awaiting-payment':
      return 'Awaiting Payment';
    case 'payment-failed':
      return 'Payment Failed';
    case 'out-for-delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return 'Processing';
  }
}

// Function to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'processing':
      return '#ffc107';
    case 'awaiting-payment':
      return '#ff9800';
    case 'payment-failed':
      return '#f44336';
    case 'out-for-delivery':
      return '#2196f3';
    case 'delivered':
      return '#4caf50';
    case 'cancelled':
      return '#9e9e9e';
    case 'refunded':
      return '#607d8b';
    default:
      return '#ffc107';
  }
}

// Function to resolve product name from product_id
function resolveProductName(productId: string, apiItem?: ApiOrderItem): string {
  // If API provides product name, use it
  if (apiItem?.product_name) {
    return apiItem.product_name;
  }

  // Fallback mapping for common product IDs (you can expand this)
  const productNameMap: Record<string, string> = {
    '1': 'Mixed Bouquet',
    '2': 'Pink Roses',
    '3': 'White Lilies',
    '4': 'Sunflower Arrangement',
    '5': 'Red Roses',
    '6': 'Tulip Bouquet',
    '7': 'Orchid Collection',
    '8': 'Daisy Arrangement',
  };

  return productNameMap[productId] || `Product ${productId}`;
}

// Generate timeline based on order status
function generateTimeline(status: string, orderDate: string) {
  const baseTimeline = [
    {
      icon: '✓',
      title: 'Order Placed',
      date: new Date(orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      description: 'Your order has been successfully placed and payment confirmed',
      isCompleted: true
    }
  ];

  const normalizedStatus = normalizeOrderStatus(status);

  if (['processing', 'out-for-delivery', 'delivered'].includes(normalizedStatus)) {
    baseTimeline.push({
      icon: '✓',
      title: 'Order Confirmed',
      date: 'Processing...',
      description: 'We have received your order and are preparing your beautiful flowers',
      isCompleted: true
    });
  }

  if (['out-for-delivery', 'delivered'].includes(normalizedStatus)) {
    baseTimeline.push({
      icon: normalizedStatus === 'out-for-delivery' ? '🚚' : '✓',
      title: 'Out for Delivery',
      date: 'In transit...',
      description: 'Your order is on its way! Our delivery partner will contact you shortly',
      isCompleted: true,
      isActive: normalizedStatus === 'out-for-delivery',
      liveUpdate: normalizedStatus === 'out-for-delivery' ? {
        message: 'Your delivery is currently on the way to the destination'
      } : undefined
    });
  }

  if (normalizedStatus === 'delivered') {
    baseTimeline.push({
      icon: '🏠',
      title: 'Delivered',
      date: 'Completed',
      description: 'Your beautiful flowers have been delivered successfully',
      isCompleted: true
    });
  }

  return baseTimeline;
}

// Component for individual status step box
function StatusStepBox({ 
  icon, 
  title, 
  date, 
  description, 
  isCompleted, 
  isActive = false,
  liveUpdate 
}: {
  icon: string;
  title: string;
  date: string;
  description: string;
  isCompleted: boolean;
  isActive?: boolean;
  liveUpdate?: { message: string };
}) {
  return (
    <div
      className={`rounded-xl border-2 p-6 transition-all duration-200 ${ 
        isCompleted 
          ? 'border-green-500 bg-green-50' 
          : 'border-gray-200 bg-gray-50'
      } ${isActive ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${ 
            isCompleted ? 'bg-green-500' : 'bg-gray-400'
          }`}
        >
          {isCompleted ? (icon === '🚚' || icon === '🏠' ? icon : '✓') : icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3
              className="font-bold"
              style={{ 
                color: isCompleted ? '#2d5016' : '#999999',
                fontSize: '18px',
                lineHeight: '28px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {title}
            </h3>
            <span
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{ 
                color: isCompleted ? '#2d5016' : '#999999',
                backgroundColor: isCompleted ? '#e8f5d8' : '#f3f4f6',
                fontSize: '12px',
                lineHeight: '16px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {date}
            </span>
          </div>
          
          <p
            className="mb-3"
            style={{ 
              color: isCompleted ? '#666666' : '#999999',
              fontSize: '14px',
              lineHeight: '20px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {description}
          </p>

          {/* Live Update */}
          {liveUpdate && isActive && (
            <div
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: '#e3f2fd',
                borderColor: '#2196f3'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: '#2196f3' }}
                />
                <span
                  className="font-medium"
                  style={{ 
                    color: '#2196f3',
                    fontSize: '12px',
                    lineHeight: '16px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Live Update
                </span>
              </div>
              <p
                style={{ 
                  color: '#1976d2',
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {liveUpdate.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced OrderItem component with loading state
function EnhancedOrderItem({ 
  id, 
  name, 
  image, 
  quantity, 
  price, 
  loading, 
  error 
}: { 
  id: string; 
  name: string; 
  image: string; 
  quantity: number; 
  price: number;
  loading: boolean;
  error: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-200">
      {/* Image with loading state */}
      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent border-green-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback for failed image loads
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Product';
            }}
          />
        )}
      </div>

      {/* Product details */}
      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            {loading ? (
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
            ) : error ? (
              <div className="text-sm font-medium text-red-500">Product {id} (Error loading details)</div>
            ) : (
              <div className="text-sm font-medium text-slate-800">{name}</div>
            )}
            <div className="text-xs text-slate-500 mt-1">Quantity: {quantity}</div>
          </div>
          <div className="text-sm font-semibold text-slate-800">${(price * quantity).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [orderData, setOrderData] = useState<ApiOrderResponse | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError('Please log in to view order details');
      setLoading(false);
      return;
    }

    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          let errorMessage = 'Failed to fetch order details';
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            switch (response.status) {
              case 400:
                errorMessage = 'Invalid order ID. Please check and try again.';
                break;
              case 401:
                errorMessage = 'Authentication failed. Please log in again.';
                break;
              case 403:
                errorMessage = 'You do not have permission to view this order.';
                break;
              case 404:
                errorMessage = 'Order not found. Please check the order ID.';
                break;
              case 500:
                errorMessage = 'Server error. Please try again later.';
                break;
              default:
                errorMessage = `Failed to fetch order details (${response.status})`;
            }
          }
          
          throw new Error(errorMessage);
        }

        const data: ApiOrderResponse = await response.json();
        setOrderData(data);

        // Initialize order items with loading state
        const initialItems = data.items.map(item => ({
          id: item.product_id,
          name: `Product ${item.product_id}`, // Temporary name while loading
          image: 'https://via.placeholder.com/64?text=Loading',
          tags: [],
          quantity: item.quantity,
          price: item.price,
          loading: true,
          error: false
        }));

        setOrderItems(initialItems);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, user, authLoading]);

  // Fetch product details for each item
  useEffect(() => {
    if (!orderData || !orderData.items.length) return;

    const fetchProductsData = async () => {
      const updatedItems = [...orderItems];

      // Fetch products in parallel
      const fetchPromises = orderData.items.map(async (item, index) => {
        try {
          const productData = await fetchProductDetails(item.product_id);
          
          // Resolve image using the same system as OrderCard
          const slug = productData.slug || createSlug(productData.name, item.product_id);
          const imageFromApi = productData.image_url || productData.primaryImageUrl;
          const resolvedImage = imageFromApi || resolveProductImage(productData.name, slug);

          updatedItems[index] = {
            ...updatedItems[index],
            name: productData.name,
            image: resolvedImage,
            loading: false,
            error: false
          };

          // Update state after each successful fetch
          setOrderItems([...updatedItems]);
        } catch (err) {
          console.error(`Error fetching product ${item.product_id}:`, err);
          
          // Mark this item as having an error
          updatedItems[index] = {
            ...updatedItems[index],
            loading: false,
            error: true
          };

          // Update state after each error
          setOrderItems([...updatedItems]);
        }
      });

      // Wait for all fetches to complete
      await Promise.allSettled(fetchPromises);
    };

    fetchProductsData();
  }, [orderData]);

  // Event handlers
  const handleCallCustomer = () => {
    if (orderData?.phone) {
      window.location.href = `tel:${orderData.phone}`;
    }
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-slate-600">Loading order details...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-white p-4">
        <div className="max-w-md w-full rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
          <div className="font-semibold mb-1">Error Loading Order</div>
          <div className="text-sm mb-3">{error}</div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="rounded bg-red-700 text-white px-4 py-2 text-sm"
            >
              ← Back to Orders
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded border border-red-300 px-4 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!orderData) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-slate-600">Order not found</div>
      </div>
    );
  }

  const normalizedStatus = normalizeOrderStatus(orderData.status);
  const statusDisplayName = getStatusDisplayName(normalizedStatus);
  const statusColor = getStatusColor(normalizedStatus);
  const timeline = generateTimeline(orderData.status, orderData.order_date);

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
          <h1
            className="font-bold mb-4"
            style={{ 
              color: '#2d5016',
              fontSize: '36px',
              lineHeight: '40px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Order Tracking
          </h1>
          <p
            className="mb-6"
            style={{ 
              color: '#666666',
              fontSize: '20px',
              lineHeight: '28px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Order ID: {orderId}
          </p>

          {/* Status Box - Prominently displayed */}
          <div
            className="inline-flex items-center px-6 py-4 rounded-xl shadow-lg border-2"
            style={{ 
              backgroundColor: statusColor,
              borderColor: statusColor,
              boxShadow: `0 4px 20px ${statusColor}40, 0 2px 8px rgba(0,0,0,0.1)`
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full animate-pulse"
                style={{ 
                  backgroundColor: '#ffffff',
                  opacity: normalizedStatus === 'out-for-delivery' ? 1 : 0.8
                }}
              />
              <span
                className="font-bold text-white"
                style={{ 
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {statusDisplayName}
              </span>
              {normalizedStatus === 'out-for-delivery' && (
                <span
                  className="text-white text-sm font-medium"
                  style={{ 
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontFamily: 'Inter, sans-serif',
                    opacity: 0.9
                  }}
                >
                  • Live Tracking Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8">
          {/* Left Section - Status Steps and Items */}
          <div className="lg:col-span-3 space-y-8">
            {/* Delivery Status Steps - Updated to box layout */}
            <InfoCard title="Delivery Status">
              <div className="space-y-4">
                {timeline.map((step, index) => (
                  <StatusStepBox
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

            {/* Order Items - Updated to use fetched product data */}
            <InfoCard title="Order Items">
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <EnhancedOrderItem
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    image={item.image}
                    quantity={item.quantity}
                    price={item.price}
                    loading={item.loading}
                    error={item.error}
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
                    ${orderData.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Right Section - Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Status Summary Card */}
            <InfoCard title="Order Status">
              <div className="space-y-4">
                <div
                  className="p-4 rounded-lg border-l-4"
                  style={{ 
                    backgroundColor: `${statusColor}15`,
                    borderLeftColor: statusColor
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColor }}
                    />
                    <span
                      className="font-semibold"
                      style={{ 
                        color: statusColor,
                        fontSize: '16px',
                        lineHeight: '24px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {statusDisplayName}
                    </span>
                  </div>
                  <p
                    className="text-sm"
                    style={{ 
                      color: '#666666',
                      fontSize: '14px',
                      lineHeight: '20px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {normalizedStatus === 'processing' && 'Your order is being prepared with care.'}
                    {normalizedStatus === 'awaiting-payment' && 'Waiting for payment confirmation.'}
                    {normalizedStatus === 'payment-failed' && 'Payment could not be processed.'}
                    {normalizedStatus === 'out-for-delivery' && 'Your flowers are on their way to you!'}
                    {normalizedStatus === 'delivered' && 'Your order has been successfully delivered.'}
                    {normalizedStatus === 'cancelled' && 'This order has been cancelled.'}
                    {normalizedStatus === 'refunded' && 'Refund has been processed for this order.'}
                  </p>
                </div>
              </div>
            </InfoCard>

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
                    Shipping Method
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
                    {orderData.shipping_method || 'Standard Delivery'}
                  </p>
                </div>

                {orderData.shipping_address && (
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
                      {orderData.shipping_address}
                    </p>
                  </div>
                )}

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
                    {orderData.customer_name || `${user.firstName} ${user.lastName}`.trim() || user.email || 'Customer'}
                  </p>
                </div>

                {orderData.phone && (
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
                        {orderData.phone}
                      </span>
                      <button
                        onClick={handleCallCustomer}
                        className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-sm px-1"
                        style={{ 
                          fontSize: '14px',
                          lineHeight: '20px',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        Call
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Quick Actions */}
            <InfoCard title="Quick Actions">
              <div className="space-y-3">
                <ActionButton variant="primary" onClick={handleTrackOnMap}>
                  Track on Map
                </ActionButton>
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
