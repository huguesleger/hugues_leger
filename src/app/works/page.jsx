import WorksExperience from "@/components/works/WorksExperience";
import { getWorksPage } from "@/lib/worksPage";

export const metadata = {
  title: "Works",
  description: "Tous les projets de Hugues Leger",
};

export default async function WorksPage() {
  const { title, projects } = await getWorksPage();

  return (
    <main className="page-works">
      <WorksExperience title={title} projects={projects} />
    </main>
  );
}
