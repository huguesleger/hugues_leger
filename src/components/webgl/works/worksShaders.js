/**
 * Le carousel repose sur un « ruban » : une surface en S dans la profondeur
 * (proche à gauche, loin à droite) sur laquelle toutes les cartes sont posées.
 * C'est la perspective qui ondule leur silhouette, pas la géométrie.
 * Au scroll, le S se creuse, le côté gauche se cabre vers la caméra et les
 * bords se tordent en sens opposés autour de l'axe du ruban.
 * Inspiré du ruban de jesperlandberg.com.
 */
const SHEET_CHUNK = `
  #define SHEET_PI 3.141592653589793

  const float SHEET_BANK   = -0.16;
  const float SHEET_DIAG   = 0.03;
  const float SHEET_REAR_Y = 0.01;
  const float SHEET_REAR_Z = 0.01;
  const float SHEET_VTWIST = 0.1;
  const float SHEET_TAIL   = 1.0;
  const float SHEET_SHIFT  = -0.2;

  uniform float uSheetW; // demi-largeur du frustum à z = 0
  uniform float uSheetD; // amplitude de la profondeur
  uniform float uSheetT; // part du cadre couverte par le S
  uniform float uSheetC; // 0 = cuvette symétrique, 1 = S proche → loin
  uniform float uSheetP; // force du ruban : 0 sur l'arc, 1 en ligne
  uniform float uSheetV; // vitesse de scroll normalisée 0..1
  uniform float uLeanA;  // profondeur de la « porte » au bord du cadre
  uniform float uHover;
  uniform float uDent;

  float sheetQ(float wx) {
    return wx / max(uSheetW, 0.0001) * uSheetT + SHEET_SHIFT;
  }

  float sheetShape(float q) {
    return mix(1.0 - q * q, sin(SHEET_PI * q), uSheetC) * exp(-SHEET_TAIL * q * q);
  }

  float sheetShapeSlope(float q) {
    float g = exp(-SHEET_TAIL * q * q);
    float bowl = -2.0 * q * (1.0 + SHEET_TAIL * (1.0 - q * q));
    float ess = SHEET_PI * cos(SHEET_PI * q) - 2.0 * SHEET_TAIL * q * sin(SHEET_PI * q);
    return mix(bowl, ess, uSheetC) * g;
  }

  float sheetZ(float wx) {
    return -uSheetD * sheetShape(sheetQ(wx));
  }

  float sheetRoll(float wx) {
    return SHEET_BANK * sheetShapeSlope(sheetQ(wx)) / SHEET_PI * uSheetC * uSheetP;
  }

  float leanRamp(float s) {
    s = clamp(s, -1.0, 1.0);
    return s * (1.5 - 0.5 * s * s);
  }

  float leanSlope(float s) {
    s = min(abs(s), 1.0);
    return 1.5 * (1.0 - s * s);
  }

  float sheetDome(vec2 uv) {
    vec2 q = uv * 2.0 - 1.0;
    return (1.0 - q.x * q.x) * (1.0 - q.y * q.y);
  }
`;

