package service

import (
	"context"
	"encoding/json"
	"errors"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
	"math"
	"sort"
	"time"
)

type RecommendationService interface {
	GetPersonalizedRecommendations(ctx context.Context, req *dto.RecommendationRequestDTO) (*dto.RecommendationResponseDTO, error)
	GetSimilarProducts(ctx context.Context, productID uint, limit int) (*dto.RecommendationResponseDTO, error)
	GetTrendingProducts(ctx context.Context, period string, limit int) (*dto.RecommendationResponseDTO, error)
	GetOccasionBasedRecommendations(ctx context.Context, occasion string, limit int) (*dto.RecommendationResponseDTO, error)
	GetPriceBasedRecommendations(ctx context.Context, minPrice, maxPrice float64, limit int) (*dto.RecommendationResponseDTO, error)
	UpdateUserPreferences(ctx context.Context, firebaseUID string) error
	CalculateProductSimilarities(ctx context.Context, productID uint) error
	UpdateTrendingProducts(ctx context.Context) error
	RecordRecommendationFeedback(ctx context.Context, feedback *dto.RecommendationFeedbackDTO) error
	GetRecommendationStats(ctx context.Context, period string) (*dto.RecommendationStatsDTO, error)
}

type recommendationService struct {
	recommendationRepo repository.RecommendationRepository
	productRepo        repository.Repository
	config             model.RecommendationConfig
}

func NewRecommendationService(
	recommendationRepo repository.RecommendationRepository,
	productRepo repository.Repository,
) RecommendationService {
	return &recommendationService{
		recommendationRepo: recommendationRepo,
		productRepo:        productRepo,
		config:             model.DefaultRecommendationConfig(),
	}
}

// GetPersonalizedRecommendations provides personalized recommendations using hybrid approach
func (s *recommendationService) GetPersonalizedRecommendations(ctx context.Context, req *dto.RecommendationRequestDTO) (*dto.RecommendationResponseDTO, error) {
	if req.FirebaseUID == nil {
		return s.getAnonymousRecommendations(ctx, req)
	}

	firebaseUID := *req.FirebaseUID
	limit := req.Limit
	if limit <= 0 {
		limit = s.config.DefaultLimit
	}

	// Get user interactions and preferences
	interactions, err := s.recommendationRepo.GetUserInteractions(firebaseUID)
	if err != nil {
		return nil, err
	}

	if len(interactions) < s.config.MinInteractions {
		// Fallback to trending products for users with minimal interactions
		return s.GetTrendingProducts(ctx, "weekly", limit)
	}

	// Calculate hybrid recommendations
	recommendations := make(map[uint]*dto.RecommendedProductDTO)

	// 1. Collaborative Filtering
	collaborativeRecs, err := s.getCollaborativeRecommendations(firebaseUID, limit*2)
	if err == nil {
		s.mergeRecommendations(recommendations, collaborativeRecs, s.config.CollaborativeWeight, "collaborative")
	}

	// 2. Content-Based Filtering
	contentRecs, err := s.getContentBasedRecommendations(firebaseUID, limit*2)
	if err == nil {
		s.mergeRecommendations(recommendations, contentRecs, s.config.ContentWeight, "content_based")
	}

	// 3. Popularity-Based
	popularRecs, err := s.getPopularityRecommendations(limit)
	if err == nil {
		s.mergeRecommendations(recommendations, popularRecs, s.config.PopularityWeight, "popularity")
	}

	// 4. Trending products
	trendingRecs, err := s.getTrendingRecommendations("weekly", limit)
	if err == nil {
		s.mergeRecommendations(recommendations, trendingRecs, s.config.TrendingWeight, "trending")
	}

	// Convert to slice and sort by score
	finalRecs := s.sortAndLimitRecommendations(recommendations, limit)

	return &dto.RecommendationResponseDTO{
		RecommendationType: "personalized",
		Recommendations:    finalRecs,
		Explanation:        "Personalized recommendations based on your purchase history, preferences, and trending products",
		GeneratedAt:        time.Now().Format(time.RFC3339),
		Total:              len(finalRecs),
	}, nil
}

