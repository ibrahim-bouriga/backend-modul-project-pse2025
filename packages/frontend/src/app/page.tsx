import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>PSE2025 – Autoworld</h1>
      <Link href="/world">
        <button style={{ padding: "12px 24px", fontSize: 16, cursor: "pointer" }}>
          3D-Welt starten
        </button>
      </Link>
    </main>
  );
}
