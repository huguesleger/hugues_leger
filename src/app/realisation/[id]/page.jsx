import BackButton from "@/components/BackButton";
import Footer from "@/components/layout/Footer";

export default async function RealisationPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const src = `/assets/${id}.webp`;

  return (
    <>
      <main className="page-realisation">
        <figure className="content__preview-img">
          <img src={src} alt={`Projet ${id}`} />
        </figure>
        <div className="content__group-list">
          <BackButton id={id} src={src} />

          <div className="content__group active">
            <div className="content__title page-reveal-mask">
              <span data-page-reveal>Projet {id}</span>
            </div>
            <div className="content__description page-reveal-mask">
              <span data-page-reveal>
                Description détaillée du projet {id}. Cette page utilise
                désormais le layout DOM standard. L&apos;image de gauche est
                intégrée avec la transition fluide de l&apos;accueil.
              </span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
