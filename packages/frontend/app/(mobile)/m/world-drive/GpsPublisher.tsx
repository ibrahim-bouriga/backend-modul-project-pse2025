"use client";
import { useEffect, useRef, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

const TOPIC      = "psecars/worlddrive/telemetry";
const BROKER_WSS = "wss://broker.hivemq.com:8884/mqtt";

type MqttStatus = "connecting" | "connected" | "error" | "idle";
type GpsStatus  = "idle" | "active" | "error";

export default function GpsPublisher() {
  const [mqttStatus,    setMqttStatus]    = useState<MqttStatus>("idle");
  const [gpsStatus,     setGpsStatus]     = useState<GpsStatus>("idle");
  const [coords,        setCoords]        = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [publishCount,  setPublishCount]  = useState(0);
  const [lastPublish,   setLastPublish]   = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  const clientRef = useRef<MqttClient | null>(null);
  const watchRef  = useRef<number | null>(null);

  useEffect(() => {
    setMqttStatus("connecting");

    const client = mqtt.connect(BROKER_WSS, { reconnectPeriod: 5000, connectTimeout: 10_000 });
    clientRef.current = client;

    client.on("connect", () => {
      setMqttStatus("connected");
      setError(null);
      startGps(client);
    });

    client.on("error", (err) => {
      setMqttStatus("error");
      setError(err.message);
    });

    client.on("close", () => setMqttStatus("idle"));

    return () => {
      client.end(true);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  function startGps(client: MqttClient) {
    if (!navigator.geolocation) { setGpsStatus("error"); setError("Geolocation not supported."); return; }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy, speed } = pos.coords;
        setCoords({ lat, lng, accuracy: Math.round(accuracy) });
        setGpsStatus("active");

        if (client.connected) {
          client.publish(TOPIC, JSON.stringify({ lat, lng, speed, timestamp: new Date().toISOString() }));
          setPublishCount((c) => c + 1);
          setLastPublish(new Date().toLocaleTimeString());
        }
      },
      () => { setGpsStatus("error"); setError("GPS permission denied."); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15_000 },
    );
  }

  const dot = (status: string) => {
    if (status === "connected" || status === "active") return "bg-green-400 animate-pulse";
    if (status === "connecting" || status === "idle")  return "bg-yellow-400 animate-pulse";
    return "bg-red-500";
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 py-12 bg-zinc-950">
      <p className="text-xs font-bold tracking-[0.25em] uppercase text-orange-500">PSECars</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-white">World Drive GPS</h1>

      {error && (
        <div className="w-full max-w-sm bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="w-full max-w-sm space-y-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot(mqttStatus)}`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">MQTT Broker</p>
            <p className="text-sm text-white">
              {mqttStatus === "connecting" && "Connecting…"}
              {mqttStatus === "connected"  && "Connected · HiveMQ"}
              {mqttStatus === "error"      && "Connection failed"}
              {mqttStatus === "idle"       && "Disconnected"}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot(gpsStatus)}`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">GPS</p>
            <p className="text-sm text-white">
              {gpsStatus === "idle"   && "Waiting for MQTT…"}
              {gpsStatus === "active" && coords && `±${coords.accuracy} m accuracy`}
              {gpsStatus === "error"  && "GPS unavailable"}
            </p>
          </div>
        </div>

        {coords && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Position</p>
            <p className="font-mono text-white text-sm">{coords.lat.toFixed(6)}</p>
            <p className="font-mono text-white text-sm">{coords.lng.toFixed(6)}</p>
          </div>
        )}

        {publishCount > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Published</p>
            <p className="text-white text-sm">{publishCount} updates · last at {lastPublish}</p>
          </div>
        )}
      </div>
    </div>
  );
}
