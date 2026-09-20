export const vertexShader = `
uniform vec2 uMouse;

varying vec2 vUv;
varying float vElevation;

float circle(vec2 uv, vec2 circlePosition, float radius) {
  float dist = distance(circlePosition, uv);
  return 1. - smoothstep(0.0, radius, dist);
}

float elevation(float radius, float intensity) {
  vec2 mouseUV = (uMouse * 0.5) + 0.5;
  float circleShape = circle(uv, mouseUV, radius);
  return circleShape * intensity;
}

void main() {
  vec3 newPosition = position;
  float el = elevation(0.2, 0.7);
  newPosition.z += el;
  
  csm_Position = newPosition;
  vUv = uv;
  vElevation = el;
}
`;

export const fragmentShader = `
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  csm_DiffuseColor = texColor;
}
`;
