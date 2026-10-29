import ContactContent from "@/components/contact/ContactContent";

export const metadata = {
  title: "Contact",
  description: "Contactez Hugues Leger, développeur créatif et designer d'interfaces.",
};

export default function ContactPage() {
  return (
    <main className="page-contact">
      <ContactContent />
    </main>
  );
}
