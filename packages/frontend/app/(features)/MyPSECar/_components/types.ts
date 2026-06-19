export interface Vehicle {
  id: string;
  userId: string;
  carId: string;
  nickname: string | null;
  vin: string;
  purchaseDate: string | null;
}

export interface VehicleStatus {
  id?: string;
  vehicleId: string;
  fuelLevel: number;
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

export interface VehicleHistoryPoint {
  fuelLevel: number;
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

export interface VehiclesResponse {
  userId?: string;
  vehicles: Vehicle[];
  total?: number;
}

export interface VehicleStatusResponse {
  status: VehicleStatus | null;
}

export interface VehicleHistoryResponse {
  history: VehicleHistoryPoint[];
}

export interface GPSMessage {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface FuelMessage {
  level: number;
  timestamp: string;
}

export interface SpeedMessage {
  speed: number;
  timestamp: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelect: (vehicleId: string) => void;
}

export interface FuelGaugeProps {
  level: number;
}

export interface VehicleMapProps {
  latitude: number | null;
  longitude: number | null;
  nickname?: string | null;
}

export interface VehicleStatsProps {
  speed: number | null;
  timestamp: string | null;
  fuelLevel: number | null;
  latitude: number | null;
  longitude: number | null;
  connectionState: ConnectionState;
}
