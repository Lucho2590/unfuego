import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Un Fuego - Diseño para cocinar al fuego";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom, #141414, #0a0a0a)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Flame icon */}
        <svg
          width="180"
          height="220"
          viewBox="170 180 220 280"
          style={{ marginBottom: 40 }}
        >
          <path
            d="M371.88,390.21c-5.48,36.71-46.61,57.35-103.26,57.49-3.58,0-7.16-.06-10.67-.21-62.22-2.62-63.6-49.86-60.39-83.58,1.19-12.49,1.45-24.77-1.14-37.02-1.26-6.04-3.23-12.07-5.97-18.11,8.63,3.93,14.53,10.46,19.09,18.11,1.54,2.67,2.95,5.41,4.21,8.21.84-2.74,1.54-5.48,2.11-8.21,5.83-27.45-.42-55.11-16.5-78.76,4.91,1.05,8.99,4.35,13.27,7.3,19.73,13.62,33.55,33.41,39.66,56.58,6.18,23.31,5.12,38.82,2.88,59.25l-1.83,13.24c-3.63,28.64,27.5,25.44,32.91,24.74,10.74-1.4,14.94-2.71,20.48-7.67,1.28-1.15,2.3-3.14,3.37-5.57,2.21-5.03,3.03-10.56,2.91-16.05-.04-1.68-.1-3.32-.22-4.47,0-.28-.07-.56-.07-.84-4.07-35.59-35.73-62.97-44.93-105.72-6.32-29.48.21-60.02,24.08-78.83-11.86,22.32-9.13,47.8,5.69,68.37,18.39,25.55,44.43,36.08,63.04,68.44,3.44,5.9,6.88,12.35,9.41,19.94,5.97,18.95,1.9,43.38,1.9,43.38Z"
            fill="#ffffff"
          />
        </svg>

        {/* Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 300,
              color: "#ffffff",
              letterSpacing: "0.05em",
            }}
          >
            UN FUEGO
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 300,
              color: "#888888",
            }}
          >
            ...se está encendiendo.
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
