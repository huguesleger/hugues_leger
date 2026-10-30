import AboutContent from "@/components/about/AboutContent";
import { getAbout } from "@/lib/about";
import { getSiteSettings } from "@/lib/site";

export const metadata = {
  title: "About",
  description: "À propos de Hugues Leger, développeur créatif et designer d'interfaces.",
};

export default async function AboutPage() {
  const [about, { email }] = await Promise.all([getAbout(), getSiteSettings()]);

  return (
    <main className="page-about">
      <AboutContent
        title={about.title}
        bio={about.bio}
        circles={about.circles}
        toolkit={about.toolkit}
        contactTitle={about.contactTitle}
        email={email}
      />
    </main>
  );
}
