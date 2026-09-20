export const VERTEX_SHADER = `
  attribute float aThread;
  attribute float aRim;

  uniform float uTime;
  uniform float uHalfHeight;
  uniform float uZone;
  uniform float uStrength;
  uniform float uWobble;
  uniform float uSeed;
  uniform float uScrollVelocity;
  uniform vec2 uMouse;
  
  uniform float uTransitionProgress;
  uniform vec2 uTargetSize;
  uniform vec2 uTargetPosition;
  uniform vec2 uCardSize;

  varying vec2  vUv;
  varying float vTear;
  varying float vRim;
  varying float vRandom;
  varying vec3  vWorld;

  float hash(float n) {
    return fract(sin(n * 127.1 + 311.7) * 43758.5453);
  }

  void main() {
    vUv = uv;
    vRim = aRim;

    vec4 world = modelMatrix * vec4(position, 1.0);
    float y = world.y;

    float bottom = 1.0 - smoothstep(-uHalfHeight, -uHalfHeight + uZone, y);
    float top = smoothstep(uHalfHeight - uZone, uHalfHeight, y);
    // Tear fades out during transition
    float tear = max(bottom, top) * uStrength * (1.0 - uTransitionProgress);

    // Scroll Distortion (Jelly effect) fades out during transition
    float distortion = uScrollVelocity * 1.5 * (1.0 - uTransitionProgress);
    world.y -= sin(uv.x * 3.14159) * distortion;
    world.x -= sin(uv.y * 3.14159) * distortion * 0.3;

    // Mouse Hover Bulge
    float dist = distance(world.xy, uMouse);
    float hover = smoothstep(300.0, 0.0, dist) * (1.0 - uTransitionProgress);
    if (dist > 0.001) {
      vec2 pushDir = normalize(world.xy - uMouse);
      world.xy += pushDir * hover * 2.0; 
    }
    world.z += hover * 2.0; 

    float direction = y < 0.0 ? -1.0 : 1.0;

    float randomA = hash(aThread + uSeed * 57.0);
    float randomB = hash(aThread * 3.7 + uSeed * 91.0);
    vRandom = randomA;

    float t = pow(tear, 1.4);
    float speedFactor = 1.0 + abs(uScrollVelocity) * 0.02;

    float run = t * (60.0 + randomA * 420.0) * speedFactor;
    run *= 0.85 + 0.15 * sin(uTime * (1.0 + randomB * 2.0) + randomA * 6.2831);
    
    world.y += direction * run;
    world.x += (randomA - 0.5) * 170.0 * t * t;
    world.x += sin(world.y * 0.02 + uTime * (1.6 + randomA * 2.2) + randomA * 6.2831)
               * (5.0 + 13.0 * randomA) * t * uWobble;

    // --- TRANSITION TO FULLSCREEN WITH RIPPLE ---
    float angle = uTransitionProgress * 3.14159265 / 2.0;
    float wave = cos(angle);
    float c = sin(length(uv - 0.5) * 15.0 + uTransitionProgress * 12.0) * 0.5 + 0.5;

    // The base origin of the mesh in world space
    vec2 meshOrigin = world.xy - position.xy; 
    
    // Smoothly move the origin to the target position (center of the 600px header)
    vec2 currentOrigin = mix(meshOrigin, uTargetPosition, uTransitionProgress);

    // Scale vertices to target size (100vw x 600px) + ripple
    vec2 targetScale = uTargetSize / uCardSize;
    vec2 currentScale = mix(vec2(1.0), targetScale + wave * c, uTransitionProgress);
    vec2 scaledLocalPos = position.xy * currentScale;

    // Apply the expanded positions
    world.xy = currentOrigin + scaledLocalPos;
    
    // Push active mesh slightly forward so it covers others (but don't pass the camera at z=10)
    world.z += uTransitionProgress * 5.0; 

    vTear = tear;
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D uMap;
  uniform vec2  uCardSize;
  uniform float uRadius;
  uniform float uImageAspect;
  uniform vec2  uMouse;
  uniform float uTime;
  
  uniform float uTransitionProgress;
  uniform vec2 uTargetSize;
  uniform float uOpacity;

  varying vec2  vUv;
  varying float vTear;
  varying float vRim;
  varying float vRandom;
  varying vec3  vWorld;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    float tear = vTear;
    float rim  = abs(vRim); 

    float coreWidth = mix(0.8, 0.16 + vRandom * 0.12, smoothstep(0.0, 0.85, tear));
    float threadAlpha = 1.0 - smoothstep(coreWidth - 0.10, coreWidth + 0.06, rim);
    threadAlpha = mix(1.0, threadAlpha, smoothstep(0.03, 0.30, tear));

    vec2 currentSize = mix(uCardSize, uTargetSize, uTransitionProgress);
    float currentRadius = mix(uRadius, 0.0, uTransitionProgress);

    vec2 p = (vUv - 0.5) * currentSize;
    float cardAlpha = 1.0 - smoothstep(-1.5, 0.5, sdRoundBox(p, currentSize * 0.5, currentRadius));

    float fade  = 1.0 - smoothstep(0.75, 1.0, tear) * 0.65;
    float alpha = cardAlpha * threadAlpha * fade * uOpacity;
    if (alpha < 0.003) discard;

    // Mouse interactive ripple
    float dist = distance(vWorld.xy, uMouse);
    float hover = smoothstep(300.0, 0.0, dist) * (1.0 - uTransitionProgress);
    float ripple = sin(dist * 0.04 - uTime * 6.0) * hover;
    vec2 mouseDir = vWorld.xy == uMouse ? vec2(0.0) : normalize(vWorld.xy - uMouse);
    vec2 uvDistortion = mouseDir * ripple * 0.005;

    float currentAspect = currentSize.x / currentSize.y;
    vec2 scale = currentAspect > uImageAspect
      ? vec2(1.0, uImageAspect / currentAspect)
      : vec2(currentAspect / uImageAspect, 1.0);
      
    vec2 finalUv = (vUv - 0.5) * scale + 0.5 - uvDistortion;
    vec3 color = texture2D(uMap, finalUv).rgb;

    color *= 1.0 - tear * 0.4 * rim * rim;                          
    color += tear * 0.18 * (1.0 - smoothstep(0.0, 0.45, rim));      
    color = mix(color, vec3(1.0), smoothstep(0.55, 1.0, tear) * 0.8); 

    gl_FragColor = vec4(color, alpha);
  }
`;
