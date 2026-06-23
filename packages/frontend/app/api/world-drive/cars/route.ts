import { NextResponse } from 'next/server';

const SVC = process.env.WORLD_DRIVE_SERVICE_URL ?? 'http://localhost:4003';

export async function GET() {
  try {
    const res = await fetch(`${SVC}/api/cars`, { cache: 'no-store' });
    if (!res.ok){
      return NextResponse.json({ error: 'Service error' }, { status: 502 });
    } 
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Service unreachable' }, { status: 503 });
  }
}
