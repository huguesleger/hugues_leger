import { Geist, Geist_Mono } from "next/font/google";
import LenisProvider from "@/components/LenisProvider";
import "../scss/main.scss";
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
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenIntro') === 'true') {
                  document.documentElement.classList.add('hide-intro');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <LenisProvider>
          {children}
          <TransitionOverlay />
        </LenisProvider>
      </body>
    </html>
  );
}
