import NotFoundExperience from "@/components/not-found/NotFoundExperience";

export const metadata = {
  title: "404 — Hugues Leger",
  description: "Cette page s'est perdue dans l'espace.",
};

export default function NotFound() {
  return (
    <main className="page-not-found">
      <NotFoundExperience />
    </main>
  );
}
