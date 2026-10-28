/**
 * Plans d'images de la page détail.
 * - vertex : la vitesse de scroll plie le plan (bords haut/bas en retard,
 *   centre bombé vers la caméra) comme une feuille qu'on tire.
 * - fragment : image en « cover », reveal par vague depuis le bas avec dézoom,
 *   décalage RVB proportionnel à la vitesse, loupe douce sous le curseur.
 */
export const REALISATION_VERTEX_SHADER = `
  #define PI 3.141592653589793

  uniform float uVelocity;
  uniform vec2  uSize;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float bend = sin(uv.x * PI);
    pos.y += bend * uVelocity * 0.06;
    pos.z += sin(uv.y * PI) * bend * abs(uVelocity) * uSize.y * 0.08;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const REALISATION_FRAGMENT_SHADER = `
  uniform sampler2D uTexture;
  uniform vec2  uSize;
  uniform vec2  uImage;
  uniform float uReveal;
  uniform float uVelocity;
  uniform float uHover;
  uniform vec2  uMouse;
  uniform float uTime;

  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    vec2 ratio = vec2(
      min((uSize.x / uSize.y) / (uImage.x / uImage.y), 1.0),
      min((uSize.y / uSize.x) / (uImage.y / uImage.x), 1.0)
    );
    return vec2(
      uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
  }

  void main() {
    // Reveal : bord ondulé qui monte depuis le bas.
    float wave = sin(vUv.x * 5.0 + uTime * 1.2) * 0.04 * (1.0 - uReveal);
    float edge = uReveal * 1.15 + wave;
    float mask = 1.0 - smoothstep(edge - 0.08, edge, vUv.y);
    if (mask <= 0.001) discard;

    vec2 uv = vUv;

    // Dézoom pendant le reveal, léger zoom au survol.
    float zoom = 1.0 + (1.0 - uReveal) * 0.3 + uHover * 0.06;
    uv = (uv - 0.5) / zoom + 0.5;

    // Loupe : les pixels proches du curseur sont repoussés.
    float aspect = uSize.x / max(uSize.y, 1.0);
    vec2 d = (vUv - uMouse) * vec2(aspect, 1.0);
    float lens = exp(-dot(d, d) * 18.0) * uHover;
    uv -= (vUv - uMouse) * lens * 0.08;

    uv = coverUv(uv);

    float shift = uVelocity * 0.012;
    vec3 color;
    color.r = texture2D(uTexture, uv + vec2(0.0, shift)).r;
    color.g = texture2D(uTexture, uv).g;
    color.b = texture2D(uTexture, uv - vec2(0.0, shift)).b;

    gl_FragColor = vec4(color, mask);
  }
`;
