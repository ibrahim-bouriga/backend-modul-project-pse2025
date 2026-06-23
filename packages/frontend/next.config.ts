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
};

export default nextConfig;
