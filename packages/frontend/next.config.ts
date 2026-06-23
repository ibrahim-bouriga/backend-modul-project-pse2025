const nextConfig = {
  output: "standalone",
  images: {
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