// GetSimilarProducts finds products similar to a given product
func (s *recommendationService) GetSimilarProducts(ctx context.Context, productID uint, limit int) (*dto.RecommendationResponseDTO, error) {
	if limit <= 0 {
		limit = s.config.DefaultLimit
	}

	// Get target product
	targetProduct, err := s.productRepo.GetProductByID(productID)
	if err != nil {
		return nil, err
	}

	recommendations := make(map[uint]*dto.RecommendedProductDTO)

	// 1. Get precomputed similarities
	similarities, err := s.recommendationRepo.GetProductSimilarities(productID, limit*2)
	if err == nil && len(similarities) > 0 {
		for _, sim := range similarities {
			otherProductID := sim.ProductID1
			if sim.ProductID1 == productID {
				otherProductID = sim.ProductID2
			}

			product, err := s.productRepo.GetProductByID(otherProductID)
			if err != nil {
				continue
			}

			productResponse := ToProductResponse(*product, product.BasePrice)
			recommendations[otherProductID] = &dto.RecommendedProductDTO{
				Product:  productResponse,
				Score:    sim.SimilarityScore,
				Reason:   "Similar product features",
				Category: "similar_products",
			}
		}
	}

	// 2. Fallback: Content-based similarity
	if len(recommendations) < limit {
		// Same flower type
		similarByType, err := s.recommendationRepo.GetProductsByFlowerType(targetProduct.FlowerType, productID, limit)
		if err == nil {
			for _, product := range similarByType {
				if _, exists := recommendations[product.ProductID]; !exists {
					productResponse := ToProductResponse(product, product.BasePrice)
					recommendations[product.ProductID] = &dto.RecommendedProductDTO{
						Product:  productResponse,
						Score:    0.7, // Base similarity score for same flower type
						Reason:   "Same flower type: " + product.FlowerType,
						Category: "same_type",
					}
				}
			}
		}

		// Similar price range
		priceMin := targetProduct.BasePrice * 0.8
		priceMax := targetProduct.BasePrice * 1.2
		similarByPrice, err := s.recommendationRepo.GetProductsByPriceRange(priceMin, priceMax, productID, limit)
		if err == nil {
			for _, product := range similarByPrice {
				if _, exists := recommendations[product.ProductID]; !exists {
					productResponse := ToProductResponse(product, product.BasePrice)
					recommendations[product.ProductID] = &dto.RecommendedProductDTO{
						Product:  productResponse,
						Score:    0.5, // Lower score for price similarity
						Reason:   "Similar price range",
						Category: "similar_price",
					}
				}
			}
		}
	}

	finalRecs := s.sortAndLimitRecommendations(recommendations, limit)

	return &dto.RecommendationResponseDTO{
		RecommendationType: "similar",
		Recommendations:    finalRecs,
		Explanation:        "Products similar to " + targetProduct.Name,
		GeneratedAt:        time.Now().Format(time.RFC3339),
		Total:              len(finalRecs),
	}, nil
}

// GetTrendingProducts returns trending products
func (s *recommendationService) GetTrendingProducts(ctx context.Context, period string, limit int) (*dto.RecommendationResponseDTO, error) {
	if limit <= 0 {
		limit = s.config.DefaultLimit
	}

	trendingProducts, err := s.recommendationRepo.GetTrendingProducts(period, limit)
	if err != nil {
		return nil, err
	}

	var recommendations []dto.RecommendedProductDTO
	for _, trending := range trendingProducts {
		product, err := s.productRepo.GetProductByID(trending.ProductID)
		if err != nil {
			continue
		}

		productResponse := ToProductResponse(*product, product.BasePrice)
		recommendations = append(recommendations, dto.RecommendedProductDTO{
			Product:  productResponse,
			Score:    trending.TrendScore,
			Reason:   "Trending product with high popularity",
			Category: "trending",
		})
	}

	// Fallback to popular products if no trending data
	if len(recommendations) == 0 {
		popularRecs, err := s.getPopularityRecommendations(limit)
		if err != nil {
			return nil, err
		}
		for _, rec := range popularRecs {
			recommendations = append(recommendations, dto.RecommendedProductDTO{
				Product:  rec.Product,
				Score:    rec.Score,
				Reason:   "Popular product",
				Category: "popular",
			})
		}
	}

	return &dto.RecommendationResponseDTO{
		RecommendationType: "trending",
		Recommendations:    recommendations,
		Explanation:        "Currently trending products",
		GeneratedAt:        time.Now().Format(time.RFC3339),
		Total:              len(recommendations),
	}, nil
}

