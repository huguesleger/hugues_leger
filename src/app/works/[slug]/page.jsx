import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
import WorkDetail from "@/components/work-detail/WorkDetail";
import { WORKS, getWork } from "@/lib/works";

export function generateStaticParams() {
  return WORKS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = getWork(slug);
  if (!data) return {};
  return {
    title: `${data.project.title} — Hugues Leger`,
    description: `${data.project.title}, ${data.project.category.toLowerCase()} (${data.project.annee}).`,
  };
}

export default async function WorkPage({ params }) {
  const { slug } = await params;
  const data = getWork(slug);
  if (!data) notFound();

  const { project } = data;

  return (
    <>
      <main className="page-work">
        <figure className="work-preview">
          {/* Même URL que l'image de transition, sinon elle saute à l'arrivée. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.image} alt={project.title} />
        </figure>
        <WorkDetail {...data}>
          <BackButton id={project.id} src={project.image} />
        </WorkDetail>
      </main>
      <Footer className="site-footer--work" />
    </>
  );
}
