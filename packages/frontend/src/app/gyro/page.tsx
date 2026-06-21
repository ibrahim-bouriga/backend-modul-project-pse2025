import { Suspense } from "react";
import GyroController from "./GyroController";

export default function GyroPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GyroController />
    </Suspense>
  );
}

function Loading() {
  return (
    <div style={pageStyle}>
      <p>Lade…</p>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "#0f0f1a",
  color: "#fff",
  fontFamily: "sans-serif",
};
