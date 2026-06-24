'use client';

import { useState } from 'react';
import { CarConfiguration, ColorOption, TintOption, ExtraOption } from './types';
import ColorPicker from './ColorPicker';
import PriceCalculator from './PriceCalculator';

interface ConfigPanelProps {
  configuration: CarConfiguration;
  availableBodyColors: ColorOption[];
  availableWheelColors: ColorOption[];
  availableBrakeColors: ColorOption[];
  availableTints: TintOption[];
  availableExtras: ExtraOption[];
  onBodyColorChange: (color: ColorOption) => void;
  onWheelColorChange: (color: ColorOption) => void;
  onBrakeColorChange: (color: ColorOption) => void;
  onTintChange: (tint: TintOption) => void;
  onExtrasChange: (extras: ExtraOption[]) => void;
}

/**
 * Configuration Panel Component
 * Main sidebar containing all configuration options and price calculator
 */
export default function ConfigPanel({
  configuration,
  availableBodyColors,
  availableWheelColors,
  availableBrakeColors,
  availableTints,
  availableExtras,
  onBodyColorChange,
  onWheelColorChange,
  onBrakeColorChange,
  onTintChange,
  onExtrasChange,
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-2xl font-bold text-gray-100">Configure Your Car</h2>
        <p className="text-sm mt-1 text-gray-400">{configuration.carModel}</p>
        <PriceCalculator configuration={configuration} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('customize')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'customize'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800'
              : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
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
              ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800'
              : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
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
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-6 space-y-6">
        {activeTab === 'customize' ? (
          <>
            {/* Body Color Picker */}
            <p className="text-lg mt-2 mb-0! font-semibold text-gray-100">Exterior Color</p>
            <ColorPicker
              colors={availableBodyColors}
              selectedColorId={configuration.bodyColor.id}
              onColorChange={onBodyColorChange}
            />

            {/* Wheel Color Picker */}
            <h3 className="text-lg mt-2 mb-0! font-semibold text-gray-100">Wheel Color</h3>
            <ColorPicker
              colors={availableWheelColors}
              selectedColorId={configuration.wheelColor.id}
              onColorChange={onWheelColorChange}
            />

            {/* Brake Color Picker */}
            <h3 className="text-lg mt-2 mb-0! font-semibold text-gray-100">Brake Color</h3>
            <ColorPicker
              colors={availableBrakeColors}
              selectedColorId={configuration.brakeColor.id}
              onColorChange={onBrakeColorChange}
            />

            {/* Window Tint Picker */}
            <h3 className="text-lg mt-2 mb-0! font-semibold text-gray-100">Window Tint</h3>
            <ColorPicker
              colors={availableTints}
              selectedColorId={configuration.tint.id}
              onColorChange={onTintChange}
            />
          </>
        ) : (
          <>
            {/* Extras Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-100">Additional Options</h3>
              
              {/* Group extras by category */}
              {['technology', 'comfort', 'performance', 'safety'].map((category) => {
                const categoryExtras = availableExtras.filter(e => e.category === category);
                
                if (categoryExtras.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300 capitalize">
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
                              ? 'border-blue-400 bg-zinc-800'
                              : 'border-zinc-700 hover:border-zinc-600'
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
                                  className="w-4 h-4 text-blue-400 rounded"
                                />
                                <h5 className="font-medium text-gray-200">{extra.name}</h5>
                              </div>
                              <p className="text-sm text-gray-400 mt-1 ml-6">
                                {extra.description}
                              </p>
                            </div>
                            <span className="ml-4 text-sm font-semibold text-blue-400">
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
      </div>
    </div>
  );
}
