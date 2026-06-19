'use client';

import { InteriorOption } from './types';

interface InteriorSelectorProps {
  interiors: InteriorOption[];
  selectedInteriorId: string;
  onInteriorChange: (interior: InteriorOption) => void;
}

/**
 * Interior Selector Component
 * Displays interior package options for the car
 */
export default function InteriorSelector({ 
  interiors, 
  selectedInteriorId, 
  onInteriorChange 
}: InteriorSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Interior Package</h3>
      
      <div className="space-y-3">
        {interiors.map((interior) => {
          const isSelected = interior.id === selectedInteriorId;
          
          return (
            <button
              key={interior.id}
              onClick={() => onInteriorChange(interior)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
              aria-label={`Select ${interior.name} interior`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800">{interior.name}</h4>
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
                
                {/* Price */}
                <div className="text-right">
                  {interior.price > 0 ? (
                    <span className="text-sm font-semibold text-blue-600">
                      +${interior.price.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Included</span>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">
                {interior.description}
              </p>
              
              {/* Features List */}
              <div className="space-y-1">
                {interior.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <svg 
                      className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