// GetOccasionBasedRecommendations returns products for specific occasions
func (s *recommendationService) GetOccasionBasedRecommendations(ctx context.Context, occasion string, limit int) (*dto.RecommendationResponseDTO, error) {
	if limit <= 0 {
		limit = s.config.DefaultLimit
	}

	products, err := s.recommendationRepo.GetProductsByOccasion(occasion, 0, limit)
	if err != nil {
		return nil, err
	}

	var recommendations []dto.RecommendedProductDTO
	for _, product := range products {
		productResponse := ToProductResponse(product, product.BasePrice)
		
		// Calculate score based on popularity and ratings
		score := 0.5 // Base score
		if product.AverageRating > 0 {
			score += (product.AverageRating / 5.0) * 0.3
		}
		if product.SalesRank > 0 && product.SalesRank <= 100 {
			score += (100.0 - float64(product.SalesRank)) / 100.0 * 0.2
		}

		recommendations = append(recommendations, dto.RecommendedProductDTO{
			Product:  productResponse,
			Score:    score,
			Reason:   "Perfect for " + occasion,
			Category: "occasion_based",
		})
	}

	return &dto.RecommendationResponseDTO{
		RecommendationType: "occasion_based",
		Recommendations:    recommendations,
		Explanation:        "Perfect flowers for " + occasion,
		GeneratedAt:        time.Now().Format(time.RFC3339),
		Total:              len(recommendations),
	}, nil
}

// GetPriceBasedRecommendations returns products within price range
func (s *recommendationService) GetPriceBasedRecommendations(ctx context.Context, minPrice, maxPrice float64, limit int) (*dto.RecommendationResponseDTO, error) {
	if limit <= 0 {
		limit = s.config.DefaultLimit
	}

	products, err := s.recommendationRepo.GetProductsByPriceRange(minPrice, maxPrice, 0, limit)
	if err != nil {
		return nil, err
	}

	var recommendations []dto.RecommendedProductDTO
	for _, product := range products {
		productResponse := ToProductResponse(product, product.BasePrice)
		
		// Calculate score based on value (rating vs price)
		score := 0.5
		if product.AverageRating > 0 {
			priceRatio := (maxPrice - product.BasePrice) / (maxPrice - minPrice)
			ratingScore := product.AverageRating / 5.0
			score = (priceRatio + ratingScore) / 2.0
		}

		recommendations = append(recommendations, dto.RecommendedProductDTO{
			Product:  productResponse,
			Score:    score,
			Reason:   "Great value within your budget",
			Category: "price_based",
		})
	}

	return &dto.RecommendationResponseDTO{
		RecommendationType: "price_based",
		Recommendations:    recommendations,
		Explanation:        "Best flowers within your price range",
		GeneratedAt:        time.Now().Format(time.RFC3339),
		Total:              len(recommendations),
	}, nil
}

// Helper methods

func (s *recommendationService) getAnonymousRecommendations(ctx context.Context, req *dto.RecommendationRequestDTO) (*dto.RecommendationResponseDTO, error) {
	// For anonymous users, provide trending/popular products
	return s.GetTrendingProducts(ctx, "weekly", req.Limit)
}

