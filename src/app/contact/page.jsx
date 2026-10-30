import ContactContent from "@/components/contact/ContactContent";
import { getContact } from "@/lib/contact";
import { getSiteSettings } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Contactez Hugues Leger, développeur créatif et designer d'interfaces.",
};

export default async function ContactPage() {
  const [contact, { email }] = await Promise.all([getContact(), getSiteSettings()]);

  return (
    <main className="page-contact">
      <ContactContent title={contact.title} email={email} />
    </main>
  );
}
