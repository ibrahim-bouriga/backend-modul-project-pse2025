'use client';

import { CarConfiguration } from './types';

interface PriceCalculatorProps {
  configuration: CarConfiguration;
}

/**
 * Price Calculator Component
 * Displays price breakdown and total for the car configuration
 */
export default function PriceCalculator({ configuration }: PriceCalculatorProps) {
  const { basePrice, color, extras, totalPrice } = configuration;

  // Calculate extras total
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Price Summary</h3>
      
      {/* Price Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {/* Base Price */}
        <div className="p-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-800">{configuration.carModel}</p>
            <p className="text-xs text-gray-500">Base Price</p>
          </div>
          <p className="font-semibold text-gray-800">
            ${basePrice.toLocaleString()}
          </p>
        </div>

        {/* Color */}
        {color.price > 0 && (
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              <div>
                <p className="text-sm font-medium text-gray-700">{color.name}</p>
                <p className="text-xs text-gray-500">Exterior Color</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-blue-600">
              +${color.price.toLocaleString()}
            </p>
          </div>
        )}

        {/* Extras */}
        {extras.length > 0 && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Additional Options</p>
                <p className="text-xs text-gray-500">{extras.length} item(s)</p>
              </div>
              <p className="text-sm font-semibold text-blue-600">
                +${extrasTotal.toLocaleString()}
              </p>
            </div>
            <div className="mt-2 space-y-1">
              {extras.map((extra) => (
                <div key={extra.id} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">• {extra.name}</span>
                  <span className="text-gray-500">+${extra.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total Price */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90">Total Price</p>
            <p className="text-xs opacity-75 mt-1">Including all options</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              ${totalPrice.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Financing Info */}
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-600">
          Estimated monthly payment: <span className="font-semibold text-gray-800">
            ${Math.round(totalPrice / 60).toLocaleString()}/mo
          </span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Based on 60-month financing at 4.9% APR
        </p>
      </div>
    </div>
  );
}
