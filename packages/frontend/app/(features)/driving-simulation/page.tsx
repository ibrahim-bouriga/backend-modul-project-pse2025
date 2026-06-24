"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useState } from "react";

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
  // Unmount the Canvas when Activity (cacheComponents) hides this page so the
    // WebGL context is properly disposed. The cleanup runs on hide and the effect
    // re-runs on show, recreating the context.
    const [worldVisible, setWorldVisible] = useState(true);
    useLayoutEffect(() => {
      setWorldVisible(true);
      return () => setWorldVisible(false);
    }, []);
  
  return worldVisible ? <World /> : null;
}
