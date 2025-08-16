# Flowo Recommendation Algorithms Reference

> **Complete Documentation**: [RECOMMENDATION_SYSTEM.md](./RECOMMENDATION_SYSTEM.md)

## Overview

The Flowo recommendation system uses a **hybrid approach** combining multiple algorithms to provide intelligent flower recommendations. This document focuses specifically on the algorithmic implementations and mathematical formulations.

## Core Algorithm Architecture

### Hybrid Scoring Formula

```
Final Score = (α × Collaborative Score) + (β × Content Score) + (γ × Popularity Score) + (δ × Trending Score)

Where: α + β + γ + δ = 1.0
```

**Default Weights:**
- `α` (Collaborative): **0.4** - User behavior similarity
- `β` (Content): **0.3** - Product feature matching
- `γ` (Popularity): **0.2** - Overall product popularity
- `δ` (Trending): **0.1** - Recent trending patterns

---

## 1. Collaborative Filtering Algorithm

### 1.1 User-Item Interaction Matrix

**Data Sources & Weights:**
```
Interaction Score = (Views × 0.1) + (Cart Adds × 0.3) + (Wishlist × 0.2) + (Purchases × 1.0) + (Reviews × 0.5)
```

### 1.2 User Similarity Calculation

**Cosine Similarity Formula:**
```
similarity(u₁, u₂) = (u₁ · u₂) / (||u₁|| × ||u₂||)

Where:
- u₁, u₂ = user interaction vectors
- · = dot product
- ||u|| = vector magnitude
```

### 1.3 Recommendation Score

```
score(user, item) = Σ(similarity(user, similar_user) × rating(similar_user, item)) / Σ|similarity(user, similar_user)|
```

**Implementation Logic:**
1. Find users with similar purchase patterns
2. Weight their interactions by similarity score
3. Predict ratings for uninteracted items
4. Exclude already purchased products

---

## 2. Content-Based Filtering Algorithm

### 2.1 Product Feature Vector

**Feature Weights:**
- **Flower Type Match**: 40% (categorical)
- **Price Similarity**: 30% (numerical)
- **Product Status**: 20% (categorical)
- **Rating Similarity**: 10% (numerical)

### 2.2 Content Similarity Formula

```go
func calculateContentSimilarity(product1, product2) float64 {
    similarity := 0.0
    
    // Flower type similarity (40% weight)
    if product1.FlowerType == product2.FlowerType {
        similarity += 0.4
    }
    
    // Price similarity (30% weight)
    priceDiff := abs(product1.BasePrice - product2.BasePrice)
    maxPrice := max(product1.BasePrice, product2.BasePrice)
    if maxPrice > 0 {
        priceSimRatio := 1.0 - (priceDiff / maxPrice)
        similarity += priceSimRatio * 0.3
    }
    
    // Status similarity (20% weight)
    if product1.Status == product2.Status {
        similarity += 0.2
    }
    
    // Rating similarity (10% weight)
    if product1.AverageRating > 0 && product2.AverageRating > 0 {
        ratingDiff := abs(product1.AverageRating - product2.AverageRating)
        ratingSimRatio := 1.0 - (ratingDiff / 5.0)
        similarity += ratingSimRatio * 0.1
    }
    
    return similarity
}
```

### 2.3 User Preference Learning

**Flower Type Preferences:**
```
preference_score(flower_type) = normalized(Σ interaction_scores for flower_type)
```

**Price Range Analysis:**
```
preferred_min = min(purchase_prices)
preferred_max = max(purchase_prices)  
average_spent = total_spent / purchase_count
```

---

## 3. Popularity-Based Algorithm

### 3.1 Popularity Score Calculation

```
popularity_score = (rating_component × 0.4) + (review_component × 0.3) + (sales_component × 0.3)

Where:
- rating_component = average_rating / 5.0
- review_component = min(review_count / 100.0, 1.0)
- sales_component = (1000 - sales_rank) / 1000.0
```

### 3.2 Implementation Logic

```go
func calculatePopularityScore(product) float64 {
    score := 0.0
    
    // Rating component (40%)
    if product.AverageRating > 0 {
        score += (product.AverageRating / 5.0) * 0.4
    }
    
    // Review volume component (30%)
    if product.ReviewCount > 0 {
        score += min(float64(product.ReviewCount)/100.0, 1.0) * 0.3
    }
    
    // Sales rank component (30%)
    if product.SalesRank > 0 && product.SalesRank <= 1000 {
        score += (1000.0 - float64(product.SalesRank)) / 1000.0 * 0.3
    }
    
    return score
}
```

---

## 4. Trending Algorithm

### 4.1 Trend Score Formula

```
trend_score = (recent_sales_velocity × 0.5) + (view_popularity × 0.3) + (rating_improvement × 0.2)

Where:
- recent_sales_velocity = recent_sales / total_sales
- view_popularity = recent_views / total_views  
- rating_improvement = current_rating / historical_rating
```

### 4.2 Time-Based Decay

**Periods Supported:**
- **Daily**: Last 24 hours
- **Weekly**: Last 7 days  
- **Monthly**: Last 30 days

**Decay Function:**
```
weight = e^(-decay_rate × time_difference)
```

### 4.3 Implementation

