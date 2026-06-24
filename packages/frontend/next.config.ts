const nextConfig = {
  output: "standalone",
  cacheComponents: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
        port: "9000",
        pathname: "/car-models/**",
      },
    ],
  },
  // Achtung: Stricter Mode führt zu doppelten MQTT-Verbindungen (siehe MQTTController.ts), daher vorerst deaktiviert --> StrictMode führt in Dev zu doppeltem useEffect-Aufruf → WebGL-Kontext-Konflikt mit Three.js
  reactStrictMode: false,
};

export default nextConfig;
