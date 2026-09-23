// Ported from franky-adl/3d-wave-grid (MIT) — Stage.js

export function overrideVertexShader(vertexShader) {
  return vertexShader
    .replace(
      '#include <common>',
      `#include <common>
 varying float vHeight;
 attribute vec2 aOffset;
 uniform sampler2D uTrailTexture;
 uniform int uTrailCount;
 uniform float uWaveSpeed;
 uniform float uWaveFreq;
 uniform float uWaveWidth;
 uniform float uFadeTime;
 uniform float uAmplitude;
 uniform float uJitter;
 uniform float uMaxHeight;

 vec2 hash2( vec2 p ) {
   p = vec2(
     dot( p, vec2( 127.1, 311.7 ) ),
     dot( p, vec2( 269.5, 183.3 ) )
   );
   return fract( sin( p ) * 43758.5453123 ) - 0.5;
 }`
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>

 vHeight = 0.0;

 if ( position.y > 0.0 ) {
   vec2 jitter = hash2( aOffset ) * uJitter;
   vec2 worldXZ = aOffset + jitter;
   float waveHeight = 0.0;
   float totalWeight = 0.0;

   for ( int i = 0; i < uTrailCount; i++ ) {
     vec4 td = texture2D(
       uTrailTexture,
       vec2( ( float(i) + 0.5 ) / 128.0, 0.5 )
     );
     float dist = length( worldXZ - td.rg );
     float wavefront = uWaveSpeed * td.b;
     float relDist = dist - wavefront;
     float window = exp( -( relDist * relDist ) / ( uWaveWidth * uWaveWidth ) );
     float fade = exp( -td.b / uFadeTime );
     float atten = 1.0 / ( 1.0 + dist * 0.1 );
     float weight = fade * window * atten * td.a;
     waveHeight += weight * cos( uWaveFreq * relDist );
     totalWeight += weight;
   }

   waveHeight /= max( totalWeight, 1.0 );
   float displacement = clamp( waveHeight * uAmplitude, -uMaxHeight, uMaxHeight );
   transformed.y += displacement;
   vHeight = displacement;
 }`
    );
}

export function patchFragmentShader(fragmentShader) {
  return fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
 varying float vHeight;
 uniform vec3 uColorBase;
 uniform vec3 uColorHigh;
 uniform float uMaxHeight;`
    )
    .replace(
      '#include <color_fragment>',
      `#include <color_fragment>
 float t = clamp( vHeight / uMaxHeight, 0.0, 1.0 );
 diffuseColor.rgb = mix( uColorBase, uColorHigh, t );`
    );
}
