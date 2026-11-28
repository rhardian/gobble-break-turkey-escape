// Custom GLSL shaders for Pixar-grade visual craft: animated 450°F volumetric fire, painterly sky dome, golden sunbeams, and knife slash arcs.

import * as THREE from 'three';

export function createVolumetricFireMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vNoise;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float tip = clamp(uv.y, 0.0, 1.0);
        float wave = sin(pos.x * 3.8 + uTime * 16.0) * 0.16 + cos(pos.z * 5.2 - uTime * 13.0) * 0.12;
        pos.y += wave * tip * 0.85 + tip * tip * 0.42;
        pos.z += sin(pos.x * 4.5 - uTime * 18.0) * 0.14 * tip;
        vNoise = wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      varying float vNoise;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.55;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        float n = fbm(vec2(uv.x * 5.0, uv.y * 3.8 - uTime * 5.2));
        float n2 = fbm(vec2(uv.x * 9.5 + 1.7, uv.y * 6.4 - uTime * 7.8));
        float turb = n * 0.62 + n2 * 0.38;

        // Tapered fiery licking flame tongues with soft glowing mouth & crackling crimson tips
        float mouthFade = smoothstep(0.0, 0.14, uv.y);
        float edge = 1.0 - uv.y + (turb - 0.5) * 0.72;
        float alpha = smoothstep(0.16, 0.52, edge) * mouthFade;

        float heat = clamp((1.0 - uv.y) * 0.88 + (turb - 0.35) * 0.52, 0.0, 1.0);
        vec3 colDeepRed = vec3(0.78, 0.08, 0.02);
        vec3 colOrange = vec3(0.98, 0.34, 0.03);
        vec3 colGold = vec3(1.0, 0.74, 0.12);
        vec3 colCore = vec3(1.0, 0.94, 0.62);

        vec3 col = mix(colDeepRed, colOrange, smoothstep(0.08, 0.42, heat));
        col = mix(col, colGold, smoothstep(0.45, 0.76, heat));
        col = mix(col, colCore, smoothstep(0.80, 0.98, heat));

        gl_FragColor = vec4(col * (1.06 * uIntensity), clamp(alpha * 0.94, 0.0, 1.0));
      }
    `,
  });
}

export function createSkyBackdropMaterial(theme) {
  const isNight = theme === 'banquet';
  const isWarmIndoor = theme === 'barn' || theme === 'kitchen';
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTopColor: { value: new THREE.Color(isNight ? 0x100c24 : isWarmIndoor ? 0x2b1209 : 0x5c2334) },
      uMidColor: { value: new THREE.Color(isNight ? 0x2a1f52 : isWarmIndoor ? 0x732d14 : 0xd95f24) },
      uHorizColor: { value: new THREE.Color(isNight ? 0x8f5946 : isWarmIndoor ? 0xe08d38 : 0xffd26e) },
      uSunColor: { value: new THREE.Color(isNight ? 0xfff7d6 : 0xfff4bd) },
      uNight: { value: isNight ? 1.0 : 0.0 },
    },
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizColor;
      uniform vec3 uSunColor;
      uniform float uNight;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        float y = clamp(vUv.y, 0.0, 1.0);
        vec3 col = mix(uHorizColor, uMidColor, smoothstep(0.18, 0.56, y));
        col = mix(col, uTopColor, smoothstep(0.52, 0.94, y));

        // Glowing golden harvest sun or luminous moon disc + corona halo
        vec2 orbPos = vec2(0.72, 0.58);
        vec2 diff = (vUv - orbPos) * vec2(2.6, 1.0);
        float dist = length(diff);
        float halo = exp(-dist * 4.2) * 0.72;
        float disc = smoothstep(0.11, 0.082, dist);
        col += uSunColor * (halo + disc * 0.95);

        // Soft painted drifting sunset clouds
        vec2 cUv = vec2(vUv.x * 7.5 + uTime * 0.025, vUv.y * 4.2);
        float cl = noise(cUv) * 0.65 + noise(cUv * 2.3 + 4.1) * 0.35;
        float cloudMask = smoothstep(0.54, 0.76, cl) * smoothstep(0.24, 0.45, y) * smoothstep(0.92, 0.62, y);
        vec3 cloudCol = mix(vec3(1.0, 0.85, 0.56), vec3(0.45, 0.38, 0.62), uNight);
        col = mix(col, cloudCol, cloudMask * 0.48);

        // Twinkling stars on moonlit banquet sky
        if (uNight > 0.5 && y > 0.42) {
          vec2 cell = floor(vUv * vec2(160.0, 70.0));
          float st = hash(cell);
          if (st > 0.985) {
            float tw = 0.6 + 0.4 * sin(uTime * 3.5 + st * 90.0);
            col += vec3(1.0, 0.96, 0.82) * tw * smoothstep(0.42, 0.62, y);
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export function createGodRayMaterial(colorHex = 0xffd578, opacity = 0.2) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float horiz = sin(vUv.x * 3.14159265);
        float vert = smoothstep(0.0, 0.38, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
        float shimmer = 0.82 + 0.18 * sin(vUv.x * 12.0 + uTime * 1.4);
        float a = horiz * horiz * vert * shimmer * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
}

export function createKnifeSlashMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xeef8ff) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float fade = smoothstep(0.0, 0.88, vUv.x) * sin(vUv.y * 3.14159265);
        gl_FragColor = vec4(uColor, fade * 0.42);
      }
    `,
  });
}
