
import LenisProvider from "@/components/LenisProvider";
import "../scss/main.scss";
import TransitionOverlay from "@/components/TransitionOverlay";

import Header from "@/components/layout/Header";

export const metadata = {
  title: "Portfolio",
  description: "Portfolio de Hugues Leger",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <LenisProvider>
          <Header />
          {children}
          <TransitionOverlay />
        </LenisProvider>
      </body>
    </html>
  );
}
