"use client";

import { useState, useEffect, useMemo } from "react";
import { Car, CarFiltersState } from "./_components/types";
import { BACKEND_URL } from "../../_lib/api";
import CarGrid from "./_components/CarGrid";
import CarFilters from "./_components/CarFilters";
import CarDetailModal from "./_components/CarDetailModal";

export default function CarOverviewPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [filters, setFilters] = useState<CarFiltersState>({
    make: "",
    minYear: 2020,
    maxYear: new Date().getFullYear(),
    minPrice: 0,
    maxPrice: 500000,
    available: null,
  });

  // Fetch cars from backend
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${BACKEND_URL}/api/cars`);

        if (!response.ok) {
          throw new Error("Failed to fetch cars");
        }

        const data = await response.json();
        setCars(data.cars || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  // Get unique makes for filter
  const availableMakes = useMemo(() => {
    const makes = new Set(cars.map((car) => car.make));
    return Array.from(makes).sort();
  }, [cars]);

  // Filter cars based on current filters
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const price = parseFloat(car.basePrice);

      // Make filter
      if (filters.make && car.make !== filters.make) {
        return false;
      }

      // Year filter
      if (car.year < filters.minYear || car.year > filters.maxYear) {
        return false;
      }

      // Price filter
      if (price < filters.minPrice || price > filters.maxPrice) {
        return false;
      }

      // Availability filter
      if (filters.available !== null && car.available !== filters.available) {
        return false;
      }

      return true;
    });
  }, [cars, filters]);

  const handleCarClick = (car: Car) => {
    setSelectedCar(car);
  };

  const handleCloseModal = () => {
    setSelectedCar(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
          Feature Module
        </p>
        <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tight mb-4">
          Cars Overview
        </h1>
        <p className="text-zinc-400 text-base max-w-2xl leading-relaxed">
          Browse every model in our lineup. Compare technical specs, available
          trims, and configurations to find the car that fits your ambitions.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
          <p className="text-zinc-400 text-lg">Loading cars...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-red-400 font-semibold mb-1">
                Failed to load cars
              </h3>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="space-y-8">
          {/* Filters */}
          <CarFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableMakes={availableMakes}
          />

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-zinc-400">
              Showing{" "}
              <span className="text-white font-semibold">
                {filteredCars.length}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">{cars.length}</span>{" "}
              cars
            </p>
          </div>

          {/* Car Grid */}
          <CarGrid cars={filteredCars} onCarClick={handleCarClick} />
        </div>
      )}

      {/* Car Detail Modal */}
      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          isOpen={!!selectedCar}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

