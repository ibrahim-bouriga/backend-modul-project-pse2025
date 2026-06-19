/**
 * TypeScript interfaces for Car Overview feature
 */

export interface CarSpecs {
  horsepower: number;
  topSpeed: number;
  acceleration: number;
  range?: number;
  batteryCapacity?: number;
  chargingTime?: number;
  weight?: number;
  torque?: number;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  description: string;
  basePrice: string; // Decimal as string
  imageUrl: string | null;
  specs: CarSpecs;
  available: boolean;
}

export interface CarConfiguration {
  id: string;
  carId: string;
  color: string;
  wheels: string;
  interior: string;
  extras: Record<string, any>;
  price: string; // Decimal as string
}

export interface CarsResponse {
  cars: Car[];
  total: number;
  page: number;
  limit: number;
}

export interface ConfigurationsResponse {
  configurations: CarConfiguration[];
}

export interface CarFiltersState {
  make: string;
  minYear: number;
  maxYear: number;
  minPrice: number;
  maxPrice: number;
  available: boolean | null;
}
