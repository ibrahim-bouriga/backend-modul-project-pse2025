import { Suspense } from "react";
import WorldDriveApp from "./_components/mobile/WorldDriveApp";

export default function WorldDrivePage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-16 space-y-10">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
          Feature Module
        </p>
        <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-4">
          World Drive
        </h1>
        <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
          Follow the manufacturers super car as it roams the globe.
          Live GPS coordinates are broadcast from the vehicle via MQTT
          and plotted in real time on an interactive map.
        </p>
      </div>
      <Suspense>
        <WorldDriveApp />
      </Suspense>
    </div>
  );
}
