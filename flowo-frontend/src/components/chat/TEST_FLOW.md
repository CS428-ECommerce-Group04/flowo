# Chatbot Testing Flow

## Overview
The chatbot now includes fallback tools that work with real product IDs from the backend. The tools return product IDs which are then used to fetch actual product data from the API.

## Available Tools

1. **Search Products** - Search for products by keyword
2. **Get Recommendations** - Get product recommendations by occasion
3. **Add to Cart** - Add products to the shopping cart
4. **Get Product Details** - Get detailed information about a specific product

## Test Scenarios

### Scenario 1: Search for Products
```
User: "Show me roses"
Bot: Returns product with ID [1] - Red Rose Bouquet
     Displays actual product name, price, and stock from API

User: "Find lavender"
Bot: Returns product with ID [9] - Lavender Breeze
     Shows real product data fetched from backend

User: "Search for birthday flowers"
Bot: Returns products with IDs [1, 5, 7]
     - Red Rose Bouquet
     - Daisy Daylight
     - Autumn Chrysanthemum
```

### Scenario 2: Get Recommendations
```
User: "Recommend flowers for anniversary"
Bot: Returns product IDs [1, 3, 8]
     Fetches and displays:
     - Red Rose Bouquet
     - Orchid Delight
     - Royal Iris

User: "What should I get for a birthday?"
Bot: Returns product IDs [1, 5, 7]
     - Red Rose Bouquet
     - Daisy Daylight
     - Autumn Chrysanthemum

User: "Suggest budget flowers"
Bot: Returns budget-friendly product IDs [4, 5, 7]
     - Carnation Charm
     - Daisy Daylight
     - Autumn Chrysanthemum
```

### Scenario 3: Add to Cart
```
User: "Add product 1 to cart"
Bot: - Fetches product 1 details from backend
     - Adds to cart with actual name and price
     - Shows: "✅ Successfully added 1 × [Product Name] to your cart!"
     - Displays cart total

User: "Add 3 of product 5 to cart"
Bot: - Fetches product 5 from API
     - Adds 3 items to cart
     - Updates cart count and total
```

### Scenario 4: Product Details
```
User: "Tell me about product 3"
Bot: Fetches product 3 from backend and displays:
     - Product name
     - Description
     - Current price
     - Stock quantity
     - Rating (if available)
     - "Would you like to add this to your cart?"

User: "Details for product 10"
Bot: Shows full product information from database
```

### Scenario 5: Combined Flow
```
User: "I need flowers for my mom's birthday"
Bot: Returns recommendation IDs [2, 3, 7, 11]
     Shows 4 birthday-appropriate products

User: "Tell me more about product 2"
Bot: Fetches and displays product 2 details
     - Name: Sunflower arrangement (or actual name from DB)
     - Price: $XX.XX (actual price)
     - Description: (actual description)
     - Stock: XX available

User: "Add product 2 to cart"
Bot: Adds to cart successfully
     Shows cart update

User: "Show me roses too"
Bot: Returns rose product IDs [1, 11, 15]
     Displays rose products from backend

User: "Add product 1 to cart"
Bot: Adds roses to cart
     Cart now has 2 items
     Shows total price
```

## Product ID Mapping

The tools use real product IDs from your backend database (10 products total):

### Actual Products in Backend:
1. **Red Rose Bouquet** (ID: 1)
2. **White Lily Arrangement** (ID: 2)
3. **Orchid Delight** (ID: 3)
4. **Carnation Charm** (ID: 4)
5. **Daisy Daylight** (ID: 5)
6. **Hydrangea Hues** (ID: 6)
7. **Autumn Chrysanthemum** (ID: 7)
8. **Royal Iris** (ID: 8)
9. **Lavender Breeze** (ID: 9)
10. **Cloudy Gypsophila** (ID: 10)

### Search Mappings:
- Roses: ID [1]
- Lily: ID [2]
- Orchid: ID [3]
- Carnation: ID [4]
- Daisy: ID [5]
- Hydrangea: ID [6]
- Chrysanthemum: ID [7]
- Iris: ID [8]
- Lavender: ID [9]
- Gypsophila/Baby's Breath: ID [10]

### Price Categories:
- Budget options: IDs [4, 5, 7]
- Mid-range: IDs [1, 2, 9, 10]
- Premium options: IDs [3, 6, 8]

## API Integration

The chatbot fetches real products from:
```
GET http://localhost:8081/api/v1/products
```

Then filters by the IDs returned from tools.

## Fallback Behavior

If the backend API is unavailable:
- Tools still return product IDs
- Basic product info is generated as fallback
- Cart operations still work locally

## Testing Instructions

1. Open the chatbot in your application
2. Try each scenario above
3. Verify that:
   - Product IDs match backend data
   - Prices and names are from the real database
   - Cart operations update the actual cart state
   - Product details show real information

## Notes

- The tool system detects intent from natural language
- Product IDs are hardcoded to match your backend
- The system falls back gracefully if API is down
- Cart state is managed through Zustand store
- All products displayed are fetched from the backend API