import QRCode from "react-qr-code";
import { getTunnelUrl } from "../../../_lib/tunnel";

// Server Component — calls getTunnelUrl() directly (no useEffect needed)
export default async function PhoneQRCode() {
  const tunnelUrl = await getTunnelUrl();
  const phoneUrl  = tunnelUrl ? `${tunnelUrl}/m/mypsecars` : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          Handy verbinden
        </h2>
        <span className={`text-xs uppercase tracking-widest font-semibold px-2 py-1 rounded ${
          phoneUrl ? "bg-green-900 text-green-400" : "bg-zinc-800 text-zinc-500"
        }`}>
          {phoneUrl ? "Tunnel aktiv" : "Kein Tunnel"}
        </span>
      </div>

      {phoneUrl ? (
        <div className="flex gap-6 items-start">
          <div className="bg-white p-4 rounded-xl shrink-0">
            <QRCode value={phoneUrl} size={160} />
          </div>
          <div className="space-y-2 pt-1">
            <p className="text-zinc-400 text-sm leading-relaxed">
              QR Code mit dem Handy scannen. GPS + Tankstand werden direkt über HiveMQ gesendet.
            </p>
            <a
              href={phoneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-zinc-500 hover:text-white underline break-all"
            >
              {phoneUrl}
            </a>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-zinc-400 text-sm">
            Ngrok-Tunnel nicht erreichbar. Docker mit{" "}
            <code className="bg-zinc-800 px-1 rounded">prod</code>-Profil starten.
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Lokal testen:{" "}
            <a href="/m/mypsecars" className="underline hover:text-white" target="_blank">
              /m/mypsecars
            </a>
          </p>
        </div>
      )}
    </div>
  );
}