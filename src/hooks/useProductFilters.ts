import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/config/api';

export interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

export interface ProductFilters {
  flower_types?: FilterOption[];
  occasions?: FilterOption[];
  price_ranges?: FilterOption[];
}

export function useProductFilters() {
  const [filters, setFilters] = useState<ProductFilters>({
    flower_types: [],
    occasions: [],
    price_ranges: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/products/filters`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required to view filters');
        } else if (res.status === 404) {
          throw new Error('Filters endpoint not found');
        } else {
          throw new Error(`Failed to fetch filters: HTTP ${res.status}`);
        }
      }

      const rawText = await res.text();
      let parsed;
      
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error('Invalid JSON response from filters API');
      }

      // Handle both direct response and wrapped response formats
      const filtersData = parsed.data || parsed;
      
      // Ensure safe property access with fallbacks
      setFilters({
        flower_types: Array.isArray(filtersData.flower_types) ? filtersData.flower_types : [],
        occasions: Array.isArray(filtersData.occasions) ? filtersData.occasions : [],
        price_ranges: Array.isArray(filtersData.price_ranges) ? filtersData.price_ranges : []
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(new Error(errorMessage));
      
      // Set default empty arrays on error
      setFilters({
        flower_types: [],
        occasions: [],
        price_ranges: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  return {
    filters,
    loading,
    error,
    refetch: fetchFilters
  };
}
