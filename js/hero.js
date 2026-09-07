/* ------------------------------------------------------------------
   hero.js — WebGL slideshow for the hero panel.
   A single plane cross-dissolves between photographs with
   a noise-driven wipe, a slow Ken Burns push, mouse parallax, film
   grain and a vignette. Falls back to CSS backgrounds without WebGL.
------------------------------------------------------------------ */
import * as THREE from 'three';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform vec2  uSizeA;
  uniform vec2  uSizeB;
  uniform vec2  uRes;
  uniform vec2  uMouse;
  uniform float uProgress;
  uniform float uTime;
  uniform float uZoomA;
  uniform float uZoomB;
  uniform float uReveal;

  /* --- simplex noise (Ashima, condensed) --- */
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  /* --- background-size: cover, in UV space --- */
  vec2 cover(vec2 uv, vec2 res, vec2 texSize, float zoom){
    vec2 s = res / texSize;
    float sc = max(s.x, s.y) * zoom;
    vec2 size = texSize * sc;
    vec2 off = (res - size) * 0.5;
    return (uv * res - off) / size;
  }

  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main(){
    vec2 uv = vUv;

    /* organic wipe field */
    float n  = snoise(uv * 2.6 + uTime * 0.04) * 0.5 + 0.5;
    float field = n * 0.62 + uv.x * 0.22 + uv.y * 0.16;
    float thr = mix(-0.45, 1.45, uProgress);
    float m = smoothstep(thr - 0.34, thr + 0.34, field);
    float reveal = 1.0 - m;                 /* 0 = slide A, 1 = slide B */

    /* displacement pulls the outgoing frame apart as it leaves */
    float bend = sin(reveal * 3.14159) * 0.06;
    vec2 dir = vec2(n - 0.5, snoise(uv * 3.1 - 40.0) * 0.5);

    vec2 par = uMouse * 0.014;
    vec2 uvA = cover(uv + par + dir * bend, uRes, uSizeA, uZoomA);
    vec2 uvB = cover(uv + par * 0.6 - dir * bend, uRes, uSizeB, uZoomB);

    vec3 a = texture2D(uTexA, uvA).rgb;
    vec3 b = texture2D(uTexB, uvB).rgb;
    vec3 col = mix(a, b, reveal);

    /* a whisper of chromatic separation along the wipe edge */
    float edge = smoothstep(0.0, 0.5, reveal) * smoothstep(1.0, 0.5, reveal);
    if (edge > 0.001){
      float o = edge * 0.004;
      vec3 shifted = vec3(
        mix(texture2D(uTexA, uvA + vec2(o, 0.0)).r, texture2D(uTexB, uvB + vec2(o, 0.0)).r, reveal),
        col.g,
        mix(texture2D(uTexA, uvA - vec2(o, 0.0)).b, texture2D(uTexB, uvB - vec2(o, 0.0)).b, reveal)
      );
      col = mix(col, shifted, 0.85);
    }

    /* grade: gentle contrast, warm highlights, cool shadows */
    col = (col - 0.5) * 1.06 + 0.5;
    col += vec3(0.020, 0.010, -0.006) * (1.0 - col);
    col *= mix(0.92, 1.0, uReveal);

    /* vignette + grain */
    vec2 v = uv - 0.5;
    col *= 1.0 - dot(v, v) * 0.85;
    col += (hash(uv * uRes + fract(uTime)) - 0.5) * 0.035;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createHero({ canvas, slides, onChange, dwell = 5200, fade = 1600 }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return null;                                   /* caller shows the CSS fallback */
  }
  if (!renderer.getContext()) return null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const loader = new THREE.TextureLoader();

  const uniforms = {
    uTexA:     { value: null },
    uTexB:     { value: null },
    uSizeA:    { value: new THREE.Vector2(1, 1) },
    uSizeB:    { value: new THREE.Vector2(1, 1) },
    uRes:      { value: new THREE.Vector2(1, 1) },
    uMouse:    { value: new THREE.Vector2(0, 0) },
    uProgress: { value: 0 },
    uTime:     { value: 0 },
    uZoomA:    { value: 1.035 },
    uZoomB:    { value: 1.0 },
    uReveal:   { value: 0 }
  };

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false })
  );
  mesh.frustumCulled = false;
  scene.add(mesh);

  /* ---------- textures ---------- */
  const textures = new Array(slides.length);
  function load(src) {
    return new Promise(res => {
      loader.load(src, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        res(tex);
      }, undefined, () => res(null));
    });
  }

  /* ---------- state ---------- */
  let index = 0, next = 1;
  let progress = 0, transitioning = false, tStart = 0, lastSwap = 0;
  let running = false, visible = true, raf = 0;
  const clock = new THREE.Clock();
  const mouse = new THREE.Vector2();
  const mouseTarget = new THREE.Vector2();
  let intro = 0;

  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function setTex(slot, tex) {
    if (!tex) return;
    uniforms[slot === 0 ? 'uTexA' : 'uTexB'].value = tex;
    uniforms[slot === 0 ? 'uSizeA' : 'uSizeB'].value.set(tex.image.width, tex.image.height);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
  }

  function goTo(target) {
    if (transitioning || target === index) return;
    next = (target + textures.length) % textures.length;
    if (!textures[next]) return;                   /* still streaming in */
    setTex(1, textures[next]);
    uniforms.uZoomB.value = 1.04;
    transitioning = true;
    tStart = performance.now();
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!visible) return;

    const dt = clock.getDelta();
    uniforms.uTime.value += dt;

    /* opening fade-up */
    if (intro < 1) { intro = Math.min(1, intro + dt * 0.7); uniforms.uReveal.value = intro; }

    /* slow, opposing Ken Burns pushes */
    uniforms.uZoomA.value -= dt * 0.0032;
    uniforms.uZoomB.value -= dt * 0.0032;
    uniforms.uZoomA.value = Math.max(1.0, uniforms.uZoomA.value);
    uniforms.uZoomB.value = Math.max(1.0, uniforms.uZoomB.value);

    /* eased pointer parallax */
    mouse.lerp(mouseTarget, 0.045);
    uniforms.uMouse.value.copy(mouse);

    if (transitioning) {
      const t = Math.min(1, (now - tStart) / fade);
      uniforms.uProgress.value = easeInOut(t);
      if (t >= 1) {
        transitioning = false;
        index = next;
        setTex(0, textures[index]);
        uniforms.uZoomA.value = uniforms.uZoomB.value;
        uniforms.uProgress.value = 0;
        lastSwap = now;
        onChange && onChange(index, slides[index]);   /* caption follows the frame on screen */
      }
    } else if (running && now - lastSwap > dwell) {
      goTo((index + 1) % textures.length);
    }

    renderer.render(scene, camera);
  }

  /* ---------- events ---------- */
  const onMove = e => {
    mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  const onVis = () => { visible = !document.hidden; if (visible) { clock.getDelta(); lastSwap = performance.now(); } };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVis);

  /* ---------- boot ---------- */
  const api = {
    async start() {
      resize();
      const first = await load(slides[0].src);
      if (!first) return false;
      textures[0] = first;
      setTex(0, first);
      setTex(1, first);
      lastSwap = performance.now();
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(tick);
      onChange && onChange(0, slides[0]);

      /* the rest stream in behind the first paint — nothing waits on them */
      slides.slice(1).forEach((s, n) => { load(s.src).then(t => { textures[n + 1] = t; }); });
      return true;
    },
    goTo,
    get index() { return index; },
    pause() { running = false; },
    resume() { running = true; lastSwap = performance.now(); },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      textures.forEach(t => t && t.dispose());
      mesh.geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
    }
  };
  return api;
}
