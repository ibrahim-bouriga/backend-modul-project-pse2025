"use client";

import { Car, CarConfiguration } from "./types";
import { useState } from "react";
import ConfigurationSelector from "./ConfigurationSelector";

interface CarDetailModalProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
}

export default function CarDetailModal({
  car,
  isOpen,
  onClose,
}: CarDetailModalProps) {
  const [selectedConfig, setSelectedConfig] =
    useState<CarConfiguration | null>(null);

  if (!isOpen) return null;

  const basePrice = parseFloat(car.basePrice);
  const configPrice = selectedConfig ? parseFloat(selectedConfig.price) : 0;
  const totalPrice = basePrice + configPrice;

  const formattedBasePrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(basePrice);

  const formattedTotalPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalPrice);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-2 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Car Image */}
          <div className="relative w-full h-64 md:h-96 bg-zinc-800">
            {car.imageUrl ? (
              <img
                src={car.imageUrl}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-zinc-700"
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
              <div className="absolute top-4 left-4">
                <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Unavailable
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-1">
                    {car.make} {car.model}
                  </h2>
                  <p className="text-zinc-500 text-lg">{car.year}</p>
                </div>
              </div>
              <p className="text-zinc-300 leading-relaxed">{car.description}</p>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Specifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Horsepower
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {car.specs.horsepower} HP
                  </p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    0-60 MPH
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {car.specs.acceleration}s
                  </p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Top Speed
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {car.specs.topSpeed} mph
                  </p>
                </div>
                {car.specs.range && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      Range
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {car.specs.range} mi
                    </p>
                  </div>
                )}
                {car.specs.torque && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      Torque
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {car.specs.torque} lb-ft
                    </p>
                  </div>
                )}
                {car.specs.weight && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      Weight
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {car.specs.weight} lbs
                    </p>
                  </div>
                )}
                {car.specs.batteryCapacity && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      Battery
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {car.specs.batteryCapacity} kWh
                    </p>
                  </div>
                )}
                {car.specs.chargingTime && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      Charging
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {car.specs.chargingTime}h
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Selector */}
            <div className="border-t border-zinc-800 pt-6">
              <ConfigurationSelector
                carId={car.id}
                onConfigurationSelect={setSelectedConfig}
              />
            </div>

            {/* Pricing Summary */}
            <div className="bg-zinc-800 rounded-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Base Price</span>
                <span className="text-white font-semibold">
                  {formattedBasePrice}
                </span>
              </div>
              {selectedConfig && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Configuration</span>
                  <span className="text-white font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(configPrice)}
                  </span>
                </div>
              )}
              <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
                <span className="text-white font-bold text-lg">
                  Total Price
                </span>
                <span className="text-white font-black text-2xl">
                  {formattedTotalPrice}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
              {car.available && (
                <button className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-lg transition-colors">
                  Configure & Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
