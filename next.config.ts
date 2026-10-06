import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
    ],

    // AVIF primero (≈25% más chico que WebP), WebP de fallback. El browser elige por Accept.
    formats: ["image/avif", "image/webp"],

    // Las URLs de Storage son INMUTABLES: el path lleva un `Date.now()` y nunca se pisa un objeto
    // existente (cada subida crea un archivo nuevo). Si la foto cambia, cambia la URL. Entonces
    // `URL → bytes` es una función constante y la variante optimizada nunca puede quedar vieja.
    // El default de Next 16 es 4 h: cada 4 h el optimizer vuelve a bajar el original de Storage
    // y lo re-transforma, que es la causa principal de la lentitud en producción.
    minimumCacheTTL: 31536000, // 1 año

    // Next 16 exige declarar las calidades que se usan (75 = default, 70 para la grilla).
    qualities: [70, 75],

    // Solo los anchos que la tienda puede pedir de verdad. Menos variantes = menos
    // transformaciones facturadas y mucho mejor hit-rate de caché. El tope es 1920 porque los
    // originales quedan en 1600 px: pedir 2048/3840 sería upscalear.
    deviceSizes: [640, 750, 828, 1080, 1920],
    imageSizes: [48, 64, 96, 128, 256, 384],
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
