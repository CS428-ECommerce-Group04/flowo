# Order API Documentation

This document provides a simple overview of the **Order API** including its purpose and usage.  
All endpoints use `Bearer Token` authentication (Firebase Authentication integrated with backend).

---

## User Endpoints

### `POST /api/v1/orders`
- **Description**: Create a new order from the items in the user's cart.  
- **Usage**: User must have items in the cart. The system will fetch cart data from DB and create an order.
- **Response**: Returns the created order info.

---

### `GET /api/v1/orders`
- **Description**: Get a list of orders for the authenticated user.  
- **Usage**: Use for tracking purchase history.
- **Response**: Array of user's orders.

---

### `GET /api/v1/orders/{id}`
- **Description**: Get detailed information about a specific order (only if the order belongs to the authenticated user).  
- **Usage**: For checking order details including items, total price, status, and shipping info.
- **Response**: Order details object.

---
### `PUT /api/v1/orders/{orderID}/status`
- **Description**: Admin change order status.  
- **Response**: Order details object.


## Admin Endpoints

### `GET /api/v1/admin/orders`
- **Description**: Retrieve all orders (admin only) with optional filters.  
- **Query Params**:
  - `status` (optional) → filter by order status
  - `user` (optional) → filter by Firebase UID
  - `start_date` (optional, format `YYYY-MM-DD`)
  - `end_date` (optional, format `YYYY-MM-DD`)
  - `page` (optional, default `1`)
  - `limit` (optional, default `20`)
- **Usage**: Admin dashboard for order management.
- **Response**: Array of orders including user ID, timestamps, and total amount.