func (s *recommendationService) getCollaborativeRecommendations(firebaseUID string, limit int) ([]*dto.RecommendedProductDTO, error) {
	// Find similar users
	similarUsers, err := s.recommendationRepo.GetSimilarUsers(firebaseUID, 10)
	if err != nil || len(similarUsers) == 0 {
		return nil, errors.New("no similar users found")
	}

	// Get products purchased by similar users
	productScores := make(map[uint]float64)
	userPurchases, _ := s.recommendationRepo.GetUserPurchaseHistory(firebaseUID)
	purchasedProducts := make(map[uint]bool)
	for _, product := range userPurchases {
		purchasedProducts[product.ProductID] = true
	}

	for _, similarFirebaseUserID := range similarUsers {
		purchases, err := s.recommendationRepo.GetUserPurchaseHistory(similarFirebaseUserID)
		if err != nil {
			continue
		}

		for _, product := range purchases {
			if !purchasedProducts[product.ProductID] {
				productScores[product.ProductID] += 1.0 / float64(len(similarUsers))
			}
		}
	}

	// Convert to recommendations
	var recommendations []*dto.RecommendedProductDTO
	for productID, score := range productScores {
		product, err := s.productRepo.GetProductByID(productID)
		if err != nil {
			continue
		}

		productResponse := ToProductResponse(*product, product.BasePrice)
		recommendations = append(recommendations, &dto.RecommendedProductDTO{
			Product:  productResponse,
			Score:    score,
			Reason:   "Users with similar taste also bought this",
			Category: "collaborative",
		})
	}

	// Sort by score and limit
	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].Score > recommendations[j].Score
	})

	if len(recommendations) > limit {
		recommendations = recommendations[:limit]
	}

	return recommendations, nil
}

func (s *recommendationService) getContentBasedRecommendations(firebaseUID string, limit int) ([]*dto.RecommendedProductDTO, error) {
	// Get user preferences
	userPrefs, err := s.recommendationRepo.GetUserPreferences(firebaseUID)
	if err != nil || userPrefs == nil {
		// Fallback to purchase history
		return s.getContentBasedFromHistory(firebaseUID, limit)
	}

	// Parse preferences
	var flowerPrefs map[string]float64
	var occasionPrefs map[string]float64
	
	if err := json.Unmarshal([]byte(userPrefs.FlowerPreferences), &flowerPrefs); err != nil {
		flowerPrefs = make(map[string]float64)
	}
	if err := json.Unmarshal([]byte(userPrefs.OccasionPreferences), &occasionPrefs); err != nil {
		occasionPrefs = make(map[string]float64)
	}

	var recommendations []*dto.RecommendedProductDTO

	// Recommend based on preferred flower types
	if len(flowerPrefs) == 0 {
		// Fallback to purchase history if no flower preferences
		return s.getContentBasedFromHistory(firebaseUID, limit)
	}

	for flowerType, pref := range flowerPrefs {
		if pref > 0.5 {
			products, err := s.recommendationRepo.GetProductsByFlowerType(flowerType, 0, limit/len(flowerPrefs)+1)
			if err != nil {
				continue
			}

			for _, product := range products {
				productResponse := ToProductResponse(product, product.BasePrice)
				recommendations = append(recommendations, &dto.RecommendedProductDTO{
					Product:  productResponse,
					Score:    pref,
					Reason:   "Based on your preference for " + flowerType,
					Category: "content_based",
				})
			}
		}
	}

	return recommendations, nil
}

