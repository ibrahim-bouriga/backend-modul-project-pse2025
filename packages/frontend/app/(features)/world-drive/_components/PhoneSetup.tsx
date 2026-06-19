"use client";
import { useState } from "react";
import QRCode from "react-qr-code";

export default function PhoneSetup() {
  const [frontendUrl, setFrontendUrl] = useState("");
  const [mqttUrl,     setMqttUrl]     = useState("");

  const clean = (u: string) => u.trim().replace(/\/$/, "");

  const qrValue =
    frontendUrl && mqttUrl
      ? `${clean(frontendUrl)}/world-drive?mode=gps&broker=${encodeURIComponent(clean(mqttUrl))}`
      : "";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight text-white mb-1">
          Phone GPS Setup
        </h2>
        <p className="text-sm text-zinc-500">
          Run two Cloudflare tunnels, enter the URLs below, then scan the QR code with your phone.
        </p>
      </div>

      {/* Terminal instructions */}
      <div className="bg-zinc-950 rounded-xl p-4 space-y-2 font-mono text-sm">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Terminal</p>
        <p>
          <span className="text-zinc-600"># Terminal 1 — Frontend</span>
        </p>
        <p className="text-green-400">cloudflared tunnel --url http://localhost:3000</p>
        <p className="mt-2">
          <span className="text-zinc-600"># Terminal 2 — MQTT WebSocket</span>
        </p>
        <p className="text-green-400">cloudflared tunnel --url http://localhost:9001</p>
      </div>

      {/* URL inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            Frontend Tunnel URL
          </label>
          <input
            type="url"
            value={frontendUrl}
            onChange={(e) => setFrontendUrl(e.target.value)}
            placeholder="https://abc.trycloudflare.com"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            MQTT Broker WSS URL
          </label>
          <input
            type="url"
            value={mqttUrl}
            onChange={(e) => setMqttUrl(e.target.value)}
            placeholder="wss://xyz.trycloudflare.com"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      {/* QR Code */}
      {qrValue ? (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCode value={qrValue} size={180} />
          </div>
          <p className="text-xs text-zinc-500 text-center max-w-xs break-all">{qrValue}</p>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 border border-dashed border-zinc-700 rounded-xl">
          <p className="text-sm text-zinc-600">Enter both URLs to generate QR code</p>
        </div>
      )}
    </div>
  );
}
