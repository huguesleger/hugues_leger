export const GALLERY_CONFIG = {
  threads: 26,
  segments: 20,
  cardMaxHeight: 452,
  cardAspect: 0.75,
  cardGapRatio: 0.11,
  tearZoneRatio: 0.26,
  tearZoneMax: 380,
};

export const GALLERY_STAGGERS = [-300, 200, -200, 300, -350, 150];

/** Viewport height multipliers for contact zone (slide up + text reveal). */
export const CONTACT_SLIDE_SCROLL = 1;
export const CONTACT_TEXT_SCROLL = 0.85;

export function getGalleryScrollSpan(
  projectCount,
  viewportWidth,
  viewportHeight,
) {
  if (projectCount <= 1) return 0;
  const { pitch } = getCardDimensions(viewportWidth, viewportHeight);
  return (projectCount - 1) * pitch;
}

export function getContactSlideDistance(viewportHeight) {
  return viewportHeight * CONTACT_SLIDE_SCROLL;
}

export function getContactTextScrollDistance(viewportHeight) {
  return viewportHeight * CONTACT_TEXT_SCROLL;
}

export function getContactScrollDistance(viewportHeight) {
  return (
    getContactSlideDistance(viewportHeight) +
    getContactTextScrollDistance(viewportHeight)
  );
}

export function getGalleryDocumentHeight(
  projectCount,
  viewportWidth,
  viewportHeight,
) {
  const scrollSpan = getGalleryScrollSpan(
    projectCount,
    viewportWidth,
    viewportHeight,
  );
  const contactScroll = getContactScrollDistance(viewportHeight);
  return scrollSpan + viewportHeight + contactScroll;
}

export function getCardDimensions(viewportWidth, viewportHeight) {
  let cardHeight = Math.min(
    GALLERY_CONFIG.cardMaxHeight,
    viewportHeight * 0.62,
  );
  let cardWidth = cardHeight * GALLERY_CONFIG.cardAspect;
  const maxCardWidth = viewportWidth * 0.9;
  if (cardWidth > maxCardWidth) {
    cardWidth = maxCardWidth;
    cardHeight = cardWidth / GALLERY_CONFIG.cardAspect;
  }
  const pitch =
    cardHeight + Math.max(24, cardHeight * GALLERY_CONFIG.cardGapRatio);
  return { cardWidth, cardHeight, pitch };
}

export function getMeshOffsetX(index, viewportWidth) {
  if (viewportWidth < 768) return 0;
  return GALLERY_STAGGERS[index % GALLERY_STAGGERS.length];
}

export function getLabelSide(index, viewportWidth) {
  if (viewportWidth < 768) {
    return index % 2 === 0 ? "left" : "right";
  }
  const stagger = GALLERY_STAGGERS[index % GALLERY_STAGGERS.length];
  return stagger <= 0 ? "right" : "left";
}

export function getGalleryItemScreenLayout(
  index,
  scrollY,
  viewportWidth,
  viewportHeight,
) {
  const { cardWidth, cardHeight, pitch } = getCardDimensions(
    viewportWidth,
    viewportHeight,
  );
  const meshX = getMeshOffsetX(index, viewportWidth);
  const meshY = scrollY - index * pitch;
  const centerX = viewportWidth / 2 + meshX;
  const centerY = viewportHeight / 2 - meshY;
  const side = getLabelSide(index, viewportWidth);
  const gap = Math.max(20, viewportWidth * 0.02);

  return {
    centerX,
    centerY,
    cardWidth,
    cardHeight,
    side,
    gap,
  };
}

export function syncMeshScrollPositions(
  group,
  pitch,
  scrollOffset,
  screenWidth = 1000,
) {
  if (!group) return;
  const isMobile = screenWidth < 768;
  group.children.forEach((mesh, i) => {
    mesh.position.x = isMobile ? 0 : GALLERY_STAGGERS[i % GALLERY_STAGGERS.length];
    mesh.position.y = scrollOffset - i * pitch;
  });
}
