import Gallery from "@/components/Gallery/Gallery";
import IntroOverlay from "@/components/IntroOverlay";

export default function Home() {
  return (
    <main>
      <IntroOverlay>
        <Gallery />
      </IntroOverlay>
    </main>
  );
}