func (s *recommendationService) getContentBasedFromHistory(firebaseUID string, limit int) ([]*dto.RecommendedProductDTO, error) {
	purchaseHistory, err := s.recommendationRepo.GetUserPurchaseHistory(firebaseUID)
	if err != nil || len(purchaseHistory) == 0 {
		return nil, errors.New("no purchase history found")
	}

	// Analyze user's flower type preferences from history
	flowerTypeCount := make(map[string]int)
	for _, product := range purchaseHistory {
		flowerTypeCount[product.FlowerType]++
	}

	var recommendations []*dto.RecommendedProductDTO
	
	if len(flowerTypeCount) == 0 {
		return nil, errors.New("no flower preferences found from purchase history")
	}
	
	for flowerType, count := range flowerTypeCount {
		score := float64(count) / float64(len(purchaseHistory))
		if score > 0.2 { // Only recommend if user has shown interest
			products, err := s.recommendationRepo.GetProductsByFlowerType(flowerType, 0, limit/len(flowerTypeCount)+1)
			if err != nil {
				continue
			}

			for _, product := range products {
				productResponse := ToProductResponse(product, product.BasePrice)
				recommendations = append(recommendations, &dto.RecommendedProductDTO{
					Product:  productResponse,
					Score:    score,
					Reason:   "Based on your past purchases of " + flowerType,
					Category: "content_based",
				})
			}
		}
	}

	return recommendations, nil
}

// scoredProduct holds a product with its calculated score
type scoredProduct struct {
	product model.Product
	score   float64
}

func (s *recommendationService) getPopularityRecommendations(limit int) ([]*dto.RecommendedProductDTO, error) {
	// Get all products and sort by popularity metrics
	products, err := s.productRepo.GetAllProducts()
	if err != nil {
		return nil, err
	}

	// Calculate popularity score and store in separate structure
	var scoredProducts []scoredProduct
	for _, product := range products {
		score := 0.0
		if product.AverageRating > 0 {
			score += (product.AverageRating / 5.0) * 0.4
		}
		if product.ReviewCount > 0 {
			score += math.Min(float64(product.ReviewCount)/100.0, 1.0) * 0.3
		}
		if product.SalesRank > 0 && product.SalesRank <= 1000 {
			score += (1000.0 - float64(product.SalesRank)) / 1000.0 * 0.3
		}
		scoredProducts = append(scoredProducts, scoredProduct{
			product: product,
			score:   score,
		})
	}

	// Sort by calculated score
	sort.Slice(scoredProducts, func(i, j int) bool {
		return scoredProducts[i].score > scoredProducts[j].score
	})

	var recommendations []*dto.RecommendedProductDTO
	for i, sp := range scoredProducts {
		if i >= limit {
			break
		}

		productResponse := ToProductResponse(sp.product, sp.product.BasePrice)
		recommendations = append(recommendations, &dto.RecommendedProductDTO{
			Product:  productResponse,
			Score:    sp.score, // This is our calculated popularity score
			Reason:   "Popular among all customers",
			Category: "popular",
		})
	}

	return recommendations, nil
}

func (s *recommendationService) getTrendingRecommendations(period string, limit int) ([]*dto.RecommendedProductDTO, error) {
	trendingProducts, err := s.recommendationRepo.GetTrendingProducts(period, limit)
	if err != nil {
		return nil, err
	}

	var recommendations []*dto.RecommendedProductDTO
	for _, trending := range trendingProducts {
		product, err := s.productRepo.GetProductByID(trending.ProductID)
		if err != nil {
			continue
		}

		productResponse := ToProductResponse(*product, product.BasePrice)
		recommendations = append(recommendations, &dto.RecommendedProductDTO{
			Product:  productResponse,
			Score:    trending.TrendScore,
			Reason:   "Currently trending",
			Category: "trending",
		})
	}

	return recommendations, nil
}

func (s *recommendationService) mergeRecommendations(
	target map[uint]*dto.RecommendedProductDTO,
	source []*dto.RecommendedProductDTO,
	weight float64,
	category string,
) {
	for _, rec := range source {
		productID := rec.Product.ProductID
		if existing, exists := target[productID]; exists {
			// Combine scores
			existing.Score += rec.Score * weight
			existing.Reason += ", " + rec.Reason
		} else {
			// Add new recommendation
			newRec := *rec
			newRec.Score *= weight
			newRec.Category = category
			target[productID] = &newRec
		}
	}
}

