import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { InteriorParts } from "./InteriorBuilder";

const MODEL_PATH = "/free_lamborghini_revuelto/scene.gltf";

const GLTF_DRIVER_X = -0.9;
const GLTF_EYE_HEIGHT = 1.19;

export async function loadGltfInterior(): Promise<InteriorParts | null> {
  const loader = new GLTFLoader();

  let gltf: Awaited<ReturnType<typeof loader.loadAsync>>;
  try {
    gltf = await loader.loadAsync(MODEL_PATH);
  } catch (err) {
    console.error(
      `[GltfInteriorLoader] Konnte Modell nicht laden von ${MODEL_PATH}:`,
      err,
    );
    return null;
  }

  // Findet die RootNode-Ebene, unter der die Top-Level-Teile liegen.
  // Struktur laut verifizierter Analyse:
  // Sketchfab_Scene > Sketchfab_model > Lamborghini_revueltofbx > RootNode > [Teile]
  let rootNode: THREE.Object3D | null = null;
  gltf.scene.traverse((obj) => {
    if (!rootNode && obj.name === "RootNode") rootNode = obj;
  });

  if (!rootNode) {
    console.error(
      "[GltfInteriorLoader] 'RootNode' nicht im Modell gefunden - " +
        "Modellstruktur hat sich evtl. geändert. Fallback wird genutzt.",
    );
    return null;
  }

  // DEBUG: Prüft, ob RootNode selbst eine eigene Transformation hat
  // (Position/Skalierung/Rotation), die beim Klonen NUR der Kinder
  // (statt RootNode selbst) verloren gehen würde - typisch bei FBX->GLTF
  // Konvertierungen, die oft eine Korrektur-Transformation auf RootNode
  // legen.
  const rn = rootNode as THREE.Object3D;
  console.log("[GltfInteriorLoader] RootNode position:", rn.position);
  console.log("[GltfInteriorLoader] RootNode scale:", rn.scale);
  console.log("[GltfInteriorLoader] RootNode rotation:", rn.rotation);
  console.log(
    "[GltfInteriorLoader] RootNode matrix elements:",
    rn.matrix.elements,
  );
  console.log(
    "[GltfInteriorLoader] RootNode world matrix elements:",
    rn.matrixWorld.elements,
  );

  rn.updateMatrixWorld(true);
  const rootNodeClone = rn.clone();
  const worldMatrix = rn.matrixWorld.clone();
  rootNodeClone.matrix.copy(worldMatrix);
  rootNodeClone.matrix.decompose(
    rootNodeClone.position,
    rootNodeClone.quaternion,
    rootNodeClone.scale,
  );

  const group = new THREE.Group(); // Innere Gruppe: enthält das Cockpit, wird verschoben
  let steeringWheel: THREE.Object3D | null = null;
  let foundCount = 0;

  for (const child of rootNodeClone.children.slice()) {
    group.add(child); // alle Kinder hinzufügen
  }

  group.quaternion.copy(rootNodeClone.quaternion);
  group.scale.copy(rootNodeClone.scale);

  group.rotateZ(Math.PI);

  const SCALE_FACTOR = rootNodeClone.scale.x;

  group.traverse((obj) => {
    if (!steeringWheel && obj.name === "Steering_wheel") {
      steeringWheel = obj;
    }
  });

  if (steeringWheel) {
    const steeringWheelWrapper = new THREE.Group();
    steeringWheelWrapper.position.copy(steeringWheel.position);
    steeringWheelWrapper.rotation.y = 2 * Math.PI;

    // Lenkrad an Position (0,0,0) relativ zum Wrapper setzen, da der
    // Wrapper bereits die ursprüngliche Position übernommen hat - sonst
    // würde die Position doppelt angewendet.
    const parent = steeringWheel.parent;
    steeringWheel.position.set(0, 0, 0);
    steeringWheelWrapper.add(steeringWheel);
    if (parent) {
      parent.add(steeringWheelWrapper);
    } else {
      group.add(steeringWheelWrapper);
    }

    // Diese Referenz (Wrapper, NICHT das rohe GLTF-Objekt) geht an
    // CarController.ts über setSteeringWheel() - dort wird weiterhin nur
    // rotation.z animiert, das Cockpit-Modell selbst bleibt dem Controller
    // unbekannt.
    steeringWheel = steeringWheelWrapper;
  }

  const rawBox = new THREE.Box3().setFromObject(group);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  const rawCenter = rawBox.getCenter(new THREE.Vector3());
  console.log(
    "[GltfInteriorLoader] RAW Bounding Box vor Verschiebung (min/max):",
    rawBox.min,
    rawBox.max,
  );
  console.log("[GltfInteriorLoader] RAW Bounding Box Größe:", rawSize);
  console.log("[GltfInteriorLoader] RAW Bounding Box Zentrum:", rawCenter);

  const targetX = rawCenter.x;
  const targetY = rawBox.min.y + rawSize.y * 0.75;
  const targetZ = rawBox.min.z + rawSize.z * 0.7;

  group.position.set(
    GLTF_DRIVER_X - targetX,
    GLTF_EYE_HEIGHT - targetY,
    0 - targetZ,
  );

  // DEBUG: Hilfsachsen (rot=X, grün=Y, blau=Z) am EIGENSTÄNDIGEN GLTF-
  // Zielpunkt (GLTF_DRIVER_X, GLTF_EYE_HEIGHT, 0)
  const axesHelper = new THREE.AxesHelper(0.3);
  axesHelper.position.set(GLTF_DRIVER_X, GLTF_EYE_HEIGHT, 0);
  const outerGroup = new THREE.Group();
  outerGroup.add(axesHelper);
  outerGroup.add(group);

  if (!steeringWheel) {
    console.warn(
      "[GltfInteriorLoader] 'Steering_wheel'-Gruppe nicht gefunden - " +
        "Lenkanimation wird nicht funktionieren.",
    );
  }

  // DEBUG: Misst die tatsächliche räumliche Ausdehnung (Bounding Box) der
  // geladenen Gruppe NACH der Verschiebung - dient jetzt nur noch der
  // Verifikation. Erwartung: Box sollte den Punkt (GLTF_DRIVER_X,
  // GLTF_EYE_HEIGHT, 0) eng umschließen. Falls dieser Punkt erkennbar von
  // der ECHTEN Kameraposition aus CarController.ts abweicht (rote Marker-
  // Kugel im DEBUG_BIRDSEYE_VIEW), GLTF_DRIVER_X/GLTF_EYE_HEIGHT oben in
  // der Datei anpassen, bis beide Punkte visuell zusammenfallen.
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  console.log(
    "[GltfInteriorLoader] Bounding Box NACH Verschiebung " +
      `(sollte (${GLTF_DRIVER_X}, ${GLTF_EYE_HEIGHT}, 0) umschließen):`,
  );
  console.log("[GltfInteriorLoader] Bounding Box Größe (x,y,z):", size);
  console.log("[GltfInteriorLoader] Bounding Box Zentrum (x,y,z):", center);
  console.log("[GltfInteriorLoader] Bounding Box min/max:", box.min, box.max);

  // Schatten für alle Meshes in der NEUEN, gefilterten Gruppe aktivieren -
  // bewusst erst hier, nach dem Filtern.
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  const WINDOW_TINT_OPACITY = 0.18; // Abdunklungsgrad der Scheiben (0=voll transparent, 1=voll deckend)
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material)
      ? obj.material
      : [obj.material];
    materials.forEach((mat) => {
      const nameMatch =
        obj.name.includes("Window") ||
        obj.name.includes("Windshield") || // zusätzlich zur ursprünglichen Vorlage,
        // da unsere Whitelist-Gruppe "Windshield" heißt, nicht "Window"
        mat?.name?.includes("Window");
      if (!nameMatch) return;
      if (
        mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshPhysicalMaterial
      ) {
        mat.transparent = true;
        mat.opacity = WINDOW_TINT_OPACITY;
        mat.color.set(0x9fc3df);
      }
    });
  });

  const mirrorMat = new THREE.MeshBasicMaterial({ color: 0x8a98a8 });
  const rearviewSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2 / SCALE_FACTOR, 0.06 / SCALE_FACTOR),
    mirrorMat,
  );
  rearviewSurface.position.set(0, 1.4 / SCALE_FACTOR, -0.9 / SCALE_FACTOR);
  group.add(rearviewSurface);

  const leftMirrorSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1 / SCALE_FACTOR, 0.07 / SCALE_FACTOR),
    mirrorMat.clone(),
  );
  leftMirrorSurface.position.set(
    -0.9 / SCALE_FACTOR,
    1.05 / SCALE_FACTOR,
    -0.8 / SCALE_FACTOR,
  );
  leftMirrorSurface.rotation.y = Math.PI / 2;
  group.add(leftMirrorSurface);

  const rightMirrorSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1 / SCALE_FACTOR, 0.07 / SCALE_FACTOR),
    mirrorMat.clone(),
  );
  rightMirrorSurface.position.set(
    0.9 / SCALE_FACTOR,
    1.05 / SCALE_FACTOR,
    -0.8 / SCALE_FACTOR,
  );
  rightMirrorSurface.rotation.y = -Math.PI / 2;
  group.add(rightMirrorSurface);

  return {
    group: outerGroup,
    steeringWheel: steeringWheel ?? new THREE.Object3D(),
    rearviewSurface,
    leftMirrorSurface,
    rightMirrorSurface,
  };
}
