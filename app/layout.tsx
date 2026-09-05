import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saturday & Sunday — Let's Play",
  description: "A little weekend game, made for Tannu.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
