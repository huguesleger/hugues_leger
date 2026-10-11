import AboutContent from "@/components/about/AboutContent";

export const metadata = {
  title: "About — Hugues Leger",
  description: "À propos de Hugues Leger, développeur créatif et designer d'interfaces.",
};

export default function AboutPage() {
  return (
    <main className="page-about">
      <AboutContent />
    </main>
  );
}
