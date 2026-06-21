"use client";

import mqtt, { MqttClient } from "mqtt";
import { useEffect, useRef, useState } from "react";

const BROKER_WSS  = "wss://broker.hivemq.com:8884/mqtt";
const TOPIC_FUEL  = "psecars/mypsecars/fuel";
const TOPIC_POS   = "psecars/mypsecars/position";

type MqttStatus = "connecting" | "connected" | "error" | "idle";
type GpsStatus  = "idle" | "active" | "error";

export default function PhonePage() {
  const [mqttStatus, setMqttStatus] = useState<MqttStatus>("connecting");
  const [gpsStatus,  setGpsStatus]  = useState<GpsStatus>("idle");
  const [coords,     setCoords]     = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [fuel,       setFuel]       = useState(75);
  const [pubCount,   setPubCount]   = useState(0);
  const [lastSent,   setLastSent]   = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [autoSend,   setAutoSend]   = useState(true);

  const clientRef  = useRef<MqttClient | null>(null);
  const watchRef   = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connect to HiveMQ
  useEffect(() => {
    const client = mqtt.connect(BROKER_WSS, { reconnectPeriod: 5000, connectTimeout: 10_000 });
    clientRef.current = client;

    client.on("connect", () => { setMqttStatus("connected"); setError(null); });
    client.on("error",   (err) => { setMqttStatus("error"); setError(err.message); });
    client.on("close",   () => setMqttStatus("idle"));
    client.on("reconnect", () => setMqttStatus("connecting"));

    return () => { client.end(true); };
  }, []);

  // Watch GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setError("Geolocation nicht unterstützt");
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        setGpsStatus("active");
        setError(null);
      },
      () => { setGpsStatus("error"); setError("GPS-Zugriff verweigert"); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15_000 },
    );
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  function publish() {
    const client = clientRef.current;
    if (!client?.connected) return;

    client.publish(TOPIC_FUEL, String(fuel));
    if (coords) {
      client.publish(TOPIC_POS, JSON.stringify({ lat: coords.lat, lng: coords.lng, timestamp: new Date().toISOString() }));
    }
    setPubCount((c) => c + 1);
    setLastSent(new Date().toLocaleTimeString());
  }

  // Auto-send every 3s
  useEffect(() => {
    if (autoSend) {
      intervalRef.current = setInterval(publish, 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, fuel, coords]);

  const dot = (ok: boolean, warn = false) =>
    ok ? "bg-green-400 animate-pulse" : warn ? "bg-yellow-400 animate-pulse" : "bg-red-500";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5 px-6 py-12 bg-zinc-950">
      <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/40">PSECars</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-white">MyPSECar GPS</h1>

      {error && (
        <div className="w-full max-w-sm bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="w-full max-w-sm space-y-3">
        {/* MQTT Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot(mqttStatus === "connected", mqttStatus === "connecting")}`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">MQTT Broker</p>
            <p className="text-sm text-white">
              {mqttStatus === "connecting" && "Verbinde…"}
              {mqttStatus === "connected"  && "Verbunden · HiveMQ"}
              {mqttStatus === "error"      && "Verbindung fehlgeschlagen"}
              {mqttStatus === "idle"       && "Getrennt"}
            </p>
          </div>
        </div>

        {/* GPS Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot(gpsStatus === "active", gpsStatus === "idle")}`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">GPS</p>
            <p className="text-sm text-white">
              {gpsStatus === "idle"   && "Warte auf Signal…"}
              {gpsStatus === "active" && coords && `±${coords.accuracy} m Genauigkeit`}
              {gpsStatus === "error"  && "GPS nicht verfügbar"}
            </p>
          </div>
        </div>

        {/* Position */}
        {coords && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Position</p>
            <p className="font-mono text-white text-sm">{coords.lat.toFixed(6)}</p>
            <p className="font-mono text-white text-sm">{coords.lng.toFixed(6)}</p>
          </div>
        )}

        {/* Fuel Slider */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Fuel Level</p>
            <span className="font-black text-white text-lg">{fuel}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={fuel}
            onChange={(e) => setFuel(Number(e.target.value))}
            className="w-full accent-white h-2"
          />
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${fuel > 50 ? "bg-green-500" : fuel > 20 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${fuel}%` }}
            />
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={publish}
          disabled={mqttStatus !== "connected"}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl disabled:opacity-40"
        >
          Jetzt senden
        </button>

        {/* Auto-send toggle */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
          <div>
            <p className="text-sm font-bold text-white">Auto-Senden</p>
            <p className="text-xs text-zinc-500">alle 3 Sekunden</p>
          </div>
          <button
            onClick={() => setAutoSend((v) => !v)}
            className={`w-12 h-7 rounded-full transition-colors relative ${autoSend ? "bg-white" : "bg-zinc-700"}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-black transition-all ${autoSend ? "left-6" : "left-1"}`} />
          </button>
        </div>

        {pubCount > 0 && (
          <p className="text-center text-xs text-zinc-500 font-mono">
            {pubCount} gesendet · zuletzt {lastSent}
          </p>
        )}
      </div>
    </div>
  );
}
