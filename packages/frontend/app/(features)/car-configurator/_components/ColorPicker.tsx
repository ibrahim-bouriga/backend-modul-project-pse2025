'use client';

import { ColorOption } from './types';

interface ColorPickerProps {
  colors: ColorOption[];
  selectedColorId: string;
  onColorChange: (color: ColorOption) => void;
}

/**
 * Color Picker Component
 * Displays color swatches for car exterior selection
 */
export default function ColorPicker({ colors, selectedColorId, onColorChange }: ColorPickerProps) {
  return (
    <div className="mb-3">
      
      <div className="grid grid-cols-3 gap-3">
        {colors.map((color) => {
          const isSelected = color.id === selectedColorId;
          
          return (
            <button
              key={color.id}
              onClick={() => onColorChange(color)}
              className={`
                relative group flex flex-col items-center p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-400 bg-zinc-800 shadow-md' 
                  : 'border-zinc-700 hover:border-zinc-600 hover:shadow-sm'
                }
              `}
              aria-label={`Select ${color.name} color`}
            >
              {/* Color Swatch */}
              <div 
                className={`
                  w-12 h-12 rounded-full border-2 border-zinc-600 shadow-inner
                  ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900' : ''}
                `}
                style={{ backgroundColor: color.hex }}
              />
              
              {/* Color Name */}
              <span className="mt-2 text-xs font-medium text-gray-200 text-center">
                {color.name}
              </span>
              
              {/* Price Badge */}
              {color.price > 0 && (
                <span className="mt-1 text-xs text-gray-400">
                  +${color.price.toLocaleString()}
                </span>
              )}
              
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <svg 
                    className="w-5 h-5 text-blue-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
