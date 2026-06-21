import mqtt, { MqttClient } from "mqtt";
import QRCode from "qrcode";
import type { CarInput, GyroData } from "./types";
import { MQTT_CONFIG } from "../../../../../mqtt/config";

// Verwendet TLS-WebSocket (Port 8884) aus MQTT_CONFIG, da ws:// (Port 8000)
// von HTTPS-Seiten als Mixed Content blockiert wird.
const BROKER_WS_URL = MQTT_CONFIG.brokerUrls.tlsWebsocket;

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

const TILT_MAX = 30; // Grad
const DEADZONE = 5; // Grad

function gyroToCarInput(beta: number, gamma: number): CarInput {
  const normalize = (v: number) => Math.max(-1, Math.min(1, v / TILT_MAX));
  const deadzone = (v: number) => (Math.abs(v) < DEADZONE / TILT_MAX ? 0 : v);
  return {
    throttle: deadzone(normalize(beta)),
    steering: deadzone(normalize(gamma)),
  };
}

export class MQTTController {
  readonly sessionId: string;
  private client: MqttClient | null = null;
  private _connected = false;
  private _input: CarInput = { throttle: 0, steering: 0 };

  constructor() {
    this.sessionId = generateUUID();
  }

  get isConnected(): boolean {
    return this._connected;
  }

  get input(): CarInput {
    return this._input;
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

      this.client.on("message", (_topic: string, payload: Buffer) => {
        try {
          const data = JSON.parse(payload.toString()) as GyroData;
          if (Date.now() - data.timestamp > 500) return; // verworfen: zu alt
          this._input = gyroToCarInput(data.beta, data.gamma);
        } catch {
          // fehlerhafte Nachricht ignorieren
        }
      });
    });
  }

  // Rendert QR-Code mit URL zur mobilen Steuerungsseite.
  // origin = window.location.origin (aus Client-Code übergeben, z.B. "http://192.168.1.x:3000")
  renderQRCode(canvas: HTMLCanvasElement, origin: string): Promise<void> {
    const url = `${origin}/gyro?session=${this.sessionId}`;
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
