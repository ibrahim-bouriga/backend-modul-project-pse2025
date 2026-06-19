"use client";

import { useState } from "react";
import { CarFiltersState } from "./types";

interface CarFiltersProps {
  filters: CarFiltersState;
  onFiltersChange: (filters: CarFiltersState) => void;
  availableMakes: string[];
}

export default function CarFilters({
  filters,
  onFiltersChange,
  availableMakes,
}: CarFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMakeChange = (make: string) => {
    onFiltersChange({ ...filters, make });
  };

  const handleMinYearChange = (minYear: number) => {
    onFiltersChange({ ...filters, minYear });
  };

  const handleMaxYearChange = (maxYear: number) => {
    onFiltersChange({ ...filters, maxYear });
  };

  const handleMinPriceChange = (minPrice: number) => {
    onFiltersChange({ ...filters, minPrice });
  };

  const handleMaxPriceChange = (maxPrice: number) => {
    onFiltersChange({ ...filters, maxPrice });
  };

  const handleAvailableChange = (available: boolean | null) => {
    onFiltersChange({ ...filters, available });
  };

  const handleReset = () => {
    onFiltersChange({
      make: "",
      minYear: 2020,
      maxYear: new Date().getFullYear(),
      minPrice: 0,
      maxPrice: 500000,
      available: null,
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filters Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-zinc-800 pt-6">
          {/* Make Filter */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Make
            </label>
            <select
              value={filters.make}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">All Makes</option>
              {availableMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Year Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">From</label>
                <input
                  type="number"
                  min="2020"
                  max={currentYear}
                  value={filters.minYear}
                  onChange={(e) => handleMinYearChange(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">To</label>
                <input
                  type="number"
                  min="2020"
                  max={currentYear}
                  value={filters.maxYear}
                  onChange={(e) => handleMaxYearChange(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Min</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={filters.minPrice}
                  onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Max</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={filters.maxPrice}
                  onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Availability
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleAvailableChange(null)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  filters.available === null
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleAvailableChange(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  filters.available === true
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Available
              </button>
              <button
                onClick={() => handleAvailableChange(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  filters.available === false
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Unavailable
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
