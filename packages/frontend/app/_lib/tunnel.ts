export async function getTunnelUrl(): Promise<string | null> {
  try {
    const res = await fetch('http://ngrok:4040/api/tunnels', { cache: 'no-store' });
    const data = await res.json();
    const tunnel = data.tunnels?.find((t: { proto: string }) => t.proto === 'https');
    return tunnel?.public_url ?? null;
  } catch (e) {
    console.log("Error fetching tunnel url:", e);
    return null;
  }
}
