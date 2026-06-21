// In Docker: set NGROK_API_URL=http://ngrok:4040 in the frontend container env.
// Local dev: ngrok port 4040 is mapped to localhost:4040 via docker-compose.
const NGROK_API = process.env.NGROK_API_URL ?? 'http://localhost:4040';

export async function getTunnelUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${NGROK_API}/api/tunnels`, { cache: 'no-store' });
    const data = await res.json();
    const tunnel = data.tunnels?.find((t: { proto: string }) => t.proto === 'https');
    return tunnel?.public_url ?? null;
  } catch (e) {
    console.log("Error fetching tunnel url:", e);
    return null;
  }
}
