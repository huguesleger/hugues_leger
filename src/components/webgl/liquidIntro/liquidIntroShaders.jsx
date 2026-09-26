export const bgVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bgFragmentShader = /* glsl */ `
  uniform sampler2D uTexCreative;
  uniform sampler2D uTexDeveloper;
  uniform vec2 uMouse;
  uniform float uVelocity;
  uniform float uProgress;
  uniform vec2 uResolution;
  varying vec2 vUv;
  
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  
  float noise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return (130.0 * dot(m, g)) * 0.5 + 0.5;
  }
  
  float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
      }
      return value;
  }

  void main() {
    float dist = distance(vUv, uMouse);
    float radius = 0.35;
    
    float screenAspect = uResolution.x / uResolution.y;
    float texAspect = 2.0; 
    
    vec2 baseUv = vUv;
    baseUv -= 0.5;
    if (screenAspect > texAspect) {
      baseUv.x *= screenAspect / texAspect;
    } else {
      baseUv.y *= texAspect / screenAspect;
    }
    baseUv += 0.5;
    
    vec2 distortedUv = baseUv;
    
    if (dist < radius) {
      float influence = smoothstep(radius, 0.0, dist);
      vec2 dir = normalize(vUv - uMouse);
      float wave = sin(influence * 3.14159) * 0.02;
      distortedUv = baseUv - dir * wave;
    }
    
    vec3 bgColor = texture2D(uTexCreative, vec2(0.0, 0.0)).rgb;
    
    vec2 centerC = vec2(0.5, 0.5);
    float angleC = -uProgress * 0.08;
    float cosC = cos(angleC); float sinC = sin(angleC);
    
    vec2 uvC = distortedUv - centerC;
    uvC = vec2(cosC * uvC.x - sinC * uvC.y, sinC * uvC.x + cosC * uvC.y);
    uvC += centerC;
    uvC.y -= uProgress * 0.12;
    vec2 uvCreative = uvC;
    
    vec2 centerD = vec2(0.5, 0.5);
    float angleD = -uProgress * 0.04;
    float cosD = cos(angleD); float sinD = sin(angleD);
    
    vec2 uvD = distortedUv - centerD;
    uvD = vec2(cosD * uvD.x - sinD * uvD.y, sinD * uvD.x + cosD * uvD.y);
    uvD += centerD;
    uvD.y -= uProgress * 0.05;
    vec2 uvDeveloper = uvD;
    
    float blurProgress = smoothstep(0.05, 0.7, abs(uProgress));
    float maxBlur = 0.04;
    float blurRadius = blurProgress * maxBlur;
    
    vec4 colorCreative = vec4(0.0);
    vec4 colorDeveloper = vec4(0.0);
    
    if (blurRadius < 0.001) {
        colorCreative = texture2D(uTexCreative, uvCreative);
        colorDeveloper = texture2D(uTexDeveloper, uvDeveloper);
    } else {
        const float TAU = 6.28318530718;
        const float directions = 16.0;
        const float quality = 3.0;
        float total = 1.0;
        
        colorCreative = texture2D(uTexCreative, uvCreative);
        colorDeveloper = texture2D(uTexDeveloper, uvDeveloper);
        
        for (float d = 0.0; d < TAU; d += TAU / directions) {
            for (float i = 1.0 / quality; i <= 1.0; i += 1.0 / quality) {
                vec2 offset = vec2(cos(d), sin(d)) * blurRadius * i;
                offset.x *= uResolution.y / uResolution.x;
                
                colorCreative += texture2D(uTexCreative, uvCreative + offset);
                colorDeveloper += texture2D(uTexDeveloper, uvDeveloper + offset);
                total += 1.0;
            }
        }
        
        vec2 trailDir = normalize(vec2(-0.3, 1.0)); 
        float trailLength = blurProgress * 0.4; 
        const float trailSamples = 30.0;
        
        for (float i = 1.0; i <= trailSamples; i += 1.0) {
            float f = i / trailSamples;
            float weight = pow(1.0 - f, 1.5) * 15.0; 
            
            vec2 offset = trailDir * trailLength * f;
            offset.x *= uResolution.y / uResolution.x;
            
            colorCreative += texture2D(uTexCreative, uvCreative + offset) * weight;
            colorDeveloper += texture2D(uTexDeveloper, uvDeveloper + offset) * weight;
            total += weight;
        }
        
        colorCreative /= total;
        colorDeveloper /= total;
    }
    
    vec4 color = colorCreative;
    color.rgb = mix(color.rgb, vec3(1.0), colorDeveloper.a);
    color.rgb = mix(color.rgb, bgColor, blurProgress);
    
    gl_FragColor = color;
  }
`;

export const vertexShader = /* glsl */ `
  vec4 permute4(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt4(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod(i,289.0);
    vec4 p=permute4(permute4(permute4(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt4(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  uniform float uTime;
  uniform float uDistort;
  uniform float uFrequency;
  void main() {
    vec3 pOffset = vec3(cos(uTime), sin(uTime), sin(uTime * 0.8)) * 1.5;
    float d = snoise(normalize(position) * uFrequency + pOffset) * uDistort;
    vec3 newPos = position + normal * d;

    float eps = 0.001;
    vec3 tangent1 = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    vec3 tangent2 = normalize(cross(normal, tangent1));

    float d1 = snoise(normalize(position + tangent1 * eps) * uFrequency + pOffset) * uDistort;
    float d2 = snoise(normalize(position + tangent2 * eps) * uFrequency + pOffset) * uDistort;

    vec3 p1 = (position + tangent1 * eps) + normal * d1;
    vec3 p2 = (position + tangent2 * eps) + normal * d2;

    vec3 computedNormal = normalize(cross(p1 - newPos, p2 - newPos));
    csm_Position = newPos;
    csm_Normal = computedNormal;
    csm_Normal = computedNormal;
    vec3 worldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;
  }
`;

export const fragmentShader = /* glsl */ `
  void main() {
    csm_DiffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;
