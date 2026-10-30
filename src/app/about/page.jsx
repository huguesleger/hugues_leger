import AboutContent from "@/components/about/AboutContent";
import { getSiteSettings } from "@/lib/site";

export const metadata = {
  title: "About",
  description: "À propos de Hugues Leger, développeur créatif et designer d'interfaces.",
};

export default async function AboutPage() {
  const { email } = await getSiteSettings();

  return (
    <main className="page-about">
      <AboutContent email={email} />
    </main>
  );
}
