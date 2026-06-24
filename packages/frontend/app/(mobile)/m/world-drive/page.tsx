"use client";
import { useEffect, useRef, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

const BROKER_WSS     = "wss://broker.hivemq.com:8884/mqtt";
const MAX_ACCURACY_M = 50;

const COLOR_OPTIONS = [
  { value: "#f97316", label: "Orange" },
  { value: "#3b82f6", label: "Blau"   },
  { value: "#22c55e", label: "Grün"   },
  { value: "#ec4899", label: "Pink"   },
  { value: "#a855f7", label: "Lila"   },
  { value: "#eab308", label: "Gelb"   },
];

type Screen     = "setup" | "active";
type MqttStatus = "connecting" | "connected" | "error" | "idle";
type GpsStatus  = "requesting" | "active" | "error";

interface RegisteredCar {
  id:    string;
  name:  string;
  color: string;
  topic: string;
}

export default function WorldDriveMobilePage() {
  const [screen,        setScreen]        = useState<Screen>("setup");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[2].value);
  const [registering,   setRegistering]   = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [car,          setCar]          = useState<RegisteredCar | null>(null);
  const [mqttStatus,   setMqttStatus]   = useState<MqttStatus>("idle");
  const [gpsStatus,    setGpsStatus]    = useState<GpsStatus>("requesting");
  const [coords,       setCoords]       = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [publishCount, setPublishCount] = useState(0);
  const [lastPublish,  setLastPublish]  = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const clientRef = useRef<MqttClient | null>(null);
  const watchRef  = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      clientRef.current?.end(true);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  async function handleStart() {
    setRegistering(true);
    setRegisterError(null);
    try {
      const res = await fetch("/api/world-drive/cars", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ color: selectedColor }),
      });
      if (!res.ok) throw new Error("Registrierung fehlgeschlagen");
      const registered = (await res.json()) as RegisteredCar;
      setCar(registered);
      setScreen("active");
      connectMqtt(registered.topic);
    } catch (err) {
      setRegisterError((err as Error).message);
    } finally {
      setRegistering(false);
    }
  }

  function startGps(topic: string) {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setError("Geolocation not supported.");
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy, speed } = pos.coords;
        setCoords({ lat, lng, accuracy: Math.round(accuracy) });
        setGpsStatus("active");

        const client = clientRef.current;
        if (client?.connected && accuracy <= MAX_ACCURACY_M) {
          client.publish(topic, JSON.stringify({ lat, lng, speed, timestamp: new Date().toISOString() }));
          setPublishCount((c) => c + 1);
          setLastPublish(new Date().toLocaleTimeString());
        }
      },
      () => { setGpsStatus("error"); setError("GPS permission denied."); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15_000 },
    );
  }

  function connectMqtt(topic: string) {
    setMqttStatus("connecting");
    const client = mqtt.connect(BROKER_WSS, {
      reconnectPeriod: 5000,
      connectTimeout:  30_000,
      keepalive:       60,
    });
    clientRef.current = client;

    client.on("connect",   () => { setMqttStatus("connected"); setError(null); startGps(topic); });
    client.on("reconnect", () => setMqttStatus("connecting"));
    client.on("error",     (err) => {
      const transient = err.message.toLowerCase().includes("timeout") ||
                        err.message.toLowerCase().includes("connack");
      if (!transient) setError(err.message);
      setMqttStatus("connecting");
    });
    client.on("close", () => setMqttStatus("connecting"));
  }

  const dot = (status: string) => {
    if (status === "connected" || status === "active") return "bg-green-400 animate-pulse";
    if (status === "connecting" || status === "requesting" || status === "idle") return "bg-yellow-400 animate-pulse";
    return "bg-red-500";
  };

  if (screen === "setup") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 py-12 bg-zinc-950">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-orange-500">PSECars</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">World Drive GPS</h1>
        <p className="text-sm text-zinc-400 text-center max-w-xs">Wähle eine Farbe für dein Fahrzeug auf der Karte.</p>

        {registerError && (
          <div className="w-full max-w-sm bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
            {registerError}
          </div>
        )}

        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Fahrzeugfarbe</p>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedColor(opt.value)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  selectedColor === opt.value ? "border-white scale-110" : "border-transparent opacity-60"
                }`}
                style={{ backgroundColor: opt.value }}
                title={opt.label}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={registering}
          className="w-full max-w-sm py-4 rounded-2xl text-base font-black uppercase tracking-widest text-white bg-orange-500 hover:bg-orange-400 disabled:opacity-50 transition-colors"
        >
          {registering ? "Wird gestartet…" : "GPS starten"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 py-12 bg-zinc-950">
      <p className="text-xs font-bold tracking-[0.25em] uppercase text-orange-500">PSECars</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-white">World Drive GPS</h1>

      {car && (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: car.color }} />
          <p className="text-sm font-semibold text-white">{car.name} (GPS)</p>
        </div>
      )}

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
              {gpsStatus === "requesting" && "Waiting for permission…"}
              {gpsStatus === "active" && coords && (
                coords.accuracy <= MAX_ACCURACY_M
                  ? `±${coords.accuracy} m — sending`
                  : `±${coords.accuracy} m — waiting for signal…`
              )}
              {gpsStatus === "error" && "GPS unavailable"}
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
