import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {

  title: "Un Fuego",
  description: "Un fuego se está encendiendo. En cualquier lugar.",
  keywords: ["fuego", "cocina", "diseño", "parrilla", "outdoor", "camping"],

  icons: {
    icon: "/favicon.ico"
  },

  metadataBase: new URL("https://www.unfuegomdq.com.ar"),

  openGraph: {
    title: "Un Fuego",
    description: "Un fuego se está encendiendo. En cualquier lugar.",
    url: "https://www.unfuegomdq.com.ar",
    siteName: "Un Fuego",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Un Fuego – Un fuego, en cualquier lugar"
      }
    ],
    locale: "es_AR",
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "Un Fuego",
    description: "Un fuego se está encendiendo. En cualquier lugar.",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