export const WORKS_VERTEX_SHADER = `
  ${SHEET_CHUNK}

  uniform float uTransition;
  uniform vec2  uCardSize;
  uniform vec2  uTargetSize;
  uniform vec2  uTargetPosition;

  varying vec2 vUv;
  varying vec3 vFlat;

  vec4 sheetWind(vec4 w) {
    float a = sheetRoll(w.x);

    if (uSheetV > 0.001 && uSheetP > 0.001) {
      float qe = w.x / uSheetW;
      a += SHEET_VTWIST * uSheetV * smoothstep(0.3, 0.9, abs(qe)) * sign(qe) * uSheetP;
    }

    if (abs(a) < 0.0001) return w;
    float s = sin(a);
    float c = cos(a);
    return vec4(w.x, w.y * c - w.z * s, w.y * s + w.z * c, w.w);
  }

  vec4 sheet(vec4 w) {
    if (uSheetP < 0.001) return w;

    w = sheetWind(w);
    w.z += sheetZ(w.x) * uSheetP;

    float qw = w.x / uSheetW;
    w.y += SHEET_DIAG * w.x * uSheetP;

    if (uSheetV > 0.001) {
      float m = 1.0 - smoothstep(-1.0, 0.3, qw);
      w.y += SHEET_REAR_Y * uSheetW * uSheetV * m * uSheetP;
      w.z += SHEET_REAR_Z * uSheetW * uSheetV * m * uSheetP;
    }

    w.z += uLeanA * leanRamp(qw) * uSheetP;
    return w;
  }

  void main() {
    vUv = uv;

    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 origin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vFlat = world.xyz;

    world = sheet(world);
    world.z -= uHover * uDent * uCardSize.y * sheetDome(uv);

    vec2 local = position.xy * uCardSize;
    vec2 targetScale = uTargetSize / uCardSize;
    float ripple = sin(length(uv - 0.5) * 12.0 + uTransition * 10.0) * 0.5 + 0.5;
    vec2 scale = mix(vec2(1.0), targetScale + cos(uTransition * SHEET_PI * 0.5) * ripple * 0.15, uTransition);
    vec2 expanded = mix(origin.xy, uTargetPosition, uTransition) + local * scale;
    world.xy = mix(world.xy, expanded, uTransition);
    world.z = mix(world.z, 2.0, uTransition);

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const WORKS_FRAGMENT_SHADER = `
  precision highp float;

  ${SHEET_CHUNK}

  uniform sampler2D uMap;
  uniform float uImageAspect;
  uniform float uOpacity;
  uniform float uTransition;
  uniform float uShade;
  uniform vec2  uCardSize;
  uniform vec2  uTargetSize;
  
  uniform vec2  uMouse;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vFlat;

  const vec3  LIGHT_DIR   = normalize(vec3(-0.4, 0.5, 1.0));
  const float LIGHT_GLOSS = 48.0;
  const float LIGHT_SPEC  = 0.35;
  const float LIGHT_DIFF  = 0.12;

  float sheetShade(float wx, vec2 uv) {
    if (uSheetD < 0.001) return 0.0;
    float d = clamp((uSheetD - sheetZ(wx)) / (2.0 * uSheetD), 0.0, 1.0) * uSheetP;
    d += (uHover * uDent * uCardSize.y * sheetDome(uv)) / (2.0 * uSheetD);
    return clamp(d, 0.0, 1.0);
  }

  float sheetOffset(float wx, vec2 uv) {
    return sheetZ(wx) * uSheetP
      + uLeanA * leanRamp(wx / uSheetW) * uSheetP
      - uHover * uDent * uCardSize.y * sheetDome(uv);
  }

  vec3 sheetNormal(float wx) {
    float dzdx = -uSheetD * sheetShapeSlope(sheetQ(wx)) * uSheetT / uSheetW * uSheetP;
    dzdx += uLeanA * leanSlope(wx / uSheetW) / uSheetW * uSheetP;
    vec3 n = normalize(vec3(-dzdx, 0.0, 1.0));

    float a = sheetRoll(wx);
    if (abs(a) > 0.0001) {
      float s = sin(a);
      float c = cos(a);
      n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
    }
    return n;
  }

  vec3 sheetLit(vec3 col, vec3 n, vec3 v, float amt) {
    float d = dot(n, LIGHT_DIR) * 0.5 + 0.5;
    col *= 1.0 - LIGHT_DIFF * amt * (1.0 - d);
    vec3 h = normalize(LIGHT_DIR + v);
    return col + pow(max(dot(n, h), 0.0), LIGHT_GLOSS) * LIGHT_SPEC * amt;
  }

  void main() {
    if (uOpacity < 0.003) discard;

    vec2 uv = vUv;
    if (!gl_FrontFacing) uv.x = 1.0 - uv.x;

    vec2 size = mix(uCardSize, uTargetSize, uTransition);
    float aspect = size.x / size.y;
    vec2 scale = aspect > uImageAspect
      ? vec2(1.0, uImageAspect / aspect)
      : vec2(aspect / uImageAspect, 1.0);
      
    float dist = distance(vFlat.xy, uMouse);
    float hoverDistortion = smoothstep(300.0, 0.0, dist) * (1.0 - uTransition);
    float ripple = sin(dist * 0.04 - uTime * 6.0) * hoverDistortion;
    vec2 mouseDir = vFlat.xy == uMouse ? vec2(0.0) : normalize(vFlat.xy - uMouse);
    vec2 uvDistortion = mouseDir * ripple * 0.005 * uSheetP;
      
    vec3 color = texture2D(uMap, (uv - 0.5) * scale + 0.5 - uvDistortion).rgb;

    if (uSheetP > 0.001) {
      float depth = sheetShade(vFlat.x, vUv);
      color = mix(color, vec3(0.059), uShade * 0.8 * depth);

      vec3 p = vFlat + vec3(0.0, 0.0, sheetOffset(vFlat.x, vUv));
      color = sheetLit(color, sheetNormal(vFlat.x), normalize(cameraPosition - p), uSheetP);
    }

    if (!gl_FrontFacing) color *= 0.55;
    gl_FragColor = vec4(color, uOpacity);
  }
`;
