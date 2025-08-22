import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/store/cart';
import { FlowerCard } from '@/components/FlowerCard';
import FilterControls from '@/components/shop/FilterControls';
import { useShopData } from '@/hooks/useShopData';

export default function Shop() {
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const { products, filters, loading, filtersLoading, error, pagination, fetchProducts } = useShopData();
  
  const [selectedFilters, setSelectedFilters] = useState({
    flowerTypes: [] as string[],
    occasions: [] as string[],
    priceRange: null as string | null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'flowerTypes') {
        if (checked) {
          newFilters.flowerTypes = [...prev.flowerTypes, value];
        } else {
          newFilters.flowerTypes = prev.flowerTypes.filter(id => id !== value);
        }
      } else if (filterType === 'occasions') {
        if (checked) {
          newFilters.occasions = [...prev.occasions, value];
        } else {
          newFilters.occasions = prev.occasions.filter(id => id !== value);
        }
      }
      
      return newFilters;
    });
    setCurrentPage(1);
  }, []);

  const handlePriceRangeChange = useCallback((value: string | null) => {
    setSelectedFilters(prev => ({ ...prev, priceRange: value }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedFilters({
      flowerTypes: [],
      occasions: [],
      priceRange: null
    });
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Fetch products when filters change
  React.useEffect(() => {
    fetchProducts({
      page: currentPage,
      limit: 6,
      search: searchQuery || undefined,
      flowerTypes: selectedFilters.flowerTypes.length > 0 ? selectedFilters.flowerTypes : undefined,
      occasions: selectedFilters.occasions.length > 0 ? selectedFilters.occasions : undefined,
      priceRange: selectedFilters.priceRange || undefined
    });
  }, [fetchProducts, currentPage, searchQuery, selectedFilters]);

  const handleAddToCart = useCallback((product: any) => {
    add({
      id: product.id,
      name: product.name,
      price: product.effective_price ?? product.price,
      qty: 1,
      image: product.image,
      description: product.description,
      tags: product.tags,
    });
  }, [add]);

  const handleViewDetails = useCallback((product: any) => {
    navigate(`/products/${product.slug}`);
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#fefefe] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error loading shop: {error.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#2d5016] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1e3a0f] transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefefe]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2d5016] mb-4">
            Fresh Flowers Collection
          </h1>
          <p className="text-xl text-[#666666] max-w-2xl mx-auto">
            Discover our beautiful selection of handpicked flowers, perfect for every occasion and moment that matters.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search flowers..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5016] focus:border-transparent"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FilterControls
              filters={filters}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onPriceRangeChange={handlePriceRangeChange}
              onClearFilters={handleClearFilters}
              isLoading={filtersLoading}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-[#666666]">
                {loading ? (
                  <span>Loading products...</span>
                ) : (
                  <span>
                    Showing {products.length} of {pagination.total} products
                    {searchQuery && ` for "${searchQuery}"`}
                  </span>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                    <div className="w-full h-64 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-10 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#666666] text-lg mb-4">
                  No products found matching your criteria.
                </div>
                <button
                  onClick={handleClearFilters}
                  className="text-[#e91e63] hover:text-[#c2185b] font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
                    <FlowerCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2d5016] focus:ring-offset-2"
                    >
                      Previous
                    </button>
                    
                    <span className="text-[#666666]">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2d5016] focus:ring-offset-2"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
