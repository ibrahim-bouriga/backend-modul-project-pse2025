"use client";

import dynamic from "next/dynamic";

// Three.js läuft ausschließlich im Browser – ssr: false verhindert,
// dass Next.js versucht, diese Komponente serverseitig zu rendern.
const World = dynamic(() => import("./_components/World"), {
  ssr: false,
  loading: () => (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <p>Lade 3D-Welt…</p>
    </main>
  ),
});

export default function DrivingSimulationPage() {
  return <World />;
}
