import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
