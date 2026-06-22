"use client";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function QRSetup() {
  const [qrValue, setQrValue] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tunnel-url")
      .then((res) => res.json())
      .then((d: { url: string | null }) => {
        if (d.url) setQrValue(`${d.url}/m/world-drive`);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight text-white mb-1">
          Phone GPS Setup
        </h2>
        <p className="text-sm text-zinc-500">
          Scan the QR code with your phone to send live GPS coordinates via HiveMQ.
        </p>
      </div>

      {qrValue ? (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCode value={qrValue} size={200} />
          </div>
          <p className="text-xs text-zinc-500 text-center max-w-sm break-all">{qrValue}</p>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 border border-dashed border-zinc-700 rounded-xl">
          <p className="text-sm text-zinc-600">Tunnel not active</p>
        </div>
      )}
    </div>
  );
}