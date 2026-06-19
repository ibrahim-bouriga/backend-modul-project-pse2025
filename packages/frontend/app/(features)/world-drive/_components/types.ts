// TypeScript interfaces for World Drive Map

export interface GPSData {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface SuperCarLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
  active: boolean;
}

export interface LocationHistoryPoint {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

export interface SuperCarResponse {
  supercar: SuperCarLocation;
}

export interface HistoryResponse {
  history: LocationHistoryPoint[];
}

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterOnCar: () => void;
  followMode: boolean;
  onToggleFollow: () => void;
}

export interface WorldMapProps {
  initialLocation?: {
    lat: number;
    lng: number;
  };
  initialZoom?: number;
}
