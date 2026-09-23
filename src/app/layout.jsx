
import LenisProvider from "@/components/LenisProvider";
import "../scss/main.scss";
import TransitionOverlay from "@/components/TransitionOverlay";

export const metadata = {
  title: "Portfolio",
  description: "Portfolio de Hugues Leger",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <LenisProvider>
          {children}
          <TransitionOverlay />
        </LenisProvider>
      </body>
    </html>
  );
}
