import { GALLERY_PROJECTS } from "./galleryProjects";

const EXTRA_IMAGES_COUNT = 18;
const EXTRA_IMAGES_OFFSET = 7;

// Chaque projet pioche 6 visuels dans /assets/7 → /assets/24 (avec recouvrement).
function projectImages(index) {
  return Array.from({ length: 6 }, (_, k) => {
    const n = EXTRA_IMAGES_OFFSET + ((index * 3 + k) % EXTRA_IMAGES_COUNT);
    return `/assets/${n}.webp`;
  });
}

/**
 * Contenu des pages détail, indexé par id de GALLERY_PROJECTS.
 * `statement` : les mots entre *astérisques* sont mis en avant (graisse forte).
 * `siteWeb` est optionnel : la section infos s'adapte s'il est vide.
 */
const DETAILS = {
  1: {
    category: "Identité visuelle & e-commerce",
    annee: "2025",
    intervention: ["Direction artistique", "UI Design", "Développement front"],
    siteWeb: "",
    color: "#171717",
    tone: "light",
    statement: "Une collection pensée comme une *nuit sans fin* : du noir, de la matière et *la lumière qui découpe*.",
  },
  2: {
    category: "Campagne digitale",
    annee: "2024",
    intervention: ["Concept", "Motion", "Développement WebGL"],
    siteWeb: "example.com",
    color: "#d8cfc4",
    tone: "dark",
    statement: "Raconter un *horizon* qui se déplace à chaque scroll, *sans jamais l'atteindre*.",
  },
  3: {
    category: "Lookbook interactif",
    annee: "2024",
    intervention: ["Direction artistique", "Développement front"],
    siteWeb: "",
    color: "#2f3a4a",
    tone: "light",
    statement: "Des silhouettes qui *apparaissent* plutôt qu'elles ne se montrent, une *nouvelle étoile* à chaque page.",
  },
  4: {
    category: "Site vitrine",
    annee: "2023",
    intervention: ["UI Design", "Intégration", "CMS"],
    siteWeb: "",
    color: "#b9a48d",
    tone: "dark",
    statement: "Une *cartographie* d'images où chaque détail porte *le poids du monde*.",
  },
  5: {
    category: "Éditorial mode",
    annee: "2023",
    intervention: ["Concept", "UI Design", "Développement front"],
    siteWeb: "example.com",
    color: "#7d2a2a",
    tone: "light",
    statement: "Décomposer la *couleur* comme un prisme : un éclat, *puis tout le spectre*.",
  },
  6: {
    category: "Expérience immersive",
    annee: "2022",
    intervention: ["Direction artistique", "Développement WebGL"],
    siteWeb: "",
    color: "#ebe6de",
    tone: "dark",
    statement: "Tout est *mouvement* : les images glissent, se plient et *reprennent leur place*.",
  },
};

export const WORKS = GALLERY_PROJECTS.map((project, index) => ({
  ...project,
  ...DETAILS[project.id],
  images: projectImages(index),
}));

export function getWork(slug) {
  const index = WORKS.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  return {
    project: WORKS[index],
    next: WORKS[(index + 1) % WORKS.length],
  };
}
