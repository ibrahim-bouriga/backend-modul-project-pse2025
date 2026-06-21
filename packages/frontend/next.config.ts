const nextConfig = {
  output: "standalone",
  // Achtung: Stricter Mode führt zu doppelten MQTT-Verbindungen (siehe MQTTController.ts), daher vorerst deaktiviert --> StrictMode führt in Dev zu doppeltem useEffect-Aufruf → WebGL-Kontext-Konflikt mit Three.js
  reactStrictMode: false,
};

export default nextConfig;
