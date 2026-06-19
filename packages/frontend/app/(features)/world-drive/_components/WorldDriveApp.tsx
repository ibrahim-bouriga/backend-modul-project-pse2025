"use client";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import GpsPublisher from "./GpsPublisher";
import PhoneSetup from "./PhoneSetup";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export default function WorldDriveApp() {
  const params = useSearchParams();
  const mode   = params.get("mode");
  const broker = params.get("broker") ?? "";

  if (mode === "gps") {
    return <GpsPublisher brokerUrl={broker} />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <WorldMap />
      </div>
      <PhoneSetup />
    </div>
  );
}
