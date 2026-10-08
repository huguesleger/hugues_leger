import WorksExperience from "@/components/webgl/works/WorksExperience";

export const metadata = {
  title: "Works — Hugues Leger",
  description: "Tous les projets de Hugues Leger",
};

export default function WorksPage() {
  return (
    <main className="page-works">
      <WorksExperience />
    </main>
  );
}
