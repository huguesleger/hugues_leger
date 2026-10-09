import LenisProvider from "@/components/LenisProvider";
import "../scss/main.scss";
import TransitionOverlay from "@/components/TransitionOverlay";

import Header from "@/components/layout/Header";
import Cursor from "@/components/layout/Cursor";
import IntroLoader from "@/components/loader/IntroLoader";

export const metadata = {
  title: "Portfolio",
  description: "Portfolio de Hugues Leger",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <IntroLoader />
        <LenisProvider>
          <Cursor />
          <Header />
          {children}
          <TransitionOverlay />
        </LenisProvider>
      </body>
    </html>
  );
}
