export interface CarPosition {
  lat: number;
  lng: number;
  timestamp: string;
}

let currentPosition: CarPosition | null = null;

export function updatePosition(position: CarPosition): void {
  currentPosition = position;
}

export function getPosition(): CarPosition | null {
  return currentPosition;
}
