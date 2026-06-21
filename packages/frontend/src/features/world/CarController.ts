import * as THREE from "three";
import type { CarInput, CarModel, ICarController } from "./types";
import { DRIVER_X, buildInterior } from "./InteriorBuilder";

const MAX_SPEED = 18; // m/s ≈ 65 km/h
const ACCELERATION = 12;
const DECELERATION = 8;
const TURN_SPEED = 1.4; // rad/s bei voller Lenkung und Maximalgeschwindigkeit
const EYE_HEIGHT = 1.2; // Kamera-Y im Car-Root-Raum

export class CarController implements ICarController {
  readonly root: THREE.Object3D;
  private steeringWheel: THREE.Object3D | null = null;
  private speed = 0;
  private heading = 0;

  constructor(camera: THREE.Camera) {
    this.root = new THREE.Object3D();
    // Kamera ist Kind-Objekt des Root → bewegt sich mit dem Fahrzeug
    camera.position.set(DRIVER_X, EYE_HEIGHT, 0);
    camera.rotation.set(0, 0, 0);
    this.root.add(camera);

    // Fallback: eigener Innenraum, falls kein CarModel übergeben wird
    const { group, steeringWheel } = buildInterior();
    this.root.add(group);
    this.steeringWheel = steeringWheel;
  }

  setSteeringWheel(wheel: THREE.Object3D): void {
    this.steeringWheel = wheel;
  }

  // Optionale Integration mit Kollege 1 (Konfigurator-Interface)
  attachModel(model: CarModel): void {
    if (model.interior) {
      this.root.add(model.interior);
    } else {
      const { group, steeringWheel } = buildInterior();
      this.root.add(group);
      this.steeringWheel = steeringWheel;
    }
    if (model.steeringWheel) this.steeringWheel = model.steeringWheel;
    // model.exterior wird in Ego-Perspektive nicht hinzugefügt
  }

  detachModel(): void {
    const toRemove = this.root.children.filter(
      (c: THREE.Object3D) => !(c instanceof THREE.Camera),
    );
    toRemove.forEach((c: THREE.Object3D) => this.root.remove(c));
    this.steeringWheel = null;
  }

  setSpawn(position: THREE.Vector3, yaw = 0): void {
    this.root.position.copy(position);
    this.heading = yaw;
    this.root.rotation.y = yaw;
    this.speed = 0;
  }

  update(delta: number, input: CarInput): void {
    // Geschwindigkeit
    if (input.throttle !== 0) {
      const accel = ACCELERATION * Math.abs(input.throttle) * delta;
      this.speed += input.throttle > 0 ? accel : -accel;
      this.speed = THREE.MathUtils.clamp(
        this.speed,
        -MAX_SPEED * 0.3,
        MAX_SPEED,
      );
    } else {
      const decay = DECELERATION * delta;
      this.speed =
        Math.abs(this.speed) < decay
          ? 0
          : this.speed - Math.sign(this.speed) * decay;
    }

    // Lenkung (nur bei Fahrt, skaliert mit Geschwindigkeit)
    if (Math.abs(this.speed) > 0.2) {
      const normalizedSpeed = THREE.MathUtils.clamp(
        this.speed / MAX_SPEED,
        -1,
        1,
      );
      this.heading -= input.steering * TURN_SPEED * normalizedSpeed * delta;
    }

    // Three.js-Kamera schaut standardmäßig in -Z; Bewegung muss dieselbe Richtung haben.
    // root.rotation.y = heading → Kamera-Blickrichtung = (-sin(heading), 0, -cos(heading))
    this.root.position.x -= Math.sin(this.heading) * this.speed * delta;
    this.root.position.z -= Math.cos(this.heading) * this.speed * delta;
    this.root.rotation.y = this.heading;

    // Lenkrad-Animation: rotation.z, max ±72°, smooth per lerp
    if (this.steeringWheel) {
      const target = -input.steering * (Math.PI * 0.4);
      this.steeringWheel.rotation.z = THREE.MathUtils.lerp(
        this.steeringWheel.rotation.z,
        target,
        Math.min(1, delta * 10),
      );
    }
  }

  get currentSpeed(): number {
    return this.speed;
  }
}
