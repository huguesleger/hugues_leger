import HomeExperience from "@/components/home/HomeExperience";

// Même segment que le layout : le template ne s'applique pas, d'où `absolute`.
export const metadata = {
  title: { absolute: "Hugues Leger — Creative Developer" },
  description:
    "Portfolio de Hugues Leger, creative developer : sites immersifs, WebGL et interfaces animées.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main>
      <HomeExperience />
    </main>
  );
}