```go
func calculateTrendScore(product, period) float64 {
    trendScore := 0.0
    
    // Sales velocity (50%)
    if product.SalesRank > 0 && product.SalesRank <= 100 {
        trendScore += (100.0 - float64(product.SalesRank)) / 100.0 * 0.5
    }
    
    // Rating factor (30%)
    if product.AverageRating > 0 {
        trendScore += (product.AverageRating / 5.0) * 0.3
    }
    
    // Review velocity (20%)
    if product.ReviewCount > 0 {
        trendScore += min(float64(product.ReviewCount)/50.0, 1.0) * 0.2
    }
    
    return trendScore
}
```

---

## 5. Context-Aware Algorithms

### 5.1 Occasion-Based Scoring

```
occasion_score = base_score + occasion_boost + seasonal_multiplier

Where:
- base_score = content + popularity scores
- occasion_boost = 0.3 (if product matches occasion)
- seasonal_multiplier = 1.2 (during relevant season)
```

### 5.2 Price-Based Filtering

**Value Score Calculation:**
```
value_score = (rating_score + price_ratio) / 2

Where:
- rating_score = average_rating / 5.0
- price_ratio = (max_price - product_price) / (max_price - min_price)
```

---

## 6. Algorithm Selection Logic

### 6.1 Decision Tree

```
if user_has_sufficient_interactions(min_threshold=3):
    return hybrid_personalized_recommendations()
elif user_has_some_data():
    return content_based_with_trending()
else:
    return trending_and_popular_products()
```

### 6.2 Fallback Strategy

1. **Primary**: Hybrid personalized (requires ≥3 interactions)
2. **Secondary**: Content-based + trending
3. **Fallback**: Pure popularity + trending

---

## 7. Performance Optimizations

### 7.1 Similarity Caching

```sql
-- Precomputed similarities stored in database
CREATE TABLE ProductSimilarity (
    product_id_1 INT,
    product_id_2 INT,
    similarity_score DECIMAL(5,4),
    similarity_type VARCHAR(50)
);
```

### 7.2 Batch Processing

**User Preference Updates:**
- Run daily for active users
- Weekly for all users
- Triggered after significant interactions

**Similarity Calculations:**
- Monthly full recalculation
- Incremental updates for new products

### 7.3 Query Optimization

```sql
-- Optimized similarity lookup
SELECT product_id_2, similarity_score 
FROM ProductSimilarity 
WHERE product_id_1 = ? AND similarity_score >= 0.1
ORDER BY similarity_score DESC 
LIMIT 10;
```

---

## 8. Algorithm Configuration

### 8.1 Tunable Parameters

```go
type RecommendationConfig struct {
    // Algorithm weights
    CollaborativeWeight float64 // default: 0.4
    ContentWeight       float64 // default: 0.3
    PopularityWeight    float64 // default: 0.2
    TrendingWeight      float64 // default: 0.1
    
    // Thresholds
    MinSimilarity       float64 // default: 0.1
    MinInteractions     int     // default: 3
    DefaultLimit        int     // default: 10
    
    // Performance
    CacheDuration       int     // default: 60 minutes
}
```

### 8.2 A/B Testing Support

```go
// Different configurations for testing
configs := map[string]RecommendationConfig{
    "content_heavy": {0.2, 0.5, 0.2, 0.1},
    "collaborative_heavy": {0.6, 0.2, 0.1, 0.1},
    "trending_heavy": {0.3, 0.2, 0.2, 0.3},
}
```

---

## 9. Mathematical Complexity

### 9.1 Time Complexity

- **Collaborative Filtering**: O(n×m×k) where n=users, m=items, k=similar users
- **Content-Based**: O(m²×f) where m=items, f=features  
- **Popularity**: O(m) where m=items
- **Trending**: O(m×t) where m=items, t=time periods

### 9.2 Space Complexity

- **User-Item Matrix**: O(n×m)
- **Similarity Matrix**: O(m²) 
- **User Preferences**: O(n×f)
- **Trending Cache**: O(m×t)

---

## 10. Algorithm Evaluation Metrics

### 10.1 Accuracy Metrics

- **Precision@K**: Relevant items in top-K recommendations
- **Recall@K**: Coverage of relevant items
- **NDCG**: Normalized Discounted Cumulative Gain
- **MAE**: Mean Absolute Error for rating predictions

### 10.2 Business Metrics

- **Click-Through Rate (CTR)**: Recommendations clicked / shown
- **Conversion Rate**: Purchases / clicks
- **Revenue per Recommendation**: Average order value
- **Coverage**: % of catalog recommended

### 10.3 Diversity Metrics

- **Intra-list Diversity**: Variety within recommendation list
- **Catalog Coverage**: % of items ever recommended
- **Novelty**: How often new/unexpected items are suggested

---

## Implementation Notes

### Algorithm Switching

The system intelligently switches between algorithms based on:
- **Data availability**: User interaction history
- **Context**: Time of day, season, occasion
- **Performance**: Real-time A/B testing results

### Continuous Learning

- **User preferences** updated after each interaction
- **Product similarities** recalculated periodically  
- **Trending scores** updated in real-time
- **Algorithm weights** adjusted based on performance

---

**Reference**: For complete implementation details, API usage, and integration guide, see [RECOMMENDATION_SYSTEM.md](./RECOMMENDATION_SYSTEM.md)

*Last updated: August 2024*