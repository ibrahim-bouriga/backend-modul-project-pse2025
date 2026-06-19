"use client";

import { Car } from "./types";
import CarCard from "./CarCard";

interface CarGridProps {
  cars: Car[];
  onCarClick: (car: Car) => void;
}

export default function CarGrid({ cars, onCarClick }: CarGridProps) {
  if (cars.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-16 h-16 text-zinc-700 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-zinc-400 mb-2">
          No cars found
        </h3>
        <p className="text-zinc-500">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} onClick={() => onCarClick(car)} />
      ))}
    </div>
  );
}
