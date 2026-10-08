export const WORKS_VERTEX_SHADER = `
  uniform float uProgress;
  uniform float uVelocity;
  uniform float uWaveAmp;
  uniform float uWaveFreq;
  uniform float uWaveVelocityMax;
  uniform float uHalfWidth;
  uniform float uTransition;
  uniform vec2  uCardSize;
  uniform vec2  uTargetSize;
  uniform vec2  uTargetPosition;

  varying vec2  vUv;
  varying float vShade;

  #define PI 3.14159265

  void main() {
    vUv = uv;

    vec4 world = modelMatrix * vec4(position, 1.0);
    float free = 1.0 - uTransition;

    float engaged = uProgress * free;
    float strength = clamp(uVelocity / uWaveVelocityMax, -1.0, 1.0);
    float wave = sin(world.x * uWaveFreq);
    world.y += wave * uWaveAmp * strength * engaged;

    float nx = clamp(world.x / uHalfWidth, -1.5, 1.5);
    world.z -= nx * nx * abs(strength) * uWaveAmp * 0.6 * engaged;

    vec3 origin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec2 local = position.xy * uCardSize;
    vec2 targetScale = uTargetSize / uCardSize;
    float ripple = sin(length(uv - 0.5) * 12.0 + uTransition * 10.0) * 0.5 + 0.5;
    vec2 scale = mix(vec2(1.0), targetScale + cos(uTransition * PI * 0.5) * ripple * 0.15, uTransition);
    vec2 expanded = mix(origin.xy, uTargetPosition, uTransition) + local * scale;
    world.xy = mix(world.xy, expanded, uTransition);
    world.z = mix(world.z, 2.0, uTransition);

    vShade = wave * strength * engaged;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const WORKS_FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D uMap;
  uniform float uImageAspect;
  uniform float uOpacity;
  uniform float uVelocity;
  uniform float uTransition;
  uniform float uHover;
  uniform vec2  uCardSize;
  uniform vec2  uTargetSize;

  varying vec2  vUv;
  varying float vShade;

  void main() {
    vec2 uv = vUv;
    if (!gl_FrontFacing) uv.x = 1.0 - uv.x;

    vec2 size = mix(uCardSize, uTargetSize, uTransition);
    float aspect = size.x / size.y;
    vec2 scale = aspect > uImageAspect
      ? vec2(1.0, uImageAspect / aspect)
      : vec2(aspect / uImageAspect, 1.0);

    float zoom = 1.0 - uHover * 0.06;
    vec2 coverUv = (uv - 0.5) * scale * zoom + 0.5;

    float shift = clamp(uVelocity, -40.0, 40.0) * 0.00015 * (1.0 - uTransition);
    vec3 color;
    color.r = texture2D(uMap, coverUv + vec2(shift, 0.0)).r;
    color.g = texture2D(uMap, coverUv).g;
    color.b = texture2D(uMap, coverUv - vec2(shift, 0.0)).b;

    color *= 1.0 + vShade * 0.04;
    if (!gl_FrontFacing) color *= 0.55;

    if (uOpacity < 0.003) discard;
    gl_FragColor = vec4(color, uOpacity);
  }
`;
