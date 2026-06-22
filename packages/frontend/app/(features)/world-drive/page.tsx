import MapFrame from "./_components/MapFrame";
import QRSetup from "./_components/QRSetup";

export default function WorldDrivePage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-16 space-y-10">
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-4">
            World Drive
          </h1>
          <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
            Follow the manufacturers super car as it roams the globe with live GPS.
          </p>
        </div>
        <QRSetup />
      </div>
      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <MapFrame />
      </div>
    </div>
  );
}
