import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODEL_PATH = "/low_poly_forest_tree_pack/scene.gltf";

export interface EnvironmentParts {
  trees: THREE.Object3D[];
  rocks: THREE.Object3D[];
}

export async function loadGltfEnvironment(): Promise<EnvironmentParts | null> {
  const loader = new GLTFLoader();

  let gltf: Awaited<ReturnType<typeof loader.loadAsync>>;
  try {
    gltf = await loader.loadAsync(MODEL_PATH);
  } catch (err) {
    console.error(
      `[GltfEnvironmentLoader] Konnte Modell nicht laden von ${MODEL_PATH}:`,
      err,
    );
    return null;
  }

  const atlasTreeNodes = new Map<string, THREE.Object3D>();
  const rockNodes      = new Map<string, THREE.Object3D>();

  gltf.scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const node = (child.parent && child.parent !== gltf.scene)
      ? child.parent
      : child;

    if (/^Background_Tree_Atlas/i.test(child.name)) {
      atlasTreeNodes.set(child.name, node);
    } else if (/^Rocks/i.test(child.name)) {
      rockNodes.set(child.name, node);
    }
  });

  // Ensure all matrixWorld values are up to date before we read them.
  gltf.scene.updateWorldMatrix(true, true);

  const _wPos   = new THREE.Vector3();
  const _wQuat  = new THREE.Quaternion();
  const _wScale = new THREE.Vector3();

  /**
   * Bakes the node's full world rotation + scale into its mesh geometries, then
   * resets the node's own transform to identity so it sits at the origin.
   * This is needed because the Sketchfab GLTF wraps everything in several
   * intermediate nodes (Sketchfab_model, Tree_Packfbx, RootNode) that carry
   * unit-conversion scale (cm→m) and Z-up→Y-up rotation. Extracting a leaf node
   * without baking those ancestors would leave the geometry 100× too large and
   * rotated 90°.
   */
  function extractTemplate(node: THREE.Object3D): THREE.Object3D {
    node.matrixWorld.decompose(_wPos, _wQuat, _wScale);
    // Build a matrix that contains only rotation + scale (no translation).
    const bake = new THREE.Matrix4().compose(new THREE.Vector3(), _wQuat, _wScale);

    node.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry = child.geometry.clone(); // don't mutate the original
        child.geometry.applyMatrix4(bake);
      }
    });

    node.removeFromParent();
    node.position.set(0, 0, 0);
    node.rotation.set(0, 0, 0);
    node.scale.set(1, 1, 1);

    // Ground the model: find the lowest vertex across all baked geometries and
    // shift everything up so the bottom of the model sits exactly at y = 0.
    let minY = Infinity;
    node.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.computeBoundingBox();
      const bb = child.geometry.boundingBox!;
      if (bb.min.y < minY) minY = bb.min.y;
    });
    if (isFinite(minY) && minY !== 0) {
      node.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.translate(0, -minY, 0);
      });
    }

    return node;
  }

  const trees: THREE.Object3D[] = [];
  atlasTreeNodes.forEach((node) => trees.push(extractTemplate(node)));

  const rocks: THREE.Object3D[] = [];
  rockNodes.forEach((node) => rocks.push(extractTemplate(node)));

  console.log(
    `[GltfEnvironmentLoader] ${trees.length} tree templates, ${rocks.length} rock templates`,
  );
  return { trees, rocks };
}
