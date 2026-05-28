import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "unfuego.com.ar",
          },
        ],
        destination: "https://www.unfuegomdq.com.ar/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
