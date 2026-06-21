"use client";

import { useState, useEffect } from "react";
import CarViewer3D from "./_components/CarViewer3D";
import ConfigPanel from "./_components/ConfigPanel";
import {
  CarConfiguration,
  ColorOption,
  ExtraOption,
  ConfigurationOptions,
} from "./_components/types";

// Mock data for available options
const AVAILABLE_OPTIONS: ConfigurationOptions = {
  bodyColors: [
    { id: "yellow", name: "Neon Yellow", hex: "#FFFF00", price: 0 },
    { id: "black", name: "Midnight Black", hex: "#000000", price: 1500 },
    { id: "red", name: "Racing Red", hex: "#DC2626", price: 2000 },
    { id: "blue", name: "Ocean Blue", hex: "#2563EB", price: 1800 },
    { id: "silver", name: "Silver Metallic", hex: "#C0C0C0", price: 1200 },
    { id: "gray", name: "Storm Gray", hex: "#6B7280", price: 1000 },
  ],
  wheelColors: [
    { id: "black", name: "Glossy Black", hex: "#000000", price: 0 },
    { id: "silver", name: "Silver Chrome", hex: "#C0C0C0", price: 800 },
    { id: "gold", name: "Gold Metallic", hex: "#FFD700", price: 1200 },
  ],
  brakeColors: [
    { id: "red", name: "Racing Red", hex: "#DC2626", price: 0 },
    { id: "black", name: "Carbon Black", hex: "#000000", price: 500 },
    { id: "yellow", name: "Neon Yellow", hex: "#FFFF00", price: 700 },
  ],
  extras: [
    {
      id: "autopilot",
      name: "Advanced Autopilot",
      description: "Full self-driving capability with enhanced safety",
      price: 6000,
      category: "technology",
    },
    {
      id: "premium-audio",
      name: "Premium Audio System",
      description: "15-speaker surround sound system",
      price: 2500,
      category: "technology",
    },
    {
      id: "glass-roof",
      name: "Panoramic Glass Roof",
      description: "All-glass roof with UV protection",
      price: 1500,
      category: "comfort",
    },
    {
      id: "heated-seats",
      name: "Heated Seats (All)",
      description: "Heated front and rear seats",
      price: 800,
      category: "comfort",
    },
    {
      id: "performance-brakes",
      name: "Performance Brake Kit",
      description: "Carbon-ceramic brakes for superior stopping power",
      price: 4500,
      category: "performance",
    },
    {
      id: "sport-suspension",
      name: "Sport Suspension",
      description: "Adaptive air suspension with sport mode",
      price: 3000,
      category: "performance",
    },
    {
      id: "safety-plus",
      name: "Safety Plus Package",
      description: "Advanced collision avoidance and blind spot monitoring",
      price: 2000,
      category: "safety",
    },
    {
      id: "parking-assist",
      name: "Advanced Parking Assist",
      description: "360° camera and automated parking",
      price: 1200,
      category: "safety",
    },
  ],
};

// Base car model
const BASE_CAR = {
  carId: "pse-model-s",
  carModel: "PSE Model S",
  basePrice: 75000,
};

export default function CarConfiguratorPage() {
  const [configuration, setConfiguration] = useState<CarConfiguration>({
    ...BASE_CAR,
    bodyColor: AVAILABLE_OPTIONS.bodyColors[0],
    wheelColor: AVAILABLE_OPTIONS.wheelColors[0],
    brakeColor: AVAILABLE_OPTIONS.brakeColors[0],
    extras: [],
    totalPrice: BASE_CAR.basePrice,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Calculate total price whenever configuration changes
  useEffect(() => {
    const total =
      configuration.basePrice +
      configuration.bodyColor.price +
      configuration.wheelColor.price +
      configuration.brakeColor.price +
      configuration.extras.reduce((sum, extra) => sum + extra.price, 0);

    setConfiguration((prev) => ({ ...prev, totalPrice: total }));
  }, [
    configuration.basePrice,
    configuration.bodyColor.price,
    configuration.wheelColor.price,
    configuration.brakeColor.price,
    configuration.extras,
  ]);

  // Handle body color change
  const handleBodyColorChange = (color: ColorOption) => {
    setConfiguration((prev) => ({ ...prev, bodyColor: color }));
  };

  // Handle wheel color change
  const handleWheelColorChange = (color: ColorOption) => {
    setConfiguration((prev) => ({ ...prev, wheelColor: color }));
  };

  // Handle brake color change
  const handleBrakeColorChange = (color: ColorOption) => {
    setConfiguration((prev) => ({ ...prev, brakeColor: color }));
  };

  // Handle extras change
  const handleExtrasChange = (extras: ExtraOption[]) => {
    setConfiguration((prev) => ({ ...prev, extras }));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase  mb-2">
              3D Car Configurator
            </p>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight mb-2">
              Build Your Dream Car
            </h1>
            <p className="text-sm max-w-2xl">
              Customize your {configuration.carModel} with our interactive 3D
              configurator. Choose colors, wheels, interior packages, and
              additional options.
            </p>
            <p className="text-sm text-gray-400 italic">
              Use your mouse or touch to rotate the car and see your changes in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-10/12">
          {/* 3D Viewer - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 min-h-0">
            <div className="h-full rounded-lg overflow-hidden">
              <CarViewer3D
                bodyColor={configuration.bodyColor.hex}
                wheelColor={configuration.wheelColor.hex}
                brakeColor={configuration.brakeColor.hex}
                isLoading={false}
              />
            </div>
          </div>

          {/* Configuration Panel - Takes 1 column */}
          <div className="lg:col-span-1 min-h-0 overflow-hidden">
            <div className="h-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <ConfigPanel
                configuration={configuration}
                availableBodyColors={AVAILABLE_OPTIONS.bodyColors}
                availableWheelColors={AVAILABLE_OPTIONS.wheelColors}
                availableBrakeColors={AVAILABLE_OPTIONS.brakeColors}
                availableExtras={AVAILABLE_OPTIONS.extras}
                onBodyColorChange={handleBodyColorChange}
                onWheelColorChange={handleWheelColorChange}
                onBrakeColorChange={handleBrakeColorChange}
                onExtrasChange={handleExtrasChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
