'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useFBX, useGLTF, Html } from '@react-three/drei';
import { Suspense, useEffect, useRef, MutableRefObject } from 'react';
import * as THREE from 'three';

interface CarModelProps {
  bodyColor: string;
  wheelColor: string;
  brakeColor: string;
  tintOpacity: number;
}

const setPartColor = (name: string, color: string, metalness: number, roughness: number, gltf: any) => {
  gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // TODO: Replace 'Body' with the actual mesh/material name found via console.log above
            if (child.name.includes(name) || mat.name.includes(name)) {
              mat.color.set(color);
              mat.metalness = metalness;
              mat.roughness = roughness;
            }
          }
        });
      }
    });
  };

const setWindowTint = (opacity: number, gltf: any) => {
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          if (child.name.includes('Window') || mat.name.includes('Window')) {
            mat.transparent = true;
            mat.opacity = opacity;
            mat.color.set('#000000');
          }
        }
      });
    }
  });
};

/**
 * Lamborghini Revuelto FBX model
 */
function CarModel({ bodyColor, wheelColor, brakeColor, tintOpacity }: CarModelProps) {
  const gltf = useGLTF('/free_lamborghini_revuelto/scene.gltf');

  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        // Front daylight running lights — white/cool emissive
        if (child.name === 'Daylight_Light_0') {
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive = new THREE.Color(0xffffff);
              mat.emissiveIntensity = 100;
            }
          });
        }

        // Front headlight glass — faint white glow + transparency
        if (child.name === 'Daylight_Glass_Headlight_glass001_0') {
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive = new THREE.Color(0xddeeff);
              mat.emissiveIntensity = 0.6;
              mat.transparent = true;
              mat.opacity = 0.55;
            }
          });
        }

        // Rear taillights — red emissive
        if (child.name === 'Tail_light_Tail_light_0') {
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive = new THREE.Color(0xff1a00);
              mat.emissiveIntensity = 3;
            }
          });
        }

        // Rear taillight glass — faint red glow + transparency
        if (child.name === 'Tail_light_Taillight_glass_0') {
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive = new THREE.Color(0xff2200);
              mat.emissiveIntensity = 0.6;
              mat.transparent = true;
              mat.opacity = 0.55;
            }
          });
        }

        // Log mesh and material names to inspect the model structure
        console.log('Mesh:', child.name, '| Materials:', materials.map(m => m.name));
      }
    });
  }, [gltf]);

  useEffect(() => {
    setPartColor('Body', bodyColor, 0.5, 0.1, gltf);
  }, [gltf, bodyColor]);

  useEffect(() => {
    setPartColor('Rim', wheelColor, 1, 0, gltf);
  }, [gltf, wheelColor]);
  
  useEffect(() => {
    setPartColor('Caliper', brakeColor, 0.5, 0.1, gltf);
  }, [gltf, brakeColor]);

  useEffect(() => {
    setWindowTint(tintOpacity, gltf);
  }, [gltf, tintOpacity]);

  return <primitive object={gltf.scene} scale={2} position={[0, -0.8, 0]}/>;
}

const NORMAL_CAMERA_POSITION = new THREE.Vector3(5, 3, 5);
const NORMAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const COCKPIT_CAMERA_POSITION = new THREE.Vector3(0.77, 0.8, 0.2);
const COCKPIT_CAMERA_TARGET = new THREE.Vector3(1, 0.4, 5);

function CameraController({
  cockpitMode,
  controlsRef,
}: {
  cockpitMode: boolean;
  controlsRef: MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const isAnimating = useRef(false);

  useEffect(() => {
    // Start transition animation and disable controls for the duration
    isAnimating.current = true;
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [cockpitMode, controlsRef]);

  useFrame(() => {
    if (!isAnimating.current) return;

    const targetPos = cockpitMode ? COCKPIT_CAMERA_POSITION : NORMAL_CAMERA_POSITION;
    const targetLook = cockpitMode ? COCKPIT_CAMERA_TARGET : NORMAL_CAMERA_TARGET;

    camera.position.lerp(targetPos, 0.05);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook, 0.05);
      controlsRef.current.update();
    }

    // Stop animating once close enough to target
    if (camera.position.distanceTo(targetPos) < 0.01) {
      camera.position.copy(targetPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLook);
        controlsRef.current.update();
        // Only re-enable orbit controls when outside the cockpit
        controlsRef.current.enabled = !cockpitMode;
      }
      isAnimating.current = false;
    }
  });

  return null;
}

interface CockpitButtonProps {
  position: [number, number, number];
  label: string;
  onClick: () => void;
}

function CockpitButton({ position, label, onClick }: CockpitButtonProps) {
  return (
    <Html position={position} center>
      <button
        onClick={onClick}
        className="px-10 py-6 bg-zinc-900/85 hover:bg-zinc-700/95 text-gray-100 border border-white/25 rounded-lg text-xl font-bold font-sans cursor-pointer backdrop-blur whitespace-nowrap select-none transition-colors"
      >
        {label}
      </button>
    </Html>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 1, 4]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}

/**
 * Ground plane for the scene
 */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial 
        color="#222222"
        metalness={0.2}
        roughness={0.95}
      />
    </mesh>
  );
}

export interface CarViewer3DProps {
  bodyColor: string;
  wheelColor: string;
  brakeColor: string;
  tintOpacity: number;
  cockpitMode?: boolean;
  /** Called when the cockpit button is clicked. */
  onCockpitButtonClick?: () => void;
  /** Indicates if a popup is currently open. */
  popupOpen?: boolean;
}

/**
 * Main 3D Car Viewer Component
 * Renders an interactive 3D car model with orbit controls
 */
export default function CarViewer3D({
  bodyColor,
  wheelColor,
  brakeColor,
  tintOpacity,
  cockpitMode = false,
  popupOpen = false,
  onCockpitButtonClick = () => console.log('Cockpit button clicked'),
}: CarViewer3DProps) {
  const controlsRef = useRef<any>(null);

  const COCKPIT_BUTTON_POSITION: [number, number, number] = [0.78, 0.87, 1];
  const COCKPIT_BUTTON_LABEL = 'Start Driving Simulator!';

  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
      <Canvas shadows>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={50} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <spotLight 
          position={[-10, 10, -5]} 
          intensity={0.5}
          angle={0.3}
          penumbra={1}
          castShadow
        />
        
        {/* Environment for reflections, background, and ground projection */}
        <Environment preset="city"  background backgroundBlurriness={0.2} ground={{ height: 15, radius: 80 }} />
        
        {/* Ground */}
        <Ground />
        
        {/* Car Model */}
        <Suspense fallback={<LoadingFallback />}>
          <CarModel bodyColor={bodyColor} wheelColor={wheelColor} brakeColor={brakeColor} tintOpacity={tintOpacity} />
        </Suspense>
        
        {/* Cockpit Button — only visible in cockpit mode */}
        {cockpitMode && !popupOpen && (
          <CockpitButton
            position={COCKPIT_BUTTON_POSITION}
            label={COCKPIT_BUTTON_LABEL}
            onClick={onCockpitButtonClick}
          />
        )}

        {/* Camera Controller */}
        <CameraController cockpitMode={cockpitMode} controlsRef={controlsRef} />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
        />
      </Canvas>
      
      {/* WebGL Not Supported Message */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center p-8">
            <h3 className="text-xl font-bold mb-2">WebGL Not Supported</h3>
            <p>Your browser does not support 3D graphics. Please use a modern browser.</p>
          </div>
        </div>
      </noscript>
    </div>
  );
}
