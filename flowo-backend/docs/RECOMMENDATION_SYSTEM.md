# Flowo Recommendation System

## Overview

The Flowo recommendation system is a hybrid approach that combines multiple algorithms to provide personalized product recommendations for the online flower shop. It leverages user behavior, product content, popularity metrics, and trending data to suggest relevant flowers to customers.

## Architecture

### Core Components

1. **Hybrid Scoring Algorithm**: Combines multiple recommendation strategies
2. **Collaborative Filtering**: User-based similarity analysis
3. **Content-Based Filtering**: Product feature similarity
4. **Popularity-Based**: Trending and popular products
5. **Context-Aware**: Occasion and price-based recommendations

### Technology Stack

- **Language**: Go (Golang)
- **Database**: MySQL with optimized indexes
- **Architecture**: Clean Architecture (Repository → Service → Controller)
- **API**: RESTful endpoints with Gin framework

## Algorithm Details

### Hybrid Scoring Formula

```
Final Score = (α × Collaborative Score) + (β × Content Score) + (γ × Popularity Score) + (δ × Trending Score)

Default weights:
- α (Collaborative): 0.4
- β (Content): 0.3  
- γ (Popularity): 0.2
- δ (Trending): 0.1
```

### 1. Collaborative Filtering

**Approach**: User-Item Matrix with Cosine Similarity

**Data Sources**:
- Order history (weight: 1.0)
- Cart additions (weight: 0.6)
- Product views (weight: 0.3)
- Reviews (weight: 0.8)

**Algorithm**:
1. Find users with similar purchase patterns
2. Recommend products purchased by similar users
3. Weight recommendations by user similarity scores

### 2. Content-Based Filtering

**Product Features**:
- Flower type (40% weight)
- Price similarity (30% weight)
- Product status (20% weight)  
- Rating similarity (10% weight)

**Similarity Calculation**:
```go
similarity = flowerTypeMatch*0.4 + priceSimRatio*0.3 + statusMatch*0.2 + ratingSimRatio*0.1
```

### 3. Popularity-Based Recommendations

**Metrics**:
- Average rating (40% weight)
- Review count (30% weight)
- Sales rank (30% weight)

### 4. Trending Algorithm

**Factors**:
- Recent sales velocity
- View popularity growth
- Rating improvements
- Seasonal relevance

## API Endpoints

### Core Endpoints

```http
GET /api/recommendations
```
**Parameters**:
- `recommendation_type`: personalized|similar|trending|occasion_based|price_based
- `user_id`: For personalized recommendations
- `product_id`: For similar products
- `occasion`: For occasion-based
- `price_min`, `price_max`: For price-based
- `limit`: Number of results (default: 10, max: 50)

### Specific Endpoints

```http
# Similar products
GET /api/recommendations/similar/{product_id}?limit=10

# Trending products  
GET /api/recommendations/trending?period=weekly&limit=10

# Occasion-based
GET /api/recommendations/occasion/{occasion}?limit=10

# Personalized for user
GET /api/recommendations/users/{user_id}?limit=10

# Update user preferences
PUT /api/recommendations/users/{user_id}/preferences

# Record feedback
POST /api/recommendations/feedback

# Get statistics
GET /api/recommendations/stats?period=weekly
```

## Database Schema

### Core Tables

#### UserPreference
```sql
CREATE TABLE UserPreference (
    user_id INT PRIMARY KEY,
    flower_preferences JSON,      -- {"Rose": 0.9, "Lily": 0.7}
    occasion_preferences JSON,    -- {"Valentine's Day": 0.9}
    price_min DECIMAL(10, 2),
    price_max DECIMAL(10, 2),
    average_spent DECIMAL(10, 2),
    last_updated TIMESTAMP
);
```

#### ProductSimilarity
```sql
CREATE TABLE ProductSimilarity (
    product_id_1 INT,
    product_id_2 INT,
    similarity_score DECIMAL(5, 4),  -- 0.0000 to 1.0000
    similarity_type VARCHAR(50),     -- content|collaborative|hybrid
    updated_at TIMESTAMP,
    PRIMARY KEY (product_id_1, product_id_2)
);
```

