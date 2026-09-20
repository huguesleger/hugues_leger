
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
