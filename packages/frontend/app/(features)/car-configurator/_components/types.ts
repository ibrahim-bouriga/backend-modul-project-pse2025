/**
 * Car Configurator Types
 * Defines interfaces for 3D car configuration system
 */

// Color option for car exterior
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  price: number;
}

// Extra features/options
export interface ExtraOption {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'technology' | 'comfort' | 'performance' | 'safety';
}

// Complete car configuration
export interface CarConfiguration {
  carId: string;
  carModel: string;
  basePrice: number;
  bodyColor: ColorOption;
  wheelColor: ColorOption;
  brakeColor: ColorOption;
  extras: ExtraOption[];
  totalPrice: number;
}

// Configuration state for the configurator
export interface ConfiguratorState {
  selectedBodyColorId: string;
  selectedWheelColorId: string;
  selectedBrakeColorId: string;
  selectedExtraIds: string[];
}

// Props for 3D viewer component
export interface CarViewer3DProps {
  bodyColor: string;
  wheelColor: string;
  brakeColor: string;
  isLoading?: boolean;
}

// Props for configuration panel
export interface ConfigPanelProps {
  configuration: CarConfiguration;
  onBodyColorChange: (color: ColorOption) => void;
  onWheelColorChange: (color: ColorOption) => void;
  onBrakeColorChange: (color: ColorOption) => void;
  onExtrasChange: (extras: ExtraOption[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

// Available options data structure
export interface ConfigurationOptions {
  bodyColors: ColorOption[];
  wheelColors: ColorOption[];
  brakeColors: ColorOption[];
  extras: ExtraOption[];
}

// Saved configuration response from API
export interface SavedConfiguration {
  id: string;
  userId?: string;
  carId: string;
  configuration: CarConfiguration;
  createdAt: string;
  updatedAt: string;
}

// API response for saving configuration
export interface SaveConfigurationResponse {
  success: boolean;
  configurationId: string;
  totalPrice: number;
  message?: string;
}
