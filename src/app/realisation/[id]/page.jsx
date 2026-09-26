import BackButton from "@/components/BackButton";

export default async function RealisationPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const src = `/assets/${id}.webp`;

  return (
    <main className="page-realisation">
      <figure className="content__preview-img">
        <img src={src} alt={`Projet ${id}`} />
      </figure>
      <div className="content__group-list">
        <BackButton id={id} src={src} />

        <div className="content__group active">
          <div className="content__title">Projet {id}</div>
          <div className="content__description">
            Description détaillée du projet {id}. Cette page utilise désormais
            le layout DOM standard. L'image de gauche est intégrée avec la
            transition fluide de l'accueil.
          </div>
        </div>
      </div>
    </main>
  );
}
