import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Un Fuego ",
  description:
    "Un fuego se está encendiendo. En cualquier lugar.",
  keywords: ["fuego", "cocina", "diseño", "parrilla", "outdoor", "camping"],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Un Fuego",
    description: "Un fuego se está encendiendo.",
    type: "website",
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