#### TrendingProduct
```sql
CREATE TABLE TrendingProduct (
    product_id INT,
    trend_score DECIMAL(5, 4),
    view_count INT,
    purchase_count INT,
    period VARCHAR(20),              -- daily|weekly|monthly
    updated_at TIMESTAMP,
    PRIMARY KEY (product_id, period)
);
```

#### RecommendationFeedback
```sql
CREATE TABLE RecommendationFeedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    recommendation_type VARCHAR(50),
    action VARCHAR(50),              -- clicked|purchased|dismissed|liked
    session_id VARCHAR(255),
    created_at TIMESTAMP
);
```

## Usage Examples

### 1. Get Personalized Recommendations

```bash
curl "http://localhost:8080/api/recommendations?recommendation_type=personalized&user_id=123&limit=10"
```

**Response**:
```json
{
    "recommendation_type": "personalized",
    "recommendations": [
        {
            "product": {
                "product_id": 15,
                "name": "Red Rose Bouquet",
                "flower_type": "Rose",
                "base_price": 29.99,
                "effective_price": 25.49
            },
            "score": 0.85,
            "reason": "Based on your previous purchases of roses",
            "category": "content_based"
        }
    ],
    "explanation": "Personalized recommendations based on your purchase history and preferences",
    "generated_at": "2024-03-15T10:30:00Z",
    "total": 10
}
```

### 2. Get Similar Products

```bash
curl "http://localhost:8080/api/recommendations/similar/123?limit=5"
```

### 3. Get Trending Products

```bash
curl "http://localhost:8080/api/recommendations/trending?period=weekly&limit=8"
```

### 4. Record User Feedback

```bash
curl -X POST "http://localhost:8080/api/recommendations/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "product_id": 456,
    "recommendation_type": "personalized",
    "action": "purchased"
  }'
```

## Integration Guide

### 1. Add to Main Service

```go
// In cmd/main.go
recommendationRepo := repository.NewRecommendationRepository(db)
recommendationService := service.NewRecommendationService(recommendationRepo, productRepo)
recommendationController := controller.NewRecommendationController(recommendationService)

// Register routes
controller.RegisterRecommendationRoutes(router, recommendationController)
```

### 2. Update Repository Interface

```go
// Add to internal/repository/repository.go
type Repository interface {
    // ... existing methods
    
    // Recommendation methods
    GetUserInteractions(userID int) ([]model.UserInteractionSummary, error)
    GetProductSimilarities(productID uint, limit int) ([]model.ProductSimilarity, error)
    // ... other recommendation methods
}
```

### 3. Initialize Database

```bash
# Run the recommendation tables script
mysql -u username -p database_name < init_script/recommendation_tables.sql
```

## Performance Optimization

### 1. Caching Strategy

- **User Preferences**: Cache for 1 hour
- **Product Similarities**: Cache for 24 hours  
- **Trending Products**: Cache for 6 hours
- **Popular Products**: Cache for 12 hours

### 2. Background Jobs

Set up cron jobs or scheduled tasks for:

```bash
# Update trending products daily
0 2 * * * CALL UpdateTrendingProducts('daily');

# Update user preferences weekly  
0 3 * * 0 UPDATE user preferences for active users;

# Calculate product similarities monthly
0 4 1 * * CALL CalculateProductSimilarities();
```

### 3. Database Optimization

Key indexes created:
- `idx_user_interaction_user_type` on UserProductInteraction
- `idx_trending_period_score` on TrendingProduct  
- `idx_similarity_product1_score` on ProductSimilarity
- `idx_review_product_rating` on Review

## Configuration

### Environment Variables

```env
# Recommendation system settings
RECOMMENDATION_COLLABORATIVE_WEIGHT=0.4
RECOMMENDATION_CONTENT_WEIGHT=0.3
RECOMMENDATION_POPULARITY_WEIGHT=0.2
RECOMMENDATION_TRENDING_WEIGHT=0.1
RECOMMENDATION_MIN_SIMILARITY=0.1
RECOMMENDATION_DEFAULT_LIMIT=10
RECOMMENDATION_CACHE_DURATION=60
RECOMMENDATION_MIN_INTERACTIONS=3
```

### Service Configuration

