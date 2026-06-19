'use client';

import { useState, useEffect } from 'react';
import CarViewer3D from './_components/CarViewer3D';
import ConfigPanel from './_components/ConfigPanel';
import {
  CarConfiguration,
  ColorOption,
  WheelOption,
  InteriorOption,
  ExtraOption,
  ConfigurationOptions,
} from './_components/types';

// Mock data for available options
const AVAILABLE_OPTIONS: ConfigurationOptions = {
  colors: [
    { id: 'white', name: 'Arctic White', hex: '#FFFFFF', price: 0 },
    { id: 'black', name: 'Midnight Black', hex: '#000000', price: 1500 },
    { id: 'red', name: 'Racing Red', hex: '#DC2626', price: 2000 },
    { id: 'blue', name: 'Ocean Blue', hex: '#2563EB', price: 1800 },
    { id: 'silver', name: 'Silver Metallic', hex: '#C0C0C0', price: 1200 },
    { id: 'gray', name: 'Storm Gray', hex: '#6B7280', price: 1000 },
  ],
  wheels: [
    {
      id: 'standard',
      name: '18" Standard Alloy',
      description: 'Classic design with excellent durability',
      price: 0,
    },
    {
      id: 'sport',
      name: '20" Sport Performance',
      description: 'Lightweight forged wheels for enhanced handling',
      price: 3500,
    },
    {
      id: 'luxury',
      name: '21" Luxury Chrome',
      description: 'Premium chrome finish with diamond-cut details',
      price: 5000,
    },
  ],
  interiors: [
    {
      id: 'standard',
      name: 'Standard Interior',
      description: 'Comfortable cloth seats with basic features',
      features: [
        'Cloth upholstery',
        'Manual seat adjustment',
        'Standard audio system',
        'Air conditioning',
      ],
      price: 0,
    },
    {
      id: 'premium',
      name: 'Premium Interior',
      description: 'Leather seats with enhanced comfort features',
      features: [
        'Leather upholstery',
        'Power-adjustable seats',
        'Premium audio system',
        'Dual-zone climate control',
        'Ambient lighting',
      ],
      price: 4500,
    },
    {
      id: 'luxury',
      name: 'Luxury Interior',
      description: 'Top-tier materials with advanced technology',
      features: [
        'Nappa leather upholstery',
        'Heated & ventilated seats',
        'Premium surround sound',
        'Tri-zone climate control',
        'Ambient lighting (64 colors)',
        'Massage function',
      ],
      price: 8500,
    },
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
    wheels: AVAILABLE_OPTIONS.wheels[0],
    interior: AVAILABLE_OPTIONS.interiors[0],
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
      configuration.wheels.price +
      configuration.interior.price +
      configuration.extras.reduce((sum, extra) => sum + extra.price, 0);

    setConfiguration((prev) => ({ ...prev, totalPrice: total }));
  }, [
    configuration.basePrice,
    configuration.color.price,
    configuration.wheels.price,
    configuration.interior.price,
    configuration.extras,
  ]);

  // Handle color change
  const handleColorChange = (color: ColorOption) => {
    setConfiguration((prev) => ({ ...prev, color }));
  };

  // Handle wheels change
  const handleWheelsChange = (wheels: WheelOption) => {
    setConfiguration((prev) => ({ ...prev, wheels }));
  };

  // Handle interior change
  const handleInteriorChange = (interior: InteriorOption) => {
    setConfiguration((prev) => ({ ...prev, interior }));
  };

  // Handle extras change
  const handleExtrasChange = (extras: ExtraOption[]) => {
    setConfiguration((prev) => ({ ...prev, extras }));
  };

  // Save configuration to backend
  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/cars/${configuration.carId}/configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: {
            colorId: configuration.color.id,
            wheelsId: configuration.wheels.id,
            interiorId: configuration.interior.id,
            extraIds: configuration.extras.map(e => e.id),
          },
          totalPrice: configuration.totalPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const data = await response.json();
      
      setSaveMessage({
        type: 'success',
        text: `Configuration saved successfully! Total: $${configuration.totalPrice.toLocaleString()}`,
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save configuration. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 mb-2">
              3D Car Configurator
            </p>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight mb-2">
              Build Your Dream Car
            </h1>
            <p className="text-gray-600 text-sm max-w-2xl">
              Customize your {configuration.carModel} with our interactive 3D configurator.
              Choose colors, wheels, interior packages, and additional options.
            </p>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`
              p-4 rounded-lg flex items-center justify-between
              ${saveMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
            `}
          >
            <div className="flex items-center gap-3">
              {saveMessage.type === 'success' ? (
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {saveMessage.text}
              </p>
            </div>
            <button
              onClick={() => setSaveMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Viewer - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
              <CarViewer3D
                color={configuration.color.hex}
                wheelsId={configuration.wheels.id}
                isLoading={false}
              />
            </div>
            
            {/* Controls Info */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">3D Controls</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Rotate:</strong> Click and drag</li>
                <li>• <strong>Zoom:</strong> Scroll or pinch</li>
                <li>• <strong>Pan:</strong> Right-click and drag (or two-finger drag on mobile)</li>
              </ul>
            </div>
          </div>

          {/* Configuration Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
              <ConfigPanel
                configuration={configuration}
                availableColors={AVAILABLE_OPTIONS.colors}
                availableWheels={AVAILABLE_OPTIONS.wheels}
                availableInteriors={AVAILABLE_OPTIONS.interiors}
                availableExtras={AVAILABLE_OPTIONS.extras}
                onColorChange={handleColorChange}
                onWheelsChange={handleWheelsChange}
                onInteriorChange={handleInteriorChange}
                onExtrasChange={handleExtrasChange}
                onSave={handleSaveConfiguration}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
