import { NextResponse } from "next/server";

const WORLD_DRIVE_SERVICE = process.env.WORLD_DRIVE_SERVICE_URL ?? "http://localhost:4003";

export async function GET() {
  try {
    const res = await fetch(`${WORLD_DRIVE_SERVICE}/api/position`, { cache: "no-store" });
    if (res.status === 404) return NextResponse.json({ error: "No position yet" }, { status: 404 });
    if (!res.ok) return NextResponse.json({ error: "Service error" }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unreachable" }, { status: 503 });
  }
}
