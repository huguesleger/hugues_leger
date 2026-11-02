import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
import WorkDetail from "@/components/work-detail/WorkDetail";
import WorkPreview from "@/components/work-detail/WorkPreview";
import { getProject, getProjectSlugs } from "@/lib/projects";

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getProject(slug);
  if (!data) return {};
  return {
    title: data.project.title,
    description: `${data.project.title}, ${data.project.category.toLowerCase()} (${data.project.year}).`,
  };
}

export default async function WorkPage({ params }) {
  const { slug } = await params;
  const data = await getProject(slug);
  if (!data) notFound();

  const { project } = data;

  return (
    <>
      <main className="page-work">
        <WorkPreview src={project.image} alt={project.title} />
        <WorkDetail {...data}>
          <BackButton slug={project.slug} src={project.image} />
        </WorkDetail>
      </main>
      <Footer className="site-footer--work" />
    </>
  );
}
