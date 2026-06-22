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

  if (!qrValue) return null;

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="bg-white p-3 rounded-xl">
        <QRCode value={qrValue} size={96} />
      </div>
      <p className="text-xs text-zinc-500 text-center leading-snug">
        Mit Handy scannen &amp;<br />live GPS übertragen
      </p>
    </div>
  );
}