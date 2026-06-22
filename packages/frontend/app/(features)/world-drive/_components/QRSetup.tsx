"use client";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function QRSetup() {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tunnel-url")
      .then((res) => res.json())
      .then((d: { url: string | null }) => {
        if (d.url) {
          setQrValue(`${d.url}/m/world-drive`);
          setShortUrl(d.url.replace(/^https?:\/\//, ""));
        }
      })
      .catch(() => {});
  }, []);

  if (!qrValue) return null;

  return (
    <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-2xl">
      <div className="bg-white p-3 rounded-xl">
        <QRCode value={qrValue} size={120} />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-white">Mit Smartphone scannen</p>
        {shortUrl && (
          <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate max-w-[140px]">{shortUrl}</p>
        )}
      </div>
    </div>
  );
}
