import { Geist, Geist_Mono } from "next/font/google";
import LenisProvider from "@/components/LenisProvider";
import "./globals.css";
import "./gallery.css";
import TransitionOverlay from "@/components/TransitionOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Portfolio",
  description: "Portfolio de Hugues Leger",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <LenisProvider>
          {children}
          <TransitionOverlay />
        </LenisProvider>
      </body>
    </html>
  );
}
