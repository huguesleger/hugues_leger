import ContactContent from "@/components/contact/ContactContent";
import { getSiteSettings } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Contactez Hugues Leger, développeur créatif et designer d'interfaces.",
};

export default async function ContactPage() {
  const { email } = await getSiteSettings();

  return (
    <main className="page-contact">
      <ContactContent email={email} />
    </main>
  );
}
