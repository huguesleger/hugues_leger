// Shader de réfraction réaliste pour une sphère de verre liquide
// Basé sur le principe du Codrops liquid glass (fakeRefractionShader via FBO + normals)

export const glassVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vViewDirection;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vViewDirection = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const glassFragmentShader = `
  uniform sampler2D uSceneTexture; // Texture FBO contenant le rendu de la scène derrière
  uniform vec2 uResolution;
  uniform float uIor;           // Index de réfraction (1.1 - 1.5)
  uniform float uThickness;     // Épaisseur du verre simulée
  uniform float uChromaticAberration; // Dispersion chromatique
  uniform float uDistort;       // Intensité de la distorsion liquide
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vViewDirection;

  // Simplex 2D noise pour l'effet liquide
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m * m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Screen-space UV (position du fragment sur l'écran)
    vec2 screenUv = gl_FragCoord.xy / uResolution;

    // Normal en espace vue pour la réfraction
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDirection);

    // Distorsion liquide animée par bruit
    float noise = snoise(vUv * 3.0 + uTime * 0.4) * uDistort;
    vec3 distortedNormal = normalize(N + vec3(noise * 0.3, noise * 0.3, 0.0));

    // Calcul de la réfraction (Snell–Descartes simplifié)
    float eta = 1.0 / uIor; // air -> verre
    vec3 refractDir = refract(-V, distortedNormal, eta);

    // Décalage UV proportionnel à la direction de réfraction + épaisseur
    vec2 refractOffset = refractDir.xy * uThickness * 0.15;

    // Aberration chromatique : décaler chaque canal de couleur différemment
    float r = texture2D(uSceneTexture, screenUv + refractOffset * (1.0 + uChromaticAberration)).r;
    float g = texture2D(uSceneTexture, screenUv + refractOffset).g;
    float b = texture2D(uSceneTexture, screenUv + refractOffset * (1.0 - uChromaticAberration)).b;

    vec3 refractedColor = vec3(r, g, b);

    // Fresnel : réflexion sur les bords (plus on est tangent, plus c'est réfléchi)
    float fresnel = pow(1.0 - max(dot(V, N), 0.0), 3.0);

    // Spéculaire simple pour donner le volume du verre
    vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0));
    float spec = pow(max(dot(reflect(-lightDir, N), V), 0.0), 64.0);
    vec3 specular = vec3(1.0) * spec * 0.6;

    // Couleur finale : réfraction + reflet spéculaire sur les bords
    vec3 finalColor = refractedColor + specular + fresnel * 0.15;

    gl_FragColor = vec4(finalColor, 0.9 + fresnel * 0.1);
  }
`;
