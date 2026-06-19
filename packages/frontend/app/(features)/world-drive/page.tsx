'use client';

import dynamic from 'next/dynamic';

// Dynamically import WorldMap to avoid SSR issues with Leaflet
const WorldMap = dynamic(
  () => import('./_components/WorldMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Map...</p>
        </div>
      </div>
    )
  }
);

export default function WorldDrivePage() {
  return (
    <div className="w-full h-screen">
      <WorldMap />
    </div>
  );
}
