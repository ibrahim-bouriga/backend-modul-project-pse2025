"use client";

import { Car } from "./types";
import Image from "next/image";

interface CarCardProps {
  car: Car;
  onClick: () => void;
}

export default function CarCard({ car, onClick }: CarCardProps) {
  const price = parseFloat(car.basePrice);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <div
      onClick={onClick}
      className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden cursor-pointer transition-all duration-300 hover:border-zinc-600 hover:shadow-xl hover:shadow-zinc-900/50 hover:-translate-y-1"
    >
      {/* Car Image */}
      <div className="relative w-full h-48 bg-zinc-800 overflow-hidden">
        {car.imageUrl ? (
          <Image
            src={car.imageUrl}
            alt={`${car.make} ${car.model}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-zinc-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
        )}
        {!car.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Car Details */}
      <div className="p-5 space-y-3">
        {/* Make & Model */}
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-zinc-100 transition-colors">
            {car.make} {car.model}
          </h3>
          <p className="text-sm text-zinc-500">{car.year}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
          {car.description}
        </p>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">HP</p>
            <p className="text-sm font-semibold text-white">
              {car.specs.horsepower}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              0-60
            </p>
            <p className="text-sm font-semibold text-white">
              {car.specs.acceleration}s
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Top Speed
            </p>
            <p className="text-sm font-semibold text-white">
              {car.specs.topSpeed} mph
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Starting at
          </p>
          <p className="text-2xl font-black text-white">{formattedPrice}</p>
        </div>

        {/* CTA */}
        <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 group-hover:bg-zinc-700">
          View Details
        </button>
      </div>
    </div>
  );
}
