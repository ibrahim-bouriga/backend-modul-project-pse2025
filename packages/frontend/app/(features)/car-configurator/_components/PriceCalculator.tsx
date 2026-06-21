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
  const { basePrice, bodyColor, wheelColor, brakeColor, extras, totalPrice } = configuration;

  // Calculate extras total
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);

  return (
    <div className="space-y-4">
      {/* Total Price */}
      <div className="bg-linear-to-r rounded-lg">
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
    </div>
  );
}
