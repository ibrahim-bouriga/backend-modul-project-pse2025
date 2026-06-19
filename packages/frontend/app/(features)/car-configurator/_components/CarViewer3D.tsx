'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface CarModelProps {
  color: string;
  wheelsId: string;
}

/**
 * Simple car model using Three.js primitives
 * This is a placeholder - can be replaced with a real GLB/GLTF model later
 */
function CarModel({ color, wheelsId }: CarModelProps) {
  // Car body (main chassis)
  const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
  
  // Car cabin (top part)
  const cabinGeometry = new THREE.BoxGeometry(1.6, 0.6, 2);
  
  // Wheel geometry
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
  
  // Wheel positions (front-left, front-right, back-left, back-right)
  const wheelPositions: [number, number, number][] = [
    [-0.9, -0.4, 1.2],  // Front left
    [0.9, -0.4, 1.2],   // Front right
    [-0.9, -0.4, -1.2], // Back left
    [0.9, -0.4, -1.2],  // Back right
  ];

  // Determine wheel color based on selection
  const wheelColor = wheelsId === 'sport' ? '#1a1a1a' : 
                     wheelsId === 'luxury' ? '#c0c0c0' : 
                     '#2a2a2a';

  return (
    <group>
      {/* Car Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <primitive object={bodyGeometry} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Car Cabin */}
      <mesh position={[0, 0.7, -0.3]} castShadow receiveShadow>
        <primitive object={cabinGeometry} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Windows (darker, semi-transparent) */}
      <mesh position={[0, 0.7, -0.3]}>
        <boxGeometry args={[1.5, 0.55, 1.9]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          transparent
          opacity={0.3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Wheels */}
      {wheelPositions.map((position, index) => (
        <mesh 
          key={index} 
          position={position} 
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <primitive object={wheelGeometry} />
          <meshStandardMaterial 
            color={wheelColor}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[-0.6, 0.1, 2.1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffff99"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0.6, 0.1, 2.1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffff99"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.6, 0.1, -2.1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0.6, 0.1, -2.1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
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
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        color="#f0f0f0"
        metalness={0.1}
        roughness={0.8}
      />
    </mesh>
  );
}

export interface CarViewer3DProps {
  color: string;
  wheelsId: string;
  isLoading?: boolean;
}

/**
 * Main 3D Car Viewer Component
 * Renders an interactive 3D car model with orbit controls
 */
export default function CarViewer3D({ color, wheelsId, isLoading = false }: CarViewer3DProps) {
  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg overflow-hidden">
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
        
        {/* Environment for reflections */}
        <Environment preset="city" />
        
        {/* Ground */}
        <Ground />
        
        {/* Car Model */}
        <Suspense fallback={<LoadingFallback />}>
          {!isLoading && <CarModel color={color} wheelsId={wheelsId} />}
          {isLoading && <LoadingFallback />}
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
