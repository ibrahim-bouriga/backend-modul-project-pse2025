'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

import { BACKEND_URL } from '../../_lib/api';
import FuelGauge from './_components/FuelGauge';
import VehicleMap from './_components/VehicleMap';
import VehicleSelector from './_components/VehicleSelector';
import VehicleStats from './_components/VehicleStats';
import {
  ConnectionState,
  FuelMessage,
  GPSMessage,
  SpeedMessage,
  Vehicle,
  VehicleHistoryResponse,
  VehicleStatus,
  VehicleStatusResponse,
  VehiclesResponse,
} from './_components/types';

const USER_ID = 'user123';
const MQTT_WS_URL =
  process.env.NEXT_PUBLIC_MQTT_WS_URL ?? 'ws://broker.hivemq.com:8000/mqtt';

function getInitialStatus(vehicleId: string): VehicleStatus {
  return {
    vehicleId,
    fuelLevel: 0,
    latitude: 0,
    longitude: 0,
    speed: null,
    timestamp: new Date(0).toISOString(),
  };
}

export default function MyPSECarPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [status, setStatus] = useState<VehicleStatus | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const mqttClientRef = useRef<MqttClient | null>(null);
  const subscribedTopicsRef = useRef<string[]>([]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId]
  );

  const unsubscribeFromTopics = useCallback(() => {
    const client = mqttClientRef.current;
    if (!client || subscribedTopicsRef.current.length === 0) {
      return;
    }

    client.unsubscribe(subscribedTopicsRef.current);
    subscribedTopicsRef.current = [];
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoadingVehicles(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/vehicles/${USER_ID}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user vehicles');
      }

      const data: VehiclesResponse = await response.json();
      setVehicles(data.vehicles ?? []);

      if ((data.vehicles?.length ?? 0) > 0) {
        setSelectedVehicleId((current) => current ?? data.vehicles[0].id);
      }
    } catch (err) {
      console.error('Vehicle fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unable to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  const fetchVehicleStatus = useCallback(async (vehicleId: string) => {
    try {
      setLoadingStatus(true);
      setError(null);

      const [statusResponse, historyResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/vehicles/${vehicleId}/status`, {
          cache: 'no-store',
        }),
        fetch(`${BACKEND_URL}/api/vehicles/${vehicleId}/history?limit=50`, {
          cache: 'no-store',
        }),
      ]);

      if (!statusResponse.ok && statusResponse.status !== 404) {
        throw new Error('Failed to fetch vehicle status');
      }

      if (!historyResponse.ok && historyResponse.status !== 404) {
        throw new Error('Failed to fetch vehicle history');
      }

      const statusData: VehicleStatusResponse | null =
        statusResponse.status === 404 ? null : await statusResponse.json();

      const historyData: VehicleHistoryResponse | null =
        historyResponse.status === 404 ? null : await historyResponse.json();

      setStatus(
        statusData?.status
          ? {
              ...statusData.status,
              fuelLevel: Number(statusData.status.fuelLevel ?? 0),
              latitude: Number(statusData.status.latitude ?? 0),
              longitude: Number(statusData.status.longitude ?? 0),
              speed:
                statusData.status.speed === null || statusData.status.speed === undefined
                  ? null
                  : Number(statusData.status.speed),
            }
          : null
      );
      setHistoryCount(historyData?.history?.length ?? 0);
    } catch (err) {
      console.error('Vehicle status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unable to load vehicle telemetry');
      setStatus(null);
      setHistoryCount(0);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (!selectedVehicleId) {
      unsubscribeFromTopics();
      setStatus(null);
      setHistoryCount(0);
      return;
    }

    fetchVehicleStatus(selectedVehicleId);
  }, [fetchVehicleStatus, selectedVehicleId, unsubscribeFromTopics]);

  useEffect(() => {
    const client = mqtt.connect(MQTT_WS_URL, {
      clientId: `mypsecar_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 1500,
      connectTimeout: 10_000,
    });

    mqttClientRef.current = client;
    setConnectionState('connecting');

    client.on('connect', () => {
      setConnectionState('connected');
      setError(null);

      if (!selectedVehicleId) {
        return;
      }

      const topics = [
        `car/${selectedVehicleId}/gps`,
        `car/${selectedVehicleId}/fuel`,
        `car/${selectedVehicleId}/speed`,
      ];

      unsubscribeFromTopics();
      client.subscribe(topics, (subscribeError) => {
        if (subscribeError) {
          console.error('MQTT subscribe error:', subscribeError);
          setConnectionState('error');
          setError('Failed to subscribe to vehicle telemetry topics');
          return;
        }

        subscribedTopicsRef.current = topics;
      });
    });

    client.on('message', (topic, message) => {
      if (!selectedVehicleId || !topic.startsWith(`car/${selectedVehicleId}/`)) {
        return;
      }

      try {
        const payload = JSON.parse(message.toString()) as GPSMessage | FuelMessage | SpeedMessage;

        setStatus((current) => {
          const base = current ?? getInitialStatus(selectedVehicleId);

          if (topic.endsWith('/gps')) {
            const gpsPayload = payload as GPSMessage;
            return {
              ...base,
              latitude: gpsPayload.lat,
              longitude: gpsPayload.lng,
              timestamp: gpsPayload.timestamp,
            };
          }

          if (topic.endsWith('/fuel')) {
            const fuelPayload = payload as FuelMessage;
            return {
              ...base,
              fuelLevel: fuelPayload.level,
              timestamp: fuelPayload.timestamp,
            };
          }

          if (topic.endsWith('/speed')) {
            const speedPayload = payload as SpeedMessage;
            return {
              ...base,
              speed: speedPayload.speed,
              timestamp: speedPayload.timestamp,
            };
          }

          return base;
        });
      } catch (parseError) {
        console.error('MQTT payload parse error:', parseError);
      }
    });

    client.on('reconnect', () => {
      setConnectionState('connecting');
    });

    client.on('close', () => {
      setConnectionState('disconnected');
    });

    client.on('error', (mqttError) => {
      console.error('MQTT connection error:', mqttError);
      setConnectionState('error');
      setError('MQTT connection error. Check broker WebSocket availability.');
    });

    return () => {
      unsubscribeFromTopics();
      client.end(true);
      mqttClientRef.current = null;
    };
  }, [selectedVehicleId, unsubscribeFromTopics]);

  useEffect(() => {
    const client = mqttClientRef.current;
    if (!client || !selectedVehicleId || connectionState !== 'connected') {
      return;
    }

    const topics = [
      `car/${selectedVehicleId}/gps`,
      `car/${selectedVehicleId}/fuel`,
      `car/${selectedVehicleId}/speed`,
    ];

    unsubscribeFromTopics();
    client.subscribe(topics, (subscribeError) => {
      if (subscribeError) {
        console.error('MQTT resubscribe error:', subscribeError);
        setConnectionState('error');
        setError('Failed to subscribe after vehicle change');
        return;
      }

      subscribedTopicsRef.current = topics;
    });
  }, [connectionState, selectedVehicleId, unsubscribeFromTopics]);

  const hasTelemetry =
    status !== null &&
    (status.latitude !== 0 || status.longitude !== 0 || status.fuelLevel !== 0 || status.speed !== null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
            Phase 3.4 Dashboard
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                MyPSECar
              </h1>
              <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
                Monitor your personal vehicle with live fuel, GPS, and speed telemetry streamed
                over MQTT and backed by the vehicle status API.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300">
              <span className="font-semibold text-white">User:</span> {USER_ID}
            </div>
          </div>
        </header>

        {loadingVehicles ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-zinc-400">
            Loading registered vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h2 className="text-xl font-bold text-white">No vehicles found</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Seed or register a vehicle for user <span className="font-semibold">{USER_ID}</span>,
              then start the simulator with that vehicle ID.
            </p>
          </div>
        ) : (
          <>
            <VehicleSelector
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              onSelect={setSelectedVehicleId}
            />

            {error && (
              <div className="rounded-3xl border border-red-900/60 bg-red-950/40 px-5 py-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="space-y-6">
                <FuelGauge level={status?.fuelLevel ?? 0} />
                <VehicleStats
                  speed={status?.speed ?? null}
                  timestamp={hasTelemetry ? status?.timestamp ?? null : null}
                  fuelLevel={hasTelemetry ? status?.fuelLevel ?? null : null}
                  latitude={hasTelemetry ? status?.latitude ?? null : null}
                  longitude={hasTelemetry ? status?.longitude ?? null : null}
                  connectionState={connectionState}
                />
              </div>

              <div className="space-y-6">
                <VehicleMap
                  latitude={hasTelemetry ? status?.latitude ?? null : null}
                  longitude={hasTelemetry ? status?.longitude ?? null : null}
                  nickname={selectedVehicle?.nickname}
                />

                <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                    Dashboard status
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">System overview</h3>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Vehicle ID</p>
                      <p className="mt-2 break-all text-sm font-semibold text-white">
                        {selectedVehicleId}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">History rows</p>
                      <p className="mt-2 text-sm font-semibold text-white">{historyCount}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Status fetch</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {loadingStatus ? 'Refreshing...' : hasTelemetry ? 'Ready' : 'Awaiting data'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 text-sm leading-relaxed text-zinc-400">
                    MQTT topics: <code className="text-zinc-200">car/{selectedVehicleId}/gps</code>,
                    <code className="ml-2 text-zinc-200">car/{selectedVehicleId}/fuel</code>,
                    <code className="ml-2 text-zinc-200">car/{selectedVehicleId}/speed</code>
                  </p>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
