import { Agent } from 'undici';

const SVC = process.env.WORLD_DRIVE_SERVICE_URL ?? 'http://localhost:4003';

// SSE streams never end — disable undici's default 300s body timeout to prevent premature termination
const sseAgent = new Agent({ bodyTimeout: 0, headersTimeout: 30_000 });

export async function GET(_req: Request, { params }: { params: Promise<{ carId: string }> }) {
  const { carId } = await params;
  try {
    const upstream = await fetch(`${SVC}/api/cars/${carId}/stream`, {
      // @ts-expect-error — undici-specific dispatcher option, not in standard RequestInit
      dispatcher: sseAgent,
      headers: { Accept: 'text/event-stream' },
    });
    return new Response(upstream.body, {
      headers: {
        'Content-Type':      'text/event-stream',
        'Cache-Control':     'no-cache',
        'Connection':        'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return new Response('Service unreachable', { status: 503 });
  }
}
