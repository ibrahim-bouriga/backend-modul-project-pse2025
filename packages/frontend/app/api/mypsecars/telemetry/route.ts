import { NextRequest, NextResponse } from 'next/server';

const SERVICE_URL =
  process.env.SERVICE_MYPSECARS_URL ?? 'http://localhost:4004';

// POST /api/mypsecars/telemetry
// Proxy from phone (via ngrok) to service-mypsecars running locally
export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetch(`${SERVICE_URL}/api/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Service error' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'service-mypsecars unreachable' }, { status: 503 });
  }
}
