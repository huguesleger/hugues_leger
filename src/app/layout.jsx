import Script from "next/script";
import LenisProvider from "@/components/LenisProvider";
import "../scss/main.scss";
import TransitionOverlay from "@/components/TransitionOverlay";
import PageTransition from "@/components/transition/PageTransition";

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
        <Script id="intro-entered" strategy="beforeInteractive">
          {`try{if(sessionStorage.getItem("isEntered")||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("intro-entered")}}catch(e){}`}
        </Script>
        <IntroLoader />
        <LenisProvider>
          <Cursor />
          <Header />
          <div className="page-wrapper" data-page-wrapper>
            {children}
          </div>
          <PageTransition />
          <TransitionOverlay />
        </LenisProvider>
      </body>
    </html>
  );
}
