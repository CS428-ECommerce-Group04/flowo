# VNPay Payment API Testing Guide

## Prerequisites

1. Start the backend server:
```bash
cd flowo-backend
go run cmd/main.go
```

2. Ensure you have a test user and test orders in the database.

## API Testing Scenarios

### 1. Create VNPay Payment from Order

**Request:**
```bash
curl -X POST http://localhost:8081/api/v1/payments/vnpay/create-from-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "order_id": 1,
    "return_url": "http://localhost:5173/payment/result"
  }'
```

**Expected Response:**
```json
{
  "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000&vnp_Command=pay&vnp_CreateDate=20240805143022&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Payment+for+Order+%231+-+Flowo+Flower+Shop&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Fpayment%2Fresult&vnp_TmnCode=DEMO&vnp_TxnRef=ORD11691234567&vnp_Version=2.1.0&vnp_SecureHash=abc123...",
  "txn_ref": "ORD11691234567"
}
```

### 2. Test Payment Callback (Simulate VNPay Response)

**Successful Payment:**
```bash
curl -X POST http://localhost:8081/api/v1/payments/vnpay/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'vnp_ResponseCode=00&vnp_TransactionNo=14073218&vnp_BankCode=NCB&vnp_Amount=15000&vnp_PayDate=20240805143022&vnp_TransactionType=01&vnp_TxnRef=ORD11691234567&vnp_SecureHash=CALCULATED_HASH'
```

**Failed Payment:**
```bash
curl -X POST http://localhost:8081/api/v1/payments/vnpay/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'vnp_ResponseCode=24&vnp_TransactionNo=&vnp_BankCode=&vnp_Amount=15000&vnp_PayDate=20240805143022&vnp_TransactionType=01&vnp_TxnRef=ORD11691234567&vnp_SecureHash=CALCULATED_HASH'
```

### 3. Check Payment Status

**Request:**
```bash
curl -X GET http://localhost:8081/api/v1/payments/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "payment_id": 1,
  "order_id": 1,
  "payment_method": "VNPAY",
  "payment_status": "Success",
  "transaction_id": "ORD11691234567",
  "amount_paid": 150.00,
  "payment_date": "2024-08-05 14:30:22"
}
```

### 4. Get Payments by Order

**Request:**
```bash
curl -X GET http://localhost:8081/api/v1/payments/order/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
[
  {
    "payment_id": 1,
    "order_id": 1,
    "payment_method": "VNPAY",
    "payment_status": "Success",
    "transaction_id": "ORD11691234567",
    "amount_paid": 150.00,
    "payment_date": "2024-08-05 14:30:22"
  }
]
```

## Error Cases Testing

### 1. Unauthorized Access

**Request:**
```bash
curl -X POST http://localhost:8081/api/v1/payments/vnpay/create-from-order \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "return_url": "http://localhost:5173/payment/result"
  }'
```

**Expected Response:**
```json
{
  "error": "unauthorized"
}
```

### 2. Order Not Found

**Request:**
```bash
curl -X POST http://localhost:8081/api/v1/payments/vnpay/create-from-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "order_id": 99999,
    "return_url": "http://localhost:5173/payment/result"
  }'
```

**Expected Response:**
```json
{
  "error": "order not found"
}
```

### 3. Order Already Paid

**Request:** (Try to create payment for already paid order)
```bash
curl -X POST http://localhost:8081/api/v1/payments/vnpay/create-from-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "order_id": 1,
    "return_url": "http://localhost:5173/payment/result"
  }'
```

**Expected Response:**
```json
{
  "error": "order already paid"
}
```

### 4. Invalid Signature in Callback

**Request:**
```bash
curl -X POST http://localhost:8081/api/v1/payments/vnpay/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'vnp_ResponseCode=00&vnp_TransactionNo=14073218&vnp_BankCode=NCB&vnp_Amount=15000&vnp_PayDate=20240805143022&vnp_TransactionType=01&vnp_TxnRef=ORD11691234567&vnp_SecureHash=INVALID_HASH'
```

**Expected Response:**
```json
{
  "RspCode": "97",
  "Message": "Invalid signature"
}
```

## Database State Verification

After testing, verify the database states:

### Check Payment Records
```sql
SELECT * FROM Payment WHERE order_id = 1;
```

### Check Order Status Updates
```sql
SELECT order_id, status FROM `Order` WHERE order_id = 1;
```

## Frontend Integration Testing

### 1. JavaScript Integration

