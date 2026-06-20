import { Tunnel } from 'cloudflared';
import { exec } from 'child_process';

const FRONTEND_PORT = process.env.FRONTEND_PORT ?? '3000';

async function main(): Promise<void> {
  console.log(`Starting Cloudflare tunnel for localhost:${FRONTEND_PORT}`);

  const tunnel = Tunnel.quick(`http://localhost:${FRONTEND_PORT}`);

  const url = await new Promise<string>((resolve) => {
    tunnel.on('url', resolve);
  });

  const pageUrl =
    `http://localhost:${FRONTEND_PORT}/world-drive` +
    `?frontendTunnel=${encodeURIComponent(url)}`;

  console.log(`  Frontend : ${url}`);
  console.log(`  MQTT     : HiveMQ (wss://broker.hivemq.com:8884/mqtt)`);
  console.log(`  Opening  : ${pageUrl}`);

  exec(`start "" "${pageUrl}"`);

  process.on('SIGINT', () => { tunnel.stop(); process.exit(0); });
}

main().catch(console.error);
