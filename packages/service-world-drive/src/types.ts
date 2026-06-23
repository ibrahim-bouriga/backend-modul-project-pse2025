export interface VehicleTelemetry {
  lat:       number;
  lng:       number;
  speed:     number | null; // m/s
  timestamp: string;
}
