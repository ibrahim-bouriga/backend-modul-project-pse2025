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

// Wheel style option
export interface WheelOption {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

// Interior package option
export interface InteriorOption {
  id: string;
  name: string;
  description: string;
  features: string[];
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
  color: ColorOption;
  wheels: WheelOption;
  interior: InteriorOption;
  extras: ExtraOption[];
  totalPrice: number;
}

// Configuration state for the configurator
export interface ConfiguratorState {
  selectedColorId: string;
  selectedWheelsId: string;
  selectedInteriorId: string;
  selectedExtraIds: string[];
}

// Props for 3D viewer component
export interface CarViewer3DProps {
  color: string;
  wheelsId: string;
  isLoading?: boolean;
}

// Props for configuration panel
export interface ConfigPanelProps {
  configuration: CarConfiguration;
  onColorChange: (color: ColorOption) => void;
  onWheelsChange: (wheels: WheelOption) => void;
  onInteriorChange: (interior: InteriorOption) => void;
  onExtrasChange: (extras: ExtraOption[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

// Available options data structure
export interface ConfigurationOptions {
  colors: ColorOption[];
  wheels: WheelOption[];
  interiors: InteriorOption[];
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
