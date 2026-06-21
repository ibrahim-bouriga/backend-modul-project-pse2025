'use client';

import { useState, useEffect } from 'react';
import CarViewer3D from './_components/CarViewer3D';
import ConfigPanel from './_components/ConfigPanel';
import {
  CarConfiguration,
  ColorOption,
  ExtraOption,
  ConfigurationOptions,

} from './_components/types';

// Mock data for available options
const AVAILABLE_OPTIONS: ConfigurationOptions = {
  colors: [
    { id: 'yellow', name: 'Neon Yellow', hex: '#FFFF00', price: 0 },
    { id: 'black', name: 'Midnight Black', hex: '#000000', price: 1500 },
    { id: 'red', name: 'Racing Red', hex: '#DC2626', price: 2000 },
    { id: 'blue', name: 'Ocean Blue', hex: '#2563EB', price: 1800 },
    { id: 'silver', name: 'Silver Metallic', hex: '#C0C0C0', price: 1200 },
    { id: 'gray', name: 'Storm Gray', hex: '#6B7280', price: 1000 },
  ],
  extras: [
    {
      id: 'autopilot',
      name: 'Advanced Autopilot',
      description: 'Full self-driving capability with enhanced safety',
      price: 6000,
      category: 'technology',
    },
    {
      id: 'premium-audio',
      name: 'Premium Audio System',
      description: '15-speaker surround sound system',
      price: 2500,
      category: 'technology',
    },
    {
      id: 'glass-roof',
      name: 'Panoramic Glass Roof',
      description: 'All-glass roof with UV protection',
      price: 1500,
      category: 'comfort',
    },
    {
      id: 'heated-seats',
      name: 'Heated Seats (All)',
      description: 'Heated front and rear seats',
      price: 800,
      category: 'comfort',
    },
    {
      id: 'performance-brakes',
      name: 'Performance Brake Kit',
      description: 'Carbon-ceramic brakes for superior stopping power',
      price: 4500,
      category: 'performance',
    },
    {
      id: 'sport-suspension',
      name: 'Sport Suspension',
      description: 'Adaptive air suspension with sport mode',
      price: 3000,
      category: 'performance',
    },
    {
      id: 'safety-plus',
      name: 'Safety Plus Package',
      description: 'Advanced collision avoidance and blind spot monitoring',
      price: 2000,
      category: 'safety',
    },
    {
      id: 'parking-assist',
      name: 'Advanced Parking Assist',
      description: '360° camera and automated parking',
      price: 1200,
      category: 'safety',
    },
  ],
};

// Base car model
const BASE_CAR = {
  carId: 'pse-model-s',
  carModel: 'PSE Model S',
  basePrice: 75000,
};

export default function CarConfiguratorPage() {
  const [configuration, setConfiguration] = useState<CarConfiguration>({
    ...BASE_CAR,
    color: AVAILABLE_OPTIONS.colors[0],
    extras: [],
    totalPrice: BASE_CAR.basePrice,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculate total price whenever configuration changes
  useEffect(() => {
    const total =
      configuration.basePrice +
      configuration.color.price +
      configuration.extras.reduce((sum, extra) => sum + extra.price, 0);

    setConfiguration((prev) => ({ ...prev, totalPrice: total }));
  }, [
    configuration.basePrice,
    configuration.color.price,
    configuration.extras,
  ]);

  // Handle color change
  const handleColorChange = (color: ColorOption) => {
    setConfiguration((prev) => ({ ...prev, color }));
  };

  // Handle extras change
  const handleExtrasChange = (extras: ExtraOption[]) => {
    setConfiguration((prev) => ({ ...prev, extras }));
  };
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase  mb-2">
              3D Car Configurator
            </p>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight mb-2">
              Build Your Dream Car
            </h1>
            <p className="text-sm max-w-2xl">
              Customize your {configuration.carModel} with our interactive 3D configurator.
              Choose colors, wheels, interior packages, and additional options.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Viewer - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
              <CarViewer3D
                color={configuration.color.hex}
                isLoading={false}
              />
            </div>
            
            {/* Controls Info */}
            <div className="mt-4 bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
              <h3 className="text-sm font-semibold mb-2">3D Controls</h3>
              <ul className="text-xs space-y-1">
                <li>• <strong>Rotate:</strong> Click and drag</li>
                <li>• <strong>Zoom:</strong> Scroll or pinch</li>
                <li>• <strong>Pan:</strong> Right-click and drag (or two-finger drag on mobile)</li>
              </ul>
            </div>
          </div>

          {/* Configuration Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800">
              <ConfigPanel
                configuration={configuration}
                availableColors={AVAILABLE_OPTIONS.colors}
                availableExtras={AVAILABLE_OPTIONS.extras}
                onColorChange={handleColorChange}
                onExtrasChange={handleExtrasChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
