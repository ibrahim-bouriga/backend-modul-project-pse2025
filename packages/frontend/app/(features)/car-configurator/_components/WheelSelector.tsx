'use client';

import { WheelOption } from './types';

interface WheelSelectorProps {
  wheels: WheelOption[];
  selectedWheelsId: string;
  onWheelsChange: (wheels: WheelOption) => void;
}

/**
 * Wheel Selector Component
 * Displays wheel style options for the car
 */
export default function WheelSelector({ wheels, selectedWheelsId, onWheelsChange }: WheelSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Wheel Style</h3>
      
      <div className="space-y-2">
        {wheels.map((wheel) => {
          const isSelected = wheel.id === selectedWheelsId;
          
          return (
            <button
              key={wheel.id}
              onClick={() => onWheelsChange(wheel)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
              aria-label={`Select ${wheel.name} wheels`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Wheel Name */}
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800">{wheel.name}</h4>
                    {isSelected && (
                      <svg 
                        className="w-5 h-5 text-blue-500" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    )}
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-1">
                    {wheel.description}
                  </p>
                </div>
                
                {/* Price */}
                <div className="ml-4 text-right">
                  {wheel.price > 0 ? (
                    <span className="text-sm font-semibold text-blue-600">
                      +${wheel.price.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Included</span>
                  )}
                </div>
              </div>
              
              {/* Visual Indicator (Simple wheel icon) */}
              <div className="mt-3 flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full border-4 flex items-center justify-center
                  ${wheel.id === 'sport' ? 'border-gray-900 bg-gray-800' : ''}
                  ${wheel.id === 'luxury' ? 'border-gray-400 bg-gray-300' : ''}
                  ${wheel.id === 'standard' ? 'border-gray-600 bg-gray-500' : ''}
                `}>
                  <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                </div>
                <span className="text-xs text-gray-500">Preview</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
