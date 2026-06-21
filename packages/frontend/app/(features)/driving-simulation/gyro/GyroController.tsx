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
  // Zeigt dem Nutzer kurz "Kalibriert!" nach Knopfdruck, kein
  // funktionaler State, nur visuelles Feedback.
  const [justCalibrated, setJustCalibrated] = useState(false);
  // Steuert, ob das Gerät aktuell im Portrait-Modus ist. Wird genutzt, um
  // sowohl die UI zu blockieren als auch das Publizieren der Gyro-Daten
  // zu unterbrechen – ein reines UI-Overlay würde das Senden im Hintergrund
  // nicht verhindern.
  const [isPortrait, setIsPortrait] = useState(true);

  const clientRef = useRef<MqttClient | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gyroRef = useRef({ beta: 0, gamma: 0 });
  const mountedRef = useRef(true);
  // isPortrait als Ref gespiegelt, damit der setInterval-Callback (der
  // außerhalb des Render-Zyklus läuft) immer den aktuellen Wert sieht,
  // ohne dass das Interval bei jeder Orientierungsänderung neu gestartet
  // werden muss.
  const isPortraitRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // matchMedia reagiert live auf Drehungen, ohne dass man resize-Events
    // manuell debouncen muss – breit unterstützt in mobilen Browsern.
    const mql = window.matchMedia("(orientation: portrait)");
    const updateOrientation = (e: MediaQueryList | MediaQueryListEvent) => {
      isPortraitRef.current = e.matches;
      if (mountedRef.current) setIsPortrait(e.matches);
    };
    updateOrientation(mql);
    mql.addEventListener("change", updateOrientation);

    return () => {
      mountedRef.current = false;
      mql.removeEventListener("change", updateOrientation);
      cleanup();
    };
  }, []);

  function cleanup() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    clientRef.current?.end(true);
    clientRef.current = null;
  }

  // Sendet ein Kalibrierungs-Signal an die Desktop-Seite. Payload enthält
  // bewusst keine beta/gamma-Werte – die Desktop-Seite kennt die aktuell
  // letzten empfangenen Rohwerte bereits aus dem laufenden Gyro-Stream und
  // übernimmt genau diese als neuen Nullpunkt. Das vermeidet eine Race-
  // Condition zwischen zwei separaten Topics mit potenziell unterschiedlichem
  // Timing.
  function calibrate() {
    if (!clientRef.current || status !== "connected" || isPortraitRef.current)
      return;
    clientRef.current.publish(
      `${TOPIC_PREFIX}/${sessionId}/calibrate`,
      JSON.stringify({ timestamp: Date.now() }),
    );
    setJustCalibrated(true);
    setTimeout(() => setJustCalibrated(false), 1500);
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
    // EMPIRISCH VERIFIZIERT (nicht mehr vermutet): DeviceOrientationEvent.beta
    // misst die Vorne/Hinten-Neigung relativ zum GERÄT, nicht zum Bildschirm.
    // Im Landscape liegt das Gerät auf der Seite, wodurch "nach vorne neigen"
    // (visuell) physikalisch eine Drehung ist, die der Sensor überwiegend als
    // gamma-Änderung registriert, nicht als beta-Änderung. Gemessene Werte:
    //   flach:           beta≈2,  gamma≈0
    //   nach vorne:       beta≈1,  gamma≈17   → gamma reagiert, nicht beta
    //   nach rechts:      beta≈24, gamma≈63   → beta reagiert auf Lenkung
    // Daher: throttle aus gamma, steering aus beta (vertauscht ggü. Portrait).
    const onOrientation = (e: DeviceOrientationEvent) => {
      const rawBeta = e.beta ?? 0;
      const rawGamma = e.gamma ?? 0;

      // Vertauscht: "vorwärts" (für throttle) kommt aus gamma,
      // "lenken" (für steering) kommt aus beta.
      const forward = rawGamma;
      const steer = rawBeta;

      gyroRef.current = { beta: forward, gamma: steer };
      if (mountedRef.current) {
        setTilt({ beta: Math.round(forward), gamma: Math.round(steer) });
      }
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
      intervalRef.current = setInterval(
        () => {
          // Im Portrait-Modus wird nichts gesendet – verhindert, dass beim
          // Drehen des Geräts kurzzeitig unbeabsichtigte Werte durchrutschen,
          // und stellt sicher, dass die Blockade nicht nur kosmetisch ist.
          if (isPortraitRef.current) return;
          const { beta, gamma } = gyroRef.current;
          client.publish(
            topic,
            JSON.stringify({ beta, gamma, timestamp: Date.now() }),
          );
        },
        Math.round(1000 / PUBLISH_HZ),
      );
    });

    client.on("reconnect", () => {
      if (mountedRef.current) setStatus("connecting");
    });
    client.on("connect", () => {
      if (mountedRef.current) setStatus("connected");
    });
    client.on("error", () => {
      if (mountedRef.current) setStatus("error");
    });
    client.on("offline", () => {
      if (mountedRef.current) setStatus("connecting");
    });

    // Gyro-Listener beim Unmount entfernen
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }

  const isHttps =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      window.location.hostname === "localhost");

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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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

      {status === "connected" && isPortrait && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📱↻</div>
          <p style={{ fontSize: 18, marginBottom: 8, fontWeight: 600 }}>
            Bitte Handy drehen
          </p>
          <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.6 }}>
            Die Steuerung funktioniert nur im
            <br />
            Querformat (Landscape).
          </p>
        </div>
      )}

      {status === "connected" && !isPortrait && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✓</div>
          <p style={{ color: "#4caf50", margin: "0 0 28px", fontSize: 18 }}>
            Verbunden
          </p>

          {/* Kalibrierungs-Button */}
          <button
            onClick={calibrate}
            style={{
              ...calibrateBtnStyle,
              background: justCalibrated ? "#4caf50" : "#2a2a3e",
            }}
          >
            {justCalibrated
              ? "✓ Kalibriert"
              : "Aktuelle Haltung als Mitte festlegen"}
          </button>

          <p
            style={{
              fontSize: 12,
              color: "#666",
              marginTop: 24,
              lineHeight: 1.6,
            }}
          >
            Handy nach vorne neigen = Gas
            <br />
            Rückwärts neigen = Bremse
            <br />
            Links/rechts kippen = Lenken
            <br />
            <br />
            Halte das Handy in deiner bevorzugten Griffposition und tippe oben,
            um sie als neutrale Mitte zu setzen.
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

const calibrateBtnStyle: React.CSSProperties = {
  marginTop: 24,
  padding: "12px 24px",
  fontSize: 15,
  color: "#fff",
  border: "1px solid #444",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
  letterSpacing: 0.3,
  transition: "background 0.2s",
};
