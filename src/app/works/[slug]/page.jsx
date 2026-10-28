import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import Footer from "@/components/layout/Footer";
import RealisationDetail from "@/components/realisation/RealisationDetail";
import { REALISATIONS, getRealisation } from "@/lib/realisations";

export function generateStaticParams() {
  return REALISATIONS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = getRealisation(slug);
  if (!data) return {};
  return {
    title: `${data.project.title} — Hugues Leger`,
    description: `${data.project.title}, ${data.project.category.toLowerCase()} (${data.project.annee}).`,
  };
}

export default async function RealisationPage({ params }) {
  const { slug } = await params;
  const data = getRealisation(slug);
  if (!data) notFound();

  const { project } = data;

  return (
    <>
      <main className="page-realisation">
        <figure className="content__preview-img">
          <img src={project.image} alt={project.title} />
        </figure>
        <RealisationDetail {...data}>
          <BackButton id={project.id} src={project.image} />
        </RealisationDetail>
      </main>
      <Footer className="site-footer--realisation" />
    </>
  );
}