func (s *recommendationService) sortAndLimitRecommendations(
	recommendations map[uint]*dto.RecommendedProductDTO,
	limit int,
) []dto.RecommendedProductDTO {
	// Convert to slice
	var recs []dto.RecommendedProductDTO
	for _, rec := range recommendations {
		recs = append(recs, *rec)
	}

	// Sort by score
	sort.Slice(recs, func(i, j int) bool {
		return recs[i].Score > recs[j].Score
	})

	// Limit results
	if len(recs) > limit {
		recs = recs[:limit]
	}

	return recs
}

// UpdateUserPreferences analyzes user behavior and updates preferences
func (s *recommendationService) UpdateUserPreferences(ctx context.Context, firebaseUID string) error {
	// Get user interactions
	interactions, err := s.recommendationRepo.GetUserInteractions(firebaseUID)
	if err != nil {
		return err
	}

	if len(interactions) == 0 {
		return nil // No interactions to analyze
	}

	// Analyze flower type preferences
	flowerPrefs := make(map[string]float64)
	occasionPrefs := make(map[string]float64)
	var totalSpent, minPrice, maxPrice float64
	priceCount := 0

	for _, interaction := range interactions {
		product, err := s.productRepo.GetProductByID(interaction.ProductID)
		if err != nil {
			continue
		}

		// Calculate preference score based on interaction strength
		prefScore := interaction.InteractionScore / 10.0 // Normalize
		if prefScore > 1.0 {
			prefScore = 1.0
		}

		flowerPrefs[product.FlowerType] += prefScore

		// Analyze price preferences from purchases
		if interaction.PurchaseCount > 0 {
			totalSpent += product.BasePrice * float64(interaction.PurchaseCount)
			priceCount += interaction.PurchaseCount
			
			if minPrice == 0 || product.BasePrice < minPrice {
				minPrice = product.BasePrice
			}
			if product.BasePrice > maxPrice {
				maxPrice = product.BasePrice
			}
		}

		// Get product occasions (simplified - would need to implement occasion fetching)
		// This is a placeholder for occasion preference analysis
	}

	// Normalize flower preferences
	var maxFlowerPref float64
	for _, pref := range flowerPrefs {
		if pref > maxFlowerPref {
			maxFlowerPref = pref
		}
	}
	if maxFlowerPref > 0 {
		for flowerType := range flowerPrefs {
			flowerPrefs[flowerType] /= maxFlowerPref
		}
	}

	// Calculate average spent
	var avgSpent float64
	if priceCount > 0 {
		avgSpent = totalSpent / float64(priceCount)
	}

	// Convert to JSON
	flowerPrefsJSON, _ := json.Marshal(flowerPrefs)
	occasionPrefsJSON, _ := json.Marshal(occasionPrefs)

	// Save preferences
	userPref := &model.UserPreference{
		FirebaseUID:       firebaseUID,
		FlowerPreferences: string(flowerPrefsJSON),
		OccasionPreferences: string(occasionPrefsJSON),
		PriceMin:            minPrice,
		PriceMax:            maxPrice,
		AverageSpent:        avgSpent,
		LastUpdated:         time.Now(),
	}

	return s.recommendationRepo.SaveUserPreferences(userPref)
}

// CalculateProductSimilarities computes and stores product similarities
func (s *recommendationService) CalculateProductSimilarities(ctx context.Context, productID uint) error {
	targetProduct, err := s.productRepo.GetProductByID(productID)
	if err != nil {
		return err
	}

	allProducts, err := s.productRepo.GetAllProducts()
	if err != nil {
		return err
	}

	for _, product := range allProducts {
		if product.ProductID == targetProduct.ProductID {
			continue
		}

		// Calculate content-based similarity
		similarity := s.calculateContentSimilarity(*targetProduct, product)
		
		if similarity >= s.config.MinSimilarity {
			productSim := &model.ProductSimilarity{
				ProductID1:      targetProduct.ProductID,
				ProductID2:      product.ProductID,
				SimilarityScore: similarity,
				SimilarityType:  "content",
				UpdatedAt:       time.Now(),
			}
			
			if err := s.recommendationRepo.SaveProductSimilarity(productSim); err != nil {
				continue // Continue with other products
			}
		}
	}

	return nil
}

