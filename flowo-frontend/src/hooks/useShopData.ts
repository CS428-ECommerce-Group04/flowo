import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/config/api';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  base_price?: number;
  effective_price?: number;
  slug: string;
  tags?: string[];
}

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface Filters {
  flowerTypes: FilterOption[];
  occasions: FilterOption[];
  priceRanges: FilterOption[];
}

interface SearchParams {
  page?: number;
  limit?: number;
  flowerTypes?: string[];
  occasions?: string[];
  priceRange?: string | null;
  search?: string;
}

interface SearchResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export function useShopData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>({
    flowerTypes: [],
    occasions: [],
    priceRanges: []
  });
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  // Fetch filters
  const fetchFilters = useCallback(async () => {
    setFiltersLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/products/filters`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        credentials: 'include',
      });

      if (res.status === 200) {
        const rawText = await res.text();
        let parsed;
        
        try {
          parsed = JSON.parse(rawText);
        } catch {
          throw new Error('Invalid JSON response from filters API');
        }

        const filtersData = parsed.data || parsed;
        setFilters(filtersData);
        return;
      }

      if (res.status === 401) {
        throw new Error('Authentication required to view filters');
      }

      if (res.status === 404) {
        throw new Error('Filters endpoint not found');
      }

      try {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
      } catch {
        throw new Error(`Failed to fetch filters: HTTP ${res.status}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(new Error(errorMessage));
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  // Fetch products with search/filter params
  const fetchProducts = useCallback(async (params: SearchParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', params.search);
      if (params.flowerTypes?.length) {
        params.flowerTypes.forEach(type => searchParams.append('flowerTypes', type));
      }
      if (params.occasions?.length) {
        params.occasions.forEach(occasion => searchParams.append('occasions', occasion));
      }
      if (params.priceRange) searchParams.append('priceRange', params.priceRange);

      const url = `${API_CONFIG.BASE_URL}/api/v1/products/search?${searchParams.toString()}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
        credentials: 'include',
      });

      if (res.status === 200) {
        const rawText = await res.text();
        let parsed: SearchResponse;
        
        try {
          parsed = JSON.parse(rawText);
        } catch {
          throw new Error('Invalid JSON response from search API');
        }

        const responseData = parsed.data || parsed;
        setProducts(responseData.products || []);
        setPagination({
          page: responseData.page || 1,
          totalPages: responseData.totalPages || 1,
          total: responseData.total || 0
        });
        return;
      }

      if (res.status === 401) {
        throw new Error('Authentication required to search products');
      }

      if (res.status === 404) {
        throw new Error('Search endpoint not found');
      }

      try {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
      } catch {
        throw new Error(`Failed to search products: HTTP ${res.status}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(new Error(errorMessage));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFilters();
    fetchProducts({ page: 1, limit: 12 });
  }, [fetchFilters, fetchProducts]);

  return {
    products,
    filters,
    loading,
    filtersLoading,
    error,
    pagination,
    fetchProducts,
    refetch: () => {
      fetchFilters();
      fetchProducts({ page: 1, limit: 12 });
    }
  };
}
