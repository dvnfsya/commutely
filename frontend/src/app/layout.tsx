import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commute.ly | WebGIS keamanan perjalanan KRL",
  description: "Eksplorasi stasiun, fasilitas sekitar, dan konteks keamanan perjalanan KRL di Jakarta.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}