```go
type RecommendationConfig struct {
    CollaborativeWeight float64 `json:"collaborative_weight"`
    ContentWeight       float64 `json:"content_weight"`
    PopularityWeight    float64 `json:"popularity_weight"`
    TrendingWeight      float64 `json:"trending_weight"`
    MinSimilarity       float64 `json:"min_similarity"`
    DefaultLimit        int     `json:"default_limit"`
    CacheDuration       int     `json:"cache_duration"`
    MinInteractions     int     `json:"min_interactions"`
}
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Recommendation Performance**:
   - Click-through rate (CTR)
   - Conversion rate
   - Average recommendation score
   - Coverage (% of products recommended)

2. **User Engagement**:
   - Recommendation usage frequency
   - User preference accuracy
   - Feedback sentiment

3. **System Performance**:
   - API response times
   - Cache hit rates
   - Database query performance

### Analytics Queries

```sql
-- Click-through rate by recommendation type
SELECT 
    recommendation_type,
    COUNT(CASE WHEN action = 'clicked' THEN 1 END) / COUNT(*) as ctr
FROM RecommendationFeedback 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY recommendation_type;

-- Top performing products in recommendations
SELECT 
    p.name,
    COUNT(rf.feedback_id) as total_feedback,
    COUNT(CASE WHEN rf.action = 'purchased' THEN 1 END) as purchases
FROM RecommendationFeedback rf
JOIN FlowerProduct p ON rf.product_id = p.product_id
WHERE rf.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.product_id, p.name
ORDER BY purchases DESC
LIMIT 10;
```

## Testing

### Unit Tests

```go
func TestGetPersonalizedRecommendations(t *testing.T) {
    // Mock repository
    mockRepo := &MockRecommendationRepository{}
    service := NewRecommendationService(mockRepo, mockProductRepo)
    
    req := &dto.RecommendationRequestDTO{
        UserID: &userID,
        RecommendationType: "personalized",
        Limit: 10,
    }
    
    recommendations, err := service.GetPersonalizedRecommendations(context.Background(), req)
    
    assert.NoError(t, err)
    assert.Len(t, recommendations.Recommendations, 10)
    assert.Equal(t, "personalized", recommendations.RecommendationType)
}
```

### Integration Tests

```bash
# Test personalized recommendations
curl -X GET "http://localhost:8080/api/recommendations?recommendation_type=personalized&user_id=1&limit=5"

# Test similar products
curl -X GET "http://localhost:8080/api/recommendations/similar/1?limit=5"

# Test trending products
curl -X GET "http://localhost:8080/api/recommendations/trending?period=weekly&limit=5"
```

## Troubleshooting

### Common Issues

1. **No Recommendations Returned**:
   - Check if user has sufficient interaction history
   - Verify database connections
   - Check if products exist and are in stock

2. **Poor Recommendation Quality**:
   - Increase minimum interaction threshold
   - Adjust algorithm weights
   - Update user preferences more frequently

3. **Slow Performance**:
   - Check database indexes
   - Implement caching
   - Optimize query complexity

### Debug Queries

```sql
-- Check user interaction data
SELECT * FROM UserProductInteraction WHERE user_id = 123;

-- Check product similarities
SELECT * FROM ProductSimilarity WHERE product_id_1 = 456 OR product_id_2 = 456;

-- Check trending data
SELECT * FROM TrendingProduct WHERE period = 'weekly' ORDER BY trend_score DESC;
```

## Future Enhancements

### Phase 2 Features

1. **Machine Learning Integration**:
   - TensorFlow/PyTorch models
   - Deep learning embeddings
   - Advanced collaborative filtering

2. **Real-time Recommendations**:
   - Stream processing with Apache Kafka
   - Real-time model updates
   - Live A/B testing

3. **Advanced Context Awareness**:
   - Seasonal patterns
   - Weather-based recommendations
   - Location-based preferences
   - Time-of-day optimization

### Phase 3 Features

1. **Multi-armed Bandit**:
   - Exploration vs exploitation
   - Dynamic algorithm selection
   - Automated weight optimization

2. **Cross-selling & Upselling**:
   - Bundle recommendations
   - Accessory suggestions
   - Price tier upgrades

3. **Social Recommendations**:
   - Friend's preferences
   - Social media integration
   - Viral product detection

## Support

For questions or issues with the recommendation system:

1. Check the logs: `/var/log/flowo/recommendations.log`
2. Review database performance: Monitor slow query log
3. Check API metrics: Review response times and error rates
4. Contact the development team with specific error messages

---

*Last updated: March 2024*
*Version: 1.0*