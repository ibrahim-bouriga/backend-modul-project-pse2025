import { NextResponse } from 'next/server';

const SVC = process.env.WORLD_DRIVE_SERVICE_URL ?? 'http://localhost:4003';

export async function GET() {
  try {
    const res = await fetch(`${SVC}/api/cars`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: 'Service error' }, { status: 502 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Service unreachable' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const res  = await fetch(`${SVC}/api/cars/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Service unreachable' }, { status: 503 });
  }
}
