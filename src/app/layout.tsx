import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParcelFit — Investor–Parcel Matching Copilot",
  description:
    "Match Abu Dhabi land parcels to investor mandates with transparent, explainable AI scoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
