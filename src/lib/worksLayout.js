export const WORKS_CONFIG = {
  cardMaxHeight: 520,
  cardAspect: 0.75,
  lineMaxHeight: 440,
  lineAspect: 1.5,
  gapRatio: 0.14,
  minCards: 12,
  segments: 32,
  introDistanceRatio: 1,
  waveAmpRatio: 0.35,
  waveLengthRatio: 1.4,
  waveVelocityMax: 30,
  arcTilt: 0.12,
  arcRoll: -0.06,
  arcDepthRatio: 0.35,
  idleDrift: 60,
  wheelMultiplier: 1,
  dragMultiplier: 1.6,
  lerp: 0.08,
};

export const WORKS_TRANSITION_TARGET_HEIGHT = 600;

function fitCard(maxHeight, aspect, maxWidth) {
  let height = maxHeight;
  let width = height * aspect;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspect;
  }
  const gap = Math.max(24, width * WORKS_CONFIG.gapRatio);
  return { width, height, gap, pitch: width + gap };
}

export function getWorksDimensions(viewportWidth, viewportHeight, projectCount) {
  const isMobile = viewportWidth < 768;

  const arcCard = fitCard(
    Math.min(WORKS_CONFIG.cardMaxHeight, viewportHeight * (isMobile ? 0.48 : 0.55)),
    WORKS_CONFIG.cardAspect,
    viewportWidth * (isMobile ? 0.72 : 0.4),
  );
  const lineCard = fitCard(
    Math.min(WORKS_CONFIG.lineMaxHeight, viewportHeight * (isMobile ? 0.32 : 0.45)),
    WORKS_CONFIG.lineAspect,
    viewportWidth * (isMobile ? 0.8 : 0.55),
  );

  const needed = Math.max(
    WORKS_CONFIG.minCards,
    Math.ceil((viewportWidth + 2 * lineCard.pitch) / lineCard.pitch),
  );
  const copies = Math.max(1, Math.ceil(needed / projectCount));
  const count = copies * projectCount;

  const arcTotalWidth = count * arcCard.pitch;

  return {
    isMobile,
    count,
    arc: {
      ...arcCard,
      totalWidth: arcTotalWidth,
      radius: arcTotalWidth / (Math.PI * 2),
    },
    line: {
      ...lineCard,
      totalWidth: count * lineCard.pitch,
    },
    introDistance: viewportHeight * WORKS_CONFIG.introDistanceRatio,
    waveAmp: lineCard.height * WORKS_CONFIG.waveAmpRatio,
    waveFreq: (Math.PI * 2) / (viewportWidth * WORKS_CONFIG.waveLengthRatio),
  };
}

export function wrap(value, length) {
  return ((value % length) + length) % length;
}

/** Coordonnée « déroulée » d'une carte sur la bande, centrée sur 0. */
export function getUnrolledX(index, offset, pitch, totalWidth) {
  return wrap(index * pitch - offset + totalWidth / 2, totalWidth) - totalWidth / 2;
}

export function getArcTransform(u, radius) {
  const theta = u / radius;
  return {
    x: radius * Math.sin(theta),
    z: radius * Math.cos(theta) - radius,
    rotY: theta,
    opacity: smoothstep(-0.35, 0.25, Math.cos(theta)),
  };
}

export function getLineTransform(u, totalWidth, pitch) {
  const edge = totalWidth / 2;
  return {
    x: u,
    z: 0,
    rotY: 0,
    opacity: 1 - smoothstep(edge - pitch, edge - pitch * 0.25, Math.abs(u)),
  };
}

export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