func (s *recommendationService) calculateContentSimilarity(product1, product2 model.Product) float64 {
	similarity := 0.0
	
	// Flower type similarity (40% weight)
	if product1.FlowerType == product2.FlowerType {
		similarity += 0.4
	}
	
	// Price similarity (30% weight)
	priceDiff := math.Abs(product1.BasePrice - product2.BasePrice)
	maxPrice := math.Max(product1.BasePrice, product2.BasePrice)
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
		ratingDiff := math.Abs(product1.AverageRating - product2.AverageRating)
		ratingSimRatio := 1.0 - (ratingDiff / 5.0)
		similarity += ratingSimRatio * 0.1
	}
	
	return similarity
}

// UpdateTrendingProducts calculates and updates trending product data
func (s *recommendationService) UpdateTrendingProducts(ctx context.Context) error {
	// This would typically be run as a background job
	// For now, it's a simplified implementation
	
	products, err := s.productRepo.GetAllProducts()
	if err != nil {
		return err
	}

	var trendingProducts []model.TrendingProduct
	
	for _, product := range products {
		// Calculate trend score (simplified)
		trendScore := 0.0
		
		// Factor in recent sales (placeholder - would need actual sales data)
		if product.SalesRank > 0 && product.SalesRank <= 100 {
			trendScore += (100.0 - float64(product.SalesRank)) / 100.0 * 0.5
		}
		
		// Factor in ratings
		if product.AverageRating > 0 {
			trendScore += (product.AverageRating / 5.0) * 0.3
		}
		
		// Factor in review velocity (placeholder)
		if product.ReviewCount > 0 {
			trendScore += math.Min(float64(product.ReviewCount)/50.0, 1.0) * 0.2
		}
		
		if trendScore > 0.1 { // Only include products with meaningful trend scores
			trendingProducts = append(trendingProducts, model.TrendingProduct{
				ProductID:     product.ProductID,
				TrendScore:    trendScore,
				ViewCount:     0, // Would be populated from actual view data
				PurchaseCount: 0, // Would be populated from actual purchase data
				Period:        "weekly",
				UpdatedAt:     time.Now(),
			})
		}
	}
	
	return s.recommendationRepo.UpdateTrendingProducts(trendingProducts)
}

// RecordRecommendationFeedback persists user feedback on recommendations
func (s *recommendationService) RecordRecommendationFeedback(ctx context.Context, feedback *dto.RecommendationFeedbackDTO) error {
    if feedback == nil {
        return errors.New("feedback payload is required")
    }
    if feedback.FirebaseUID == "" {
        feedback.FirebaseUID = "anonymous"
    }
    return s.recommendationRepo.SaveRecommendationFeedback(feedback.FirebaseUID, feedback.ProductID, feedback.RecommendationType, feedback.Action)
}

// GetRecommendationStats retrieves basic analytics for recommendations
func (s *recommendationService) GetRecommendationStats(ctx context.Context, period string) (*dto.RecommendationStatsDTO, error) {
    statsMap, err := s.recommendationRepo.GetRecommendationStats(period)
    if err != nil {
        return nil, err
    }

    dtoStats := &dto.RecommendationStatsDTO{
        TotalRecommendations: 0,
        ClickThroughRate:     0,
        ConversionRate:       0,
        AverageScore:         0,
        TopPerformingType:    "",
    }

    if v, ok := statsMap["total_recommendations"]; ok {
        switch t := v.(type) {
        case int:
            dtoStats.TotalRecommendations = t
        case int64:
            dtoStats.TotalRecommendations = int(t)
        case float64:
            dtoStats.TotalRecommendations = int(t)
        }
    }

    return dtoStats, nil
}