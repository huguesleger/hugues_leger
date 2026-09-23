// Ported from franky-adl/3d-wave-grid (MIT)

export const WAVE_GRID_CONFIG = {
  gridSize: 40,
  cubeWidth: 0.8,
  cubeHeight: 3,
  gap: 0.01,
  waveAmplitude: 0.4,
  waveSpeed: 6.0,
  waveFrequency: 1.2,
  waveWidth: 3.0,
  waveJitter: 0.2,
  waveMaxHeight: 0.4,
  colorBase: '#ffffff',
  colorHigh: '#0055ff',
};

export const WAVE_GRID_LIGHTING = {
  ambientColor: '#ffffff',
  ambientIntensity: 0.5,
  directionalColor: '#ffffff',
  directionalIntensity: 4.0,
  directional2Color: '#ffffff',
  directional2Intensity: 1.0,
};

export const WAVE_GRID_CAMERA = {
  fov: 40,
  radius: 12,
  alphaRange: Math.PI * 0.03,
  betaRange: Math.PI * 0.05,
  mouseLerp: 0.04,
  near: 0.1,
  far: 200,
};

export const WAVE_GRID_POST = {
  toneMappingExposure: 1.95,
  shiftAmount: 0.005,
  vignetteRadius: 0.3,
  vignetteSoftness: 0.3,
};

export const MAX_TRAIL = 128;

export function getGridBounds(config = WAVE_GRID_CONFIG) {
  return config.gridSize * (config.cubeWidth + config.gap);
}
