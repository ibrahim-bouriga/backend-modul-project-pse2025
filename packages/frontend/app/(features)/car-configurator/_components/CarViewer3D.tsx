'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useFBX, useGLTF } from '@react-three/drei';
import { Suspense, useEffect } from 'react';
import * as THREE from 'three';

interface CarModelProps {
  color: string;
}

/**
 * Lamborghini Revuelto FBX model
 */
function CarModel({ color }: CarModelProps) {
  const gltf = useGLTF('/free_lamborghini_revuelto/scene.gltf');

  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Log mesh and material names to inspect the model structure
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        console.log('Mesh:', child.name, '| Materials:', materials.map(m => m.name));
      }
    });
  }, [gltf]);

  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // TODO: Replace 'Body' with the actual mesh/material name found via console.log above
            if (child.name.includes('Body') || mat.name.includes('Body')) {
              mat.color.set(color);
              mat.metalness = 0.8;
              mat.roughness = 0.2;
            }
          }
        });
      }
    });
  }, [gltf, color]);

  return <primitive object={gltf.scene} scale={2} position={[0, -0.8, 0]}/>;
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
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        color="#1a1a1a"
        metalness={0.1}
        roughness={0.8}
      />
    </mesh>
  );
}

export interface CarViewer3DProps {
  color: string;
  isLoading?: boolean;
}

/**
 * Main 3D Car Viewer Component
 * Renders an interactive 3D car model with orbit controls
 */
export default function CarViewer3D({ color, isLoading = false }: CarViewer3DProps) {
  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
      <Canvas shadows scene={{ background: new THREE.Color('#000000') }}>
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
        
        {/* Environment for reflections */}
        <Environment preset="night" />
        
        {/* Ground */}
        <Ground />
        
        {/* Car Model */}
        <Suspense fallback={<LoadingFallback />}>
          <CarModel color={color} />
        </Suspense>
        
        {/* Orbit Controls */}
        <OrbitControls 
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
