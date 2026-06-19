'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import mqtt, { MqttClient } from 'mqtt';
import 'leaflet/dist/leaflet.css';

import SuperCarMarker from './SuperCarMarker';
import LocationHistory from './LocationHistory';
import MapControls from './MapControls';
import {
  GPSData,
  SuperCarLocation,
  LocationHistoryPoint,
  WorldMapProps,
} from './types';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map instance methods
function MapController({
  center,
  zoom,
  onMapReady,
}: {
  center: [number, number];
  zoom: number;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

export default function WorldMap({
  initialLocation = { lat: 48.8566, lng: 2.3522 }, // Paris default
  initialZoom = 6,
}: WorldMapProps) {
  const [carLocation, setCarLocation] = useState<SuperCarLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryPoint[]>([]);
  const [followMode, setFollowMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mqttConnected, setMqttConnected] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const mqttClientRef = useRef<MqttClient | null>(null);

  // Fetch initial location from backend
  const fetchInitialLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/supercar/location');
      if (!response.ok) {
        throw new Error('Failed to fetch supercar location');
      }

      const data = await response.json();
      setCarLocation(data.supercar);

      // Fetch history
      const historyResponse = await fetch('http://localhost:3001/api/supercar/history?limit=100');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setLocationHistory(historyData.history);
      }
    } catch (err) {
      console.error('Error fetching initial location:', err);
      setError(err instanceof Error ? err.message : 'Failed to load car location');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up MQTT connection
  useEffect(() => {
    fetchInitialLocation();

    // Connect to MQTT broker via WebSocket
    const client = mqtt.connect('ws://localhost:9001/mqtt', {
      clientId: `worlddrive_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000,
    });

    mqttClientRef.current = client;

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      setMqttConnected(true);
      setError(null);

      // Subscribe to supercar GPS topic
      client.subscribe('car/supercar/gps', (err) => {
        if (err) {
          console.error('Subscribe error:', err);
          setError('Failed to subscribe to GPS updates');
        } else {
          console.log('Subscribed to car/supercar/gps');
        }
      });
    });

    client.on('message', (topic: string, message: Buffer) => {
      if (topic === 'car/supercar/gps') {
        try {
          const data: GPSData = JSON.parse(message.toString());
          console.log('Received GPS update:', data);

          // Update car location
          setCarLocation((prev) => ({
            id: prev?.id || 'supercar-1',
            name: prev?.name || 'PSE SuperCar',
            latitude: data.lat,
            longitude: data.lng,
            speed: data.speed,
            heading: data.heading,
            timestamp: data.timestamp,
            active: true,
          }));

          // Add to history (keep last 100 points)
          setLocationHistory((prev) => {
            const newHistory = [
              ...prev,
              {
                latitude: data.lat,
                longitude: data.lng,
                speed: data.speed,
                timestamp: data.timestamp,
              },
            ];
            return newHistory.slice(-100);
          });
        } catch (err) {
          console.error('Error parsing GPS message:', err);
        }
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      setError('MQTT connection error');
      setMqttConnected(false);
    });

    client.on('close', () => {
      console.log('MQTT connection closed');
      setMqttConnected(false);
    });

    client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });

    // Cleanup on unmount
    return () => {
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
      }
    };
  }, [fetchInitialLocation]);

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  }, []);

  const handleCenterOnCar = useCallback(() => {
    if (mapRef.current && carLocation) {
      mapRef.current.setView([carLocation.latitude, carLocation.longitude], mapRef.current.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [carLocation]);

  const handleToggleFollow = useCallback(() => {
    setFollowMode((prev) => !prev);
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading World Drive Map...</p>
        </div>
      </div>
    );
  }

  if (error && !carLocation) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchInitialLocation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const center: [number, number] = carLocation
    ? [carLocation.latitude, carLocation.longitude]
    : [initialLocation.lat, initialLocation.lng];

  return (
    <div className="relative w-full h-screen">
      {/* Connection Status Indicator */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            mqttConnected ? 'bg-green-500' : 'bg-red-500'
          } animate-pulse`}
        />
        <span className="text-sm font-medium">
          {mqttConnected ? 'Live Tracking' : 'Disconnected'}
        </span>
      </div>

      {/* Speed Display */}
      {carLocation && carLocation.speed !== null && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white rounded-lg shadow-lg px-6 py-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {carLocation.speed.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">km/h</div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapController
          center={center}
          zoom={initialZoom}
          onMapReady={handleMapReady}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Location History Trail */}
        {locationHistory.length > 0 && (
          <LocationHistory history={locationHistory} />
        )}

        {/* SuperCar Marker */}
        {carLocation && (
          <SuperCarMarker
            position={[carLocation.latitude, carLocation.longitude]}
            speed={carLocation.speed}
            heading={carLocation.heading}
            name={carLocation.name}
            followMode={followMode}
          />
        )}
      </MapContainer>

      {/* Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenterOnCar={handleCenterOnCar}
        followMode={followMode}
        onToggleFollow={handleToggleFollow}
      />
    </div>
  );
}
