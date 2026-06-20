"use client";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import GpsPublisher from "./GpsPublisher";
import QRSetup from "../QRSetup";

const WorldMap = dynamic(() => import("../WorldMap"), { ssr: false });

export default function WorldDriveApp() {
  const mode = useSearchParams().get("mode");

  if (mode === "gps") {
    return <GpsPublisher />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <WorldMap />
      </div>
      <QRSetup />
    </div>
  );
}
