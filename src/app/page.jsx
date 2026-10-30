import HomeExperience from "@/components/home/HomeExperience";
import { getGalleryProjects, getHomeContactStatement } from "@/lib/home";
import { getSiteSettings } from "@/lib/site";

// Même segment que le layout : le template ne s'applique pas, d'où `absolute`.
export const metadata = {
  title: { absolute: "Hugues Leger — Creative Developer" },
  description:
    "Portfolio de Hugues Leger, creative developer : sites immersifs, WebGL et interfaces animées.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [projects, statement, { email }] = await Promise.all([
    getGalleryProjects(),
    getHomeContactStatement(),
    getSiteSettings(),
  ]);

  return (
    <main>
      <HomeExperience projects={projects} contact={{ statement, email }} />
    </main>
  );
}
