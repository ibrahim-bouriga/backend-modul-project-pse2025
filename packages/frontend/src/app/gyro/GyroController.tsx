"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import mqtt, { MqttClient } from "mqtt";

const BROKER_WS_URL = "wss://broker.hivemq.com:8884/mqtt";
const TOPIC_PREFIX = "pse2025/carworld";
const PUBLISH_HZ = 20; // Nachrichten pro Sekunde

type Status = "idle" | "connecting" | "connected" | "error";

export default function GyroController() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? "";

  const [status, setStatus] = useState<Status>("idle");
  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });

  const clientRef = useRef<MqttClient | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gyroRef = useRef({ beta: 0, gamma: 0 });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  function cleanup() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    clientRef.current?.end(true);
    clientRef.current = null;
  }

  async function start() {
    if (!sessionId || status === "connected") return;
    cleanup();
    setStatus("connecting");

    // iOS 13+ erfordert explizite Genehmigung für DeviceOrientationEvent
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm !== "granted") {
          setStatus("error");
          return;
        }
      } catch {
        setStatus("error");
        return;
      }
    }

    // Gyro-Daten lesen
    const onOrientation = (e: DeviceOrientationEvent) => {
      const b = e.beta ?? 0;
      const g = e.gamma ?? 0;
      gyroRef.current = { beta: b, gamma: g };
      if (mountedRef.current) setTilt({ beta: Math.round(b), gamma: Math.round(g) });
    };
    window.addEventListener("deviceorientation", onOrientation);

    // MQTT verbinden
    const client = mqtt.connect(BROKER_WS_URL, {
      clientId: `gyro-${sessionId.slice(0, 8)}-${Date.now()}`,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
    });
    clientRef.current = client;

    client.once("connect", () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      const topic = `${TOPIC_PREFIX}/${sessionId}/gyro`;
      intervalRef.current = setInterval(() => {
        const { beta, gamma } = gyroRef.current;
        client.publish(
          topic,
          JSON.stringify({ beta, gamma, timestamp: Date.now() })
        );
      }, Math.round(1000 / PUBLISH_HZ));
    });

    client.on("reconnect", () => { if (mountedRef.current) setStatus("connecting"); });
    client.on("connect", () => { if (mountedRef.current) setStatus("connected"); });
    client.on("error", () => { if (mountedRef.current) setStatus("error"); });
    client.on("offline", () => {
      if (mountedRef.current) setStatus("connecting");
    });

    // Gyro-Listener beim Unmount entfernen
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }

  const isHttps =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" || window.location.hostname === "localhost");

  if (!sessionId) {
    return (
      <div style={pageStyle}>
        <p style={{ textAlign: "center", color: "#f88" }}>
          Kein Session-Code gefunden.
          <br />
          Bitte QR-Code erneut scannen.
        </p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h2 style={{ margin: "0 0 28px", fontSize: 22, letterSpacing: 1 }}>
        Auto steuern
      </h2>

      {/* iOS-Warnung bei HTTP */}
      {!isHttps && (
        <div
          style={{
            background: "#3a1a00",
            border: "1px solid #f90",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: "#ffa040",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          ⚠️ <strong>iOS / Safari</strong>: Gyro benötigt HTTPS.
          <br />
          Seite via <code>https://</code> öffnen (z.B. ngrok).
        </div>
      )}

      {status === "idle" && (
        <button onClick={start} style={btnStyle}>
          Verbinden &amp; starten
        </button>
      )}

      {status === "connecting" && (
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <p style={{ marginTop: 16, color: "#aaa" }}>Verbinde…</p>
        </div>
      )}

      {status === "connected" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✓</div>
          <p style={{ color: "#4caf50", margin: "0 0 28px", fontSize: 18 }}>
            Verbunden
          </p>

          {/* Visuelles Tilt-Display */}
          <TiltDisplay beta={tilt.beta} gamma={tilt.gamma} />

          <div
            style={{
              fontFamily: "monospace",
              fontSize: 14,
              color: "#bbb",
              marginTop: 20,
              lineHeight: 2,
            }}
          >
            β {tilt.beta > 0 ? "+" : ""}{tilt.beta}° — Gas/Bremse
            <br />
            γ {tilt.gamma > 0 ? "+" : ""}{tilt.gamma}° — Lenken
          </div>

          <p style={{ fontSize: 12, color: "#666", marginTop: 24, lineHeight: 1.6 }}>
            Handy nach vorne neigen = Gas
            <br />
            Rückwärts neigen = Bremse
            <br />
            Links/rechts kippen = Lenken
          </p>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#f55", marginBottom: 20 }}>
            Verbindung fehlgeschlagen.
            <br />
            Gyro-Berechtigung verweigert?
          </p>
          <button onClick={start} style={btnStyle}>
            Erneut versuchen
          </button>
        </div>
      )}
    </div>
  );
}

// Zeigt Handy-Neigung als Ball in einem Quadrat
function TiltDisplay({ beta, gamma }: { beta: number; gamma: number }) {
  const TILT_MAX = 30;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v / TILT_MAX));
  const x = 50 + clamp(gamma) * 45; // 5% … 95%
  const y = 50 - clamp(beta) * 45;

  return (
    <div
      style={{
        width: 140,
        height: 140,
        border: "2px solid #333",
        borderRadius: 12,
        position: "relative",
        margin: "0 auto",
        background: "#1a1a2e",
      }}
    >
      {/* Kreuz-Linien */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px solid #333" }} />
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, borderLeft: "1px solid #333" }} />
      {/* Ball */}
      <div
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#4caf50",
          left: `calc(${x}% - 10px)`,
          top: `calc(${y}% - 10px)`,
          transition: "left 0.05s, top 0.05s",
        }}
      />
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: "3px solid #333",
        borderTop: "3px solid #4caf50",
        borderRadius: "50%",
        margin: "0 auto",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

const pageStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: 24,
  boxSizing: "border-box",
  fontFamily: "sans-serif",
  background: "#0f0f1a",
  color: "#fff",
  userSelect: "none",
  WebkitUserSelect: "none",
};

const btnStyle: React.CSSProperties = {
  padding: "16px 36px",
  fontSize: 18,
  background: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
  letterSpacing: 0.5,
};
