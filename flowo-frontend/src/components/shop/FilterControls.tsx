import React from 'react';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface FilterControlsProps {
  filters: {
    flowerTypes: FilterOption[];
    occasions: FilterOption[];
    priceRanges: FilterOption[];
  };
  selectedFilters: {
    flowerTypes: string[];
    occasions: string[];
    priceRange: string | null;
  };
  onFilterChange: (filterType: string, value: string, checked: boolean) => void;
  onPriceRangeChange: (value: string | null) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export default function FilterControls({
  filters,
  selectedFilters,
  onFilterChange,
  onPriceRangeChange,
  onClearFilters,
  isLoading = false
}: FilterControlsProps) {
  const hasActiveFilters = 
    selectedFilters.flowerTypes.length > 0 ||
    selectedFilters.occasions.length > 0 ||
    selectedFilters.priceRange !== null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#2d5016]">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-[#e91e63] hover:text-[#c2185b] font-medium focus:outline-none focus:ring-2 focus:ring-[#e91e63] focus:ring-offset-2 rounded px-2 py-1"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Flower Types */}
      <div className="mb-6">
        <h3 className="font-semibold text-[#2d5016] mb-3">Flower Types</h3>
        <div className="space-y-2">
          {filters.flowerTypes.map((type) => (
            <label key={type.id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.flowerTypes.includes(type.id)}
                onChange={(e) => onFilterChange('flowerTypes', type.id, e.target.checked)}
                className="rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63] focus:ring-offset-0"
              />
              <span className="ml-2 text-gray-700">
                {type.name}
                {type.count && (
                  <span className="text-gray-500 text-sm ml-1">({type.count})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Occasions */}
      <div className="mb-6">
        <h3 className="font-semibold text-[#2d5016] mb-3">Occasions</h3>
        <div className="space-y-2">
          {filters.occasions.map((occasion) => (
            <label key={occasion.id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.occasions.includes(occasion.id)}
                onChange={(e) => onFilterChange('occasions', occasion.id, e.target.checked)}
                className="rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63] focus:ring-offset-0"
              />
              <span className="ml-2 text-gray-700">
                {occasion.name}
                {occasion.count && (
                  <span className="text-gray-500 text-sm ml-1">({occasion.count})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="font-semibold text-[#2d5016] mb-3">Price Range</h3>
        <div className="space-y-2">
          {filters.priceRanges.map((range) => (
            <label key={range.id} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                checked={selectedFilters.priceRange === range.id}
                onChange={() => onPriceRangeChange(range.id)}
                className="border-gray-300 text-[#e91e63] focus:ring-[#e91e63] focus:ring-offset-0"
              />
              <span className="ml-2 text-gray-700">
                {range.name}
                {range.count && (
                  <span className="text-gray-500 text-sm ml-1">({range.count})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
