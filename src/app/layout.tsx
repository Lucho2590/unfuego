import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Un Fuego ",
  description:
    "Un fuego se está encendiendo. En cualquier lugar.",
  keywords: ["fuego", "cocina", "diseño", "parrilla", "outdoor", "camping"],
  openGraph: {
    title: "Un Fuego",
    description: "Un fuego se está encendiendo.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Un Fuego",
    description: "Un fuego se está encendiendo.",
  },
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
