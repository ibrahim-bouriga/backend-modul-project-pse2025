import mqtt, { MqttClient } from "mqtt";
import QRCode from "qrcode";
import type { CarInput, GyroData } from "./types";

// Verwendet TLS-WebSocket (Port 8884) aus MQTT_CONFIG, da ws:// (Port 8000)
// von HTTPS-Seiten als Mixed Content blockiert wird.
const BROKER_WS_URL = "wss://broker.hivemq.com:8884/mqtt";

// crypto.randomUUID() erfordert einen Secure Context (HTTPS / localhost).
// Über http://IP:3000 steht es nicht zur Verfügung → Fallback auf getRandomValues.
function generateUUID(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const TOPIC_PREFIX = "pse2025/carworld";

const TILT_MAX = 25; // Grad
const DEADZONE = 3; // Grad

const RESPONSE_CURVE_EXPONENT = 0.5;

// Falls länger als diese Zeitspanne keine neue Gyro-Nachricht eintrifft, gilt das Smartphone als "getrennt" (Handy inaktiv) und die Steuerung wird auf 0/0 zurückgesetzt.
const PHONE_TIMEOUT_MS = 1000;

interface CalibrationOffset {
  beta: number;
  gamma: number;
}

function gyroToCarInput(
  beta: number,
  gamma: number,
  offset: CalibrationOffset,
): CarInput {
  // Offset wird VOR der Normalisierung abgezogen: die kalibrierte Position wird dadurch zum neuen Nullpunkt
  const adjustedBeta = beta - offset.beta;
  const adjustedGamma = gamma - offset.gamma;

  const normalize = (v: number): number => {
    const clamped = Math.max(-1, Math.min(1, v / TILT_MAX));
    return (
      Math.sign(clamped) * Math.pow(Math.abs(clamped), RESPONSE_CURVE_EXPONENT)
    );
  };
  const deadzone = (v: number) => (Math.abs(v) < DEADZONE / TILT_MAX ? 0 : v);
  return {
    throttle: deadzone(normalize(adjustedBeta)),
    steering: deadzone(normalize(adjustedGamma)),
  };
}

export class MQTTController {
  readonly sessionId: string;
  private client: MqttClient | null = null;
  private _connected = false;
  private _input: CarInput = { throttle: 0, steering: 0 };
  // Zeitpunkt der letzten empfangenen Gyro-Nachricht (Date.now()-Wert).
  // null = noch nie eine Nachricht empfangen.
  private lastMessageAt: number | null = null;
  private watchdogInterval: ReturnType<typeof setInterval> | null = null;

  // Letzte rohen Gyro-Werte, werden bei einem Kalibrierungs-Signal als
  // neuer Nullpunkt übernommen.
  private lastRawGyro: { beta: number; gamma: number } = { beta: 0, gamma: 0 };
  private calibrationOffset: CalibrationOffset = { beta: 0, gamma: 0 };

  constructor() {
    this.sessionId = generateUUID();
  }

  get isConnected(): boolean {
    return this._connected;
  }

  get input(): CarInput {
    return this._input;
  }
  /**
   * true, wenn der Broker erreichbar ist UND innerhalb der letzten
   * PHONE_TIMEOUT_MS eine Gyro-Nachricht vom Smartphone eingetroffen ist
   */
  get isPhoneActive(): boolean {
    if (!this._connected || this.lastMessageAt === null) return false;
    return Date.now() - this.lastMessageAt < PHONE_TIMEOUT_MS;
  }

  /** Aktueller Kalibrierungs-Offset, z.B. für eine Debug-Anzeige nutzbar. */
  get calibration(): CalibrationOffset {
    return { ...this.calibrationOffset };
  }

  /**
   * Setzt die Kalibrierung manuell zurück auf 0/0 (z.B. über einen
   * "Zurücksetzen"-Button auf der Desktop-Seite, falls gewünscht).
   */
  resetCalibration(): void {
    this.calibrationOffset = { beta: 0, gamma: 0 };
  }

  // Nicht-blockierend: Promise löst sich auf, sobald die erste Verbindung steht.
  // Falls kein Netz, bleibt die Promise pending – das ist OK (Keyboard-Fallback aktiv).
  connect(): Promise<void> {
    return new Promise((resolve) => {
      this.client = mqtt.connect(BROKER_WS_URL, {
        clientId: `carworld-${this.sessionId.slice(0, 8)}`,
        reconnectPeriod: 5000,
        connectTimeout: 12000,
      });

      // Nur beim allerersten Connect resolven
      this.client.once("connect", () => {
        this._connected = true;
        this.client!.subscribe(`${TOPIC_PREFIX}/${this.sessionId}/gyro`);
        this.client!.subscribe(`${TOPIC_PREFIX}/${this.sessionId}/calibrate`);

        // Watchdog: prüft alle 200ms, ob die letzte Nachricht zu lange zurückliegt.
        this.watchdogInterval = setInterval(() => {
          if (!this.isPhoneActive && this.lastMessageAt !== null) {
            this._input = { throttle: 0, steering: 0 };
          }
        }, 200);

        resolve();
      });

      // Re-connect nach Verbindungsabbruch
      this.client.on("connect", () => {
        this._connected = true;
      });
      this.client.on("reconnect", () => {
        this._connected = false;
      });
      this.client.on("offline", () => {
        this._connected = false;
        this._input = { throttle: 0, steering: 0 };
      });

      this.client.on("message", (topic: string, payload: Buffer) => {
        // Kalibrierungs-Signal: übernimmt die letzten bekannten Rohwerte
        // als neuen Nullpunkt. Kein Parsen des Payloads nötig, da der
        // Zeitpunkt des Empfangs selbst das relevante Signal ist.
        if (topic.endsWith("/calibrate")) {
          this.calibrationOffset = { ...this.lastRawGyro };
          return;
        }

        try {
          const data = JSON.parse(payload.toString()) as GyroData;
          if (Date.now() - data.timestamp > 500) return; // verworfen: zu alt

          this.lastMessageAt = Date.now();
          this.lastRawGyro = { beta: data.beta, gamma: data.gamma };
          this._input = gyroToCarInput(
            data.beta,
            data.gamma,
            this.calibrationOffset,
          );
        } catch {
          // fehlerhafte Nachricht ignorieren
        }
      });
    });
  }
  /**
   * Fragt die eigene Next.js API-Route ab, die den Tunnel-Link serverseitig
   * ermittelt. Direkter Zugriff auf ngrok:4040 ist im Browser nicht möglich
   * (Docker-interner Hostname, ERR_NAME_NOT_RESOLVED) - daher dieser Umweg
   * über die bereits vorhandene Route app/api/tunnel-url/route.ts.
   */
  private async fetchTunnelUrl(): Promise<string | null> {
    try {
      const res = await fetch("/api/tunnel-url", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url ?? null;
    } catch (e) {
      console.log("Error fetching tunnel url:", e);
      return null;
    }
  }

  // Rendert QR-Code mit URL zur mobilen Steuerungsseite.
  // origin = window.location.origin (aus Client-Code übergeben, z.B. "http://192.168.1.x:3000")
  async renderQRCode(canvas: HTMLCanvasElement, origin: string): Promise<void> {
    const tunnelUrl = await this.fetchTunnelUrl();
    console.log("Tunnel-URL:", tunnelUrl);
    const url = `${tunnelUrl}/m/driving-simulation?session=${this.sessionId}`;
    return QRCode.toCanvas(canvas, url, { width: 180, margin: 1 });
  }

  // Optionaler Status-Kanal: Browser → Smartphone
  publishStatus(status: string): void {
    if (!this.client || !this._connected) return;
    this.client.publish(`${TOPIC_PREFIX}/${this.sessionId}/status`, status);
  }

  disconnect(): void {
    this._connected = false;
    this._input = { throttle: 0, steering: 0 };
    this.client?.end(true);
    this.client = null;
  }
}
