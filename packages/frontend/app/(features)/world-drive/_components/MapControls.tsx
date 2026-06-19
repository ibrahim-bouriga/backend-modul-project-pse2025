'use client';

import { MapControlsProps } from './types';

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onCenterOnCar,
  followMode,
  onToggleFollow,
}: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 flex items-center justify-center text-black hover:bg-gray-100 transition-colors border-b border-gray-200"
          aria-label="Zoom in"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 flex items-center justify-center text-black hover:bg-gray-100 transition-colors"
          aria-label="Zoom out"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>

      {/* Center on Car Button */}
      <button
        onClick={onCenterOnCar}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-black hover:bg-gray-100 transition-colors"
        aria-label="Center on car"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Follow Mode Toggle */}
      <button
        onClick={onToggleFollow}
        className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center text-black transition-colors ${
          followMode
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white hover:bg-gray-100'
        }`}
        aria-label={followMode ? 'Disable follow mode' : 'Enable follow mode'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  );
}
