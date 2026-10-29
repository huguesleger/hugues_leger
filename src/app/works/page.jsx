import WorksExperience from "@/components/works/WorksExperience";

export const metadata = {
  title: "Works",
  description: "Tous les projets de Hugues Leger",
};

export default function WorksPage() {
  return (
    <main className="page-works">
      <WorksExperience />
    </main>
  );
}
