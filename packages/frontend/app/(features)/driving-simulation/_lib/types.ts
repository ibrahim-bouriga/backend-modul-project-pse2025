import type * as THREE from "three";

export interface CarInput {
  throttle: number; // -1.0 (brake/reverse) … +1.0 (full gas)
  steering: number; // -1.0 (hard left) … +1.0 (hard right)
}

export interface CarModel {
  interior?: THREE.Object3D;
  steeringWheel?: THREE.Object3D;
  exterior?: THREE.Object3D; // in Ego-Perspektive nicht sichtbar
}

export interface ICarController {
  root: THREE.Object3D;
  attachModel(model: CarModel): void;
  detachModel(): void;
  update(delta: number, input: CarInput): void;
}

export interface GyroData {
  beta: number;
  gamma: number;
  timestamp: number;
}
