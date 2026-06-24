import * as THREE from "three";
import type { CarInput, CarModel, ICarController } from "./types";
import { DRIVER_X, buildInterior } from "./InteriorBuilder";

const MAX_SPEED = 33.3; // m/s ≈ 120 km/h
const ACCELERATION = 12;
const DECELERATION = 8;
const TURN_SPEED = 1.4; // rad/s bei voller Lenkung und Maximalgeschwindigkeit
const EYE_HEIGHT = 1.2; // Kamera-Y im Car-Root-Raum

// TEMPORÄRER DEBUG-SCHALTER: Bei true wird die Kamera weit nach hinten/oben
// verschoben, um das KOMPLETTE Cockpit von außen wie in einer Vogel-
// perspektive zu sehen
const DEBUG_BIRDSEYE_VIEW = false;

export class CarController implements ICarController {
  readonly root: THREE.Object3D;
  private steeringWheel: THREE.Object3D | null = null;
  private speed = 0;
  private heading = 0;

  constructor(camera: THREE.Camera) {
    this.root = new THREE.Object3D();
    // Kamera ist Kind-Objekt des Root → bewegt sich mit dem Fahrzeug
    if (DEBUG_BIRDSEYE_VIEW) {
      // Weit nach hinten/oben verschoben, leicht nach unten geneigt, um das
      // gesamte Cockpit von außen zu überblicken.
      camera.position.set(DRIVER_X, EYE_HEIGHT + 3, 4);
      camera.rotation.set(-0.6, 0, 0); // nach unten geneigt
    } else {
      camera.position.set(DRIVER_X, EYE_HEIGHT, -1.0);
      camera.rotation.set(0, 0, 0);
    }
    this.root.add(camera);

    // DEBUG: Markiert die NORMALE (Ego-Perspektive-)Augenposition mit einer
    // kleinen roten Kugel, damit im Vogelperspektive-Modus sichtbar wird,
    // wo die Kamera normalerweise sitzen würde, relativ zur Cockpit-
    // Geometrie.
    if (DEBUG_BIRDSEYE_VIEW) {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      marker.position.set(DRIVER_X, EYE_HEIGHT, 0);
      this.root.add(marker);
    }
  }

  setSteeringWheel(wheel: THREE.Object3D): void {
    this.steeringWheel = wheel;
  }

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
    // Geschwindigkeit: throttle bestimmt jetzt eine ZIELGESCHWINDIGKEIT
    // (proportional zu MAX_SPEED)
    const targetSpeed =
      input.throttle > 0
        ? input.throttle * MAX_SPEED
        : input.throttle * MAX_SPEED * 0.3; // Rückwärts langsamer, wie zuvor

    if (Math.abs(targetSpeed - this.speed) > 0.001) {
      // Beschleunigung UND Abbremsen Richtung Zielgeschwindigkeit verwenden
      // dieselbe Rate (ACCELERATION) – das Fahrzeug nähert sich dem Ziel
      // unabhängig davon, ob es schneller oder langsamer werden muss.
      const rate = ACCELERATION * delta;
      if (this.speed < targetSpeed) {
        this.speed = Math.min(this.speed + rate, targetSpeed);
      } else {
        this.speed = Math.max(this.speed - rate, targetSpeed);
      }
    }

    // Falls throttle = 0 (Neigung innerhalb der Deadzone): natürliches
    // Ausrollen statt sofortigem Stillstand bei der Zielgeschwindigkeit 0.
    if (input.throttle === 0 && Math.abs(this.speed) > 0.001) {
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
      this.steeringWheel.rotation.y = THREE.MathUtils.lerp(
        this.steeringWheel.rotation.y,
        target,
        Math.min(1, delta * 10),
      );
    }
  }

  get currentSpeed(): number {
    return this.speed;
  }
}
