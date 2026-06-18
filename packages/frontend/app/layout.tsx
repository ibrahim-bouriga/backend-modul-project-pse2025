import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyPSECar · PSE 2025",
  description: "Next.js frontend for the PSE 2025 project (MyPSECar).",
  keywords: ["MyPSECar", "PSE 2025", "Next.js", "React", "MQTT", "REST API"],
  openGraph: {
    title: "MyPSECar · PSE 2025",
    description: "Next.js frontend for the PSE 2025 project (MyPSECar).",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyPSECar · PSE 2025",
    description: "Next.js frontend for the PSE 2025 project (MyPSECar).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