```javascript
// Create VNPay payment
async function createVNPayPayment(orderId) {
  try {
    const response = await fetch('/api/v1/payments/vnpay/create-from-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        order_id: orderId,
        return_url: `${window.location.origin}/payment/result`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Redirect to VNPay
    window.location.href = data.payment_url;
  } catch (error) {
    console.error('Payment creation failed:', error);
    alert('Failed to create payment: ' + error.message);
  }
}

// Handle return from VNPay
function handlePaymentResult() {
  const urlParams = new URLSearchParams(window.location.search);
  const responseCode = urlParams.get('vnp_ResponseCode');
  const txnRef = urlParams.get('vnp_TxnRef');
  
  if (responseCode === '00') {
    alert('Payment successful! Transaction: ' + txnRef);
    // Redirect to order confirmation page
    window.location.href = '/orders/' + txnRef.replace('ORD', '');
  } else {
    alert('Payment failed or was cancelled.');
    // Redirect back to checkout
    window.location.href = '/checkout';
  }
}
```

### 2. React Integration

```typescript
import { useState } from 'react';

interface VNPayPaymentResponse {
  payment_url: string;
  txn_ref: string;
}

const useVNPayPayment = () => {
  const [loading, setLoading] = useState(false);

  const createPayment = async (orderId: number): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/payments/vnpay/create-from-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          return_url: `${window.location.origin}/payment/result`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment creation failed');
      }

      const data: VNPayPaymentResponse = await response.json();
      
      // Redirect to VNPay payment page
      window.location.href = data.payment_url;
    } catch (error) {
      console.error('VNPay payment error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createPayment, loading };
};

// Usage in component
const CheckoutPage = () => {
  const { createPayment, loading } = useVNPayPayment();

  const handleVNPayPayment = async (orderId: number) => {
    try {
      await createPayment(orderId);
    } catch (error) {
      alert('Failed to create payment: ' + (error as Error).message);
    }
  };

  return (
    <button 
      onClick={() => handleVNPayPayment(123)}
      disabled={loading}
    >
      {loading ? 'Creating Payment...' : 'Pay with VNPay'}
    </button>
  );
};
```

## Environment Configuration

### Development Environment

Add to `.env` file:
```env
# VNPay Sandbox Configuration
VNPAY_TMN_CODE=DEMO
VNPAY_HASH_SECRET=DEMOHASHSECRET
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/payment/result
```

### Production Environment

```env
# VNPay Production Configuration
VNPAY_TMN_CODE=your_production_terminal_code
VNPAY_HASH_SECRET=your_production_hash_secret
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/payment/result
IS_PRODUCTION=true
```

## Common Issues and Solutions

### Issue 1: Invalid Signature Error

**Problem:** VNPay callback returns "Invalid signature"

**Solution:**
1. Check hash secret configuration
2. Verify parameter sorting and encoding
3. Ensure no extra parameters in hash calculation

**Debug Code:**
```go
// Add debug logging in service
func (s *PaymentService) debugVNPayHash(params map[string]string, expected, received string) {
    log.Debug().
        Interface("params", params).
        Str("expected_hash", expected).
        Str("received_hash", received).
        Msg("VNPay hash comparison")
}
```

### Issue 2: Callback Not Received

**Problem:** VNPay callback endpoint not being called

**Solutions:**
1. Ensure callback URL is publicly accessible
2. Check firewall and port settings
3. Verify URL format in VNPay configuration

### Issue 3: Payment Status Not Updated

**Problem:** Database not updated after successful payment

**Solutions:**
1. Check database connectivity
2. Verify transaction handling
3. Add error logging to callback processing

**Debug Code:**
```go
// Add detailed logging
log.Info().
    Int("payment_id", payment.PaymentID).
    Int("order_id", payment.OrderID).
    Str("old_status", payment.PaymentStatus).
    Str("new_status", newStatus).
    Msg("Updating payment status")
```

## Testing Checklist

- [ ] Payment creation works with valid order
- [ ] Payment URL redirects to VNPay sandbox
- [ ] Successful payment callback updates database
- [ ] Failed payment callback handles errors
- [ ] Duplicate payment prevention works
- [ ] User authorization checks work
- [ ] Invalid signature detection works
- [ ] Order status updates correctly
- [ ] Frontend integration handles all scenarios
- [ ] Error messages are user-friendly

---

*This testing guide covers all major scenarios for the VNPay payment integration. Use it to verify the implementation works correctly in both development and production environments.*
