import BackendHealthCheck from "./_components/ExampleComponent";

export default function MyPSECarPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16 space-y-10">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
            Feature Module
          </p>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-4">
            MyPSECar
          </h1>
          <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
            Your personal vehicle portal. Monitor your car&apos;s fuel level
            and live GPS position at a glance — all data streamed in real
            time directly from the vehicle via MQTT.
          </p>
        </div>

        {/*
         * Drop your feature components here.
         * Interactive components go in _components/ with "use client".
         * Data-fetching server components can live here directly.
         */}
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <BackendHealthCheck />
      </div>
    </div>
  );
}
