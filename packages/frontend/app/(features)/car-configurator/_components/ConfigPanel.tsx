'use client';

import { useState } from 'react';
import { CarConfiguration, ColorOption, WheelOption, InteriorOption, ExtraOption } from './types';
import ColorPicker from './ColorPicker';
import WheelSelector from './WheelSelector';
import InteriorSelector from './InteriorSelector';
import PriceCalculator from './PriceCalculator';

interface ConfigPanelProps {
  configuration: CarConfiguration;
  availableColors: ColorOption[];
  availableWheels: WheelOption[];
  availableInteriors: InteriorOption[];
  availableExtras: ExtraOption[];
  onColorChange: (color: ColorOption) => void;
  onWheelsChange: (wheels: WheelOption) => void;
  onInteriorChange: (interior: InteriorOption) => void;
  onExtrasChange: (extras: ExtraOption[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

/**
 * Configuration Panel Component
 * Main sidebar containing all configuration options and price calculator
 */
export default function ConfigPanel({
  configuration,
  availableColors,
  availableWheels,
  availableInteriors,
  availableExtras,
  onColorChange,
  onWheelsChange,
  onInteriorChange,
  onExtrasChange,
  onSave,
  isSaving = false,
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'customize' | 'extras'>('customize');

  // Handle extra option toggle
  const handleExtraToggle = (extra: ExtraOption) => {
    const isSelected = configuration.extras.some(e => e.id === extra.id);
    
    if (isSelected) {
      // Remove extra
      onExtrasChange(configuration.extras.filter(e => e.id !== extra.id));
    } else {
      // Add extra
      onExtrasChange([...configuration.extras, extra]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Configure Your Car</h2>
        <p className="text-sm text-gray-600 mt-1">{configuration.carModel}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('customize')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'customize'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
          `}
        >
          Customize
        </button>
        <button
          onClick={() => setActiveTab('extras')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors relative
            ${activeTab === 'extras'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
          `}
        >
          Extras
          {configuration.extras.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
              {configuration.extras.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'customize' ? (
          <>
            {/* Color Picker */}
            <ColorPicker
              colors={availableColors}
              selectedColorId={configuration.color.id}
              onColorChange={onColorChange}
            />

            {/* Wheel Selector */}
            <WheelSelector
              wheels={availableWheels}
              selectedWheelsId={configuration.wheels.id}
              onWheelsChange={onWheelsChange}
            />

            {/* Interior Selector */}
            <InteriorSelector
              interiors={availableInteriors}
              selectedInteriorId={configuration.interior.id}
              onInteriorChange={onInteriorChange}
            />
          </>
        ) : (
          <>
            {/* Extras Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Additional Options</h3>
              
              {/* Group extras by category */}
              {['technology', 'comfort', 'performance', 'safety'].map((category) => {
                const categoryExtras = availableExtras.filter(e => e.category === category);
                
                if (categoryExtras.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 capitalize">
                      {category}
                    </h4>
                    
                    {categoryExtras.map((extra) => {
                      const isSelected = configuration.extras.some(e => e.id === extra.id);
                      
                      return (
                        <button
                          key={extra.id}
                          onClick={() => handleExtraToggle(extra)}
                          className={`
                            w-full text-left p-4 rounded-lg border-2 transition-all
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <h5 className="font-medium text-gray-800">{extra.name}</h5>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 ml-6">
                                {extra.description}
                              </p>
                            </div>
                            <span className="ml-4 text-sm font-semibold text-blue-600">
                              +${extra.price.toLocaleString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Price Calculator */}
        <div className="pt-6 border-t border-gray-200">
          <PriceCalculator configuration={configuration} />
        </div>
      </div>

      {/* Footer - Save Button */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
            ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving Configuration...
            </span>
          ) : (
            'Save Configuration'
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-2">
          Your configuration will be saved to your account
        </p>
      </div>
    </div>
  );
}
