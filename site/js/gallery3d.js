/* ------------------------------------------------------------------
   gallery3d.js — the Signature Series carousel.
   Photographs live on a slowly rotating cylinder. Drag, wheel or the
   arrow keys move it; speed bends the planes and splits their colour
   channels; the frame nearest the centre reports its caption; a click
   without a drag opens the lightbox.
------------------------------------------------------------------ */
import * as THREE from 'three';

const VERT = /* glsl */`
  uniform float uStrength;
  uniform float uHover;
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main(){
    vUv = uv;
    vec3 p = position;

    /* bend with travel speed, plus a slow idle breath */
    float wave = sin(uv.x * 3.14159) ;
    p.z += wave * uStrength * 1.6;
    p.z += sin(uv.y * 3.14159 + uTime * 0.6) * 0.02 * (1.0 - uHover);
    p.xy *= 1.0 + uHover * 0.045;

    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2  uTexSize;
  uniform vec2  uPlaneSize;
  uniform float uStrength;
  uniform float uHover;
  uniform float uCentre;   /* 1 at the middle of the wall, 0 at the edges */
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vWave;

  vec2 cover(vec2 uv, vec2 plane, vec2 tex){
    vec2 s = plane / tex;
    float sc = max(s.x, s.y);
    vec2 size = tex * sc;
    vec2 off = (plane - size) * 0.5;
    return (uv * plane - off) / size;
  }

  void main(){
    vec2 uv = cover(vUv, uPlaneSize, uTexSize);

    /* zoom a touch on hover, from the centre */
    uv = (uv - 0.5) / (1.0 + uHover * 0.08) + 0.5;

    float shift = clamp(abs(uStrength), 0.0, 0.5) * 0.05;
    vec3 col;
    col.r = texture2D(uTex, uv + vec2(shift, 0.0)).r;
    col.g = texture2D(uTex, uv).g;
    col.b = texture2D(uTex, uv - vec2(shift, 0.0)).b;

    /* frames away from centre sit back in shadow and lose a little colour */
    float grey = dot(col, vec3(0.299, 0.587, 0.114));
    float focus = mix(uCentre, 1.0, uHover);
    col = mix(vec3(grey), col, mix(0.55, 1.0, focus));
    col *= mix(0.62, 1.05, focus);
    col = (col - 0.5) * 1.05 + 0.5;

    /* soft inner edge so the planes read as prints, not stickers */
    vec2 e = min(vUv, 1.0 - vUv);
    float frame = smoothstep(0.0, 0.012, min(e.x, e.y));
    col *= frame;

    col += vWave * uStrength * 0.35;

    gl_FragColor = vec4(col, uOpacity * frame);
  }
`;

export function createReel({ canvas, items, onCaption, onOpen, onDragState }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  if (!renderer.getContext()) return null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 7;

  const loader = new THREE.TextureLoader();
  const geo = new THREE.PlaneGeometry(1, 1, 24, 24);

  const PLANE_W = 2.05, PLANE_H = 2.75;
  const SPACING = 2.55;
  const RADIUS = 11;
  const total = items.length * SPACING;

  const planes = items.map((item, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      uniforms: {
        uTex:       { value: null },
        uTexSize:   { value: new THREE.Vector2(1, 1) },
        uPlaneSize: { value: new THREE.Vector2(PLANE_W, PLANE_H) },
        uStrength:  { value: 0 },
        uHover:     { value: 0 },
        uCentre:    { value: 0 },
        uOpacity:   { value: 0 },
        uTime:      { value: 0 }
      }
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(PLANE_W, PLANE_H, 1);
    mesh.userData = { i, item, hover: 0, target: 0 };
    scene.add(mesh);

    loader.load(item.src, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      mat.uniforms.uTex.value = tex;
      mat.uniforms.uTexSize.value.set(tex.image.width, tex.image.height);
    });
    return mesh;
  });

  /* ---------- state ---------- */
  let scroll = 0, target = 0, velocity = 0, strength = 0;
  let dragging = false, dragStartX = 0, dragStartScroll = 0, dragMoved = 0;
  let hoveredIndex = -1, captionIndex = -1;
  let inView = false, raf = 0, ready = false;
  const clock = new THREE.Clock();
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-2, -2);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* a wide screen shows a wall of frames; a narrow one shows one, up close */
    camera.position.z = w < 700 ? 5.4 : w < 1100 ? 6.4 : 7;
    camera.updateProjectionMatrix();
  }

  function layout() {
    for (const mesh of planes) {
      let x = mesh.userData.i * SPACING - scroll;
      x = ((x + total * 0.5) % total + total) % total - total * 0.5;   /* wrap */

      const angle = x / RADIUS;
      mesh.position.x = Math.sin(angle) * RADIUS;
      mesh.position.z = Math.cos(angle) * RADIUS - RADIUS;
      mesh.position.y = Math.sin(angle * 2.0) * 0.12;
      mesh.rotation.y = -angle;
      mesh.rotation.z = velocity * 0.02;

      const d = Math.abs(x);
      const centre = 1 - Math.min(1, d / (SPACING * 3.2));
      const u = mesh.material.uniforms;
      u.uCentre.value += (centre - u.uCentre.value) * 0.12;
      u.uStrength.value = strength;
      u.uOpacity.value = ready ? 1 - Math.min(1, Math.max(0, (d - SPACING * 3.1) / SPACING)) : 0;

      mesh.userData.dist = d;
    }
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    if (!dragging) target += dt * 0.28;                    /* gentle idle drift */

    const prev = scroll;
    scroll += (target - scroll) * 0.075;
    velocity = scroll - prev;
    strength += (Math.max(-0.6, Math.min(0.6, velocity * 1.1)) - strength) * 0.12;
    if (ready === false) ready = true;

    layout();

    /* hover test */
    if (!dragging && pointer.x > -1.5) {
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(planes, false)[0];
      hoveredIndex = hit ? hit.object.userData.i : -1;
    } else if (dragging) {
      hoveredIndex = -1;
    }

    let nearest = null;
    for (const mesh of planes) {
      const u = mesh.material.uniforms;
      u.uTime.value += dt;
      const want = mesh.userData.i === hoveredIndex ? 1 : 0;
      mesh.userData.hover += (want - mesh.userData.hover) * 0.1;
      u.uHover.value = mesh.userData.hover;
      if (!nearest || mesh.userData.dist < nearest.userData.dist) nearest = mesh;
    }

    if (nearest && nearest.userData.i !== captionIndex) {
      captionIndex = nearest.userData.i;
      onCaption && onCaption(nearest.userData.item);
    }

    renderer.render(scene, camera);
  }

  /* ---------- input ---------- */
  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  const onWheel = e => {
    /* only hijack clearly horizontal gestures; vertical scroll stays the page's */
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (horizontal) { e.preventDefault(); target += e.deltaX * 0.006; }
    else target += e.deltaY * 0.0022;
  };

  const onDown = e => {
    dragging = true; dragMoved = 0;
    dragStartX = e.clientX; dragStartScroll = target;
    canvas.classList.add('is-grabbing');
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    onDragState && onDragState(true);
  };

  const onMove = e => {
    setPointer(e);
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    dragMoved = Math.max(dragMoved, Math.abs(dx));
    const r = canvas.getBoundingClientRect();
    target = dragStartScroll - (dx / r.width) * 12;
  };

  const onUp = e => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-grabbing');
    onDragState && onDragState(false);
    if (dragMoved < 6) {                                   /* a click, not a drag */
      setPointer(e);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(planes, false)[0];
      if (hit) onOpen && onOpen(hit.object.userData.i);
    }
  };

  const onLeave = () => { pointer.set(-2, -2); hoveredIndex = -1; };

  const onKey = e => {
    if (!inView) return;
    if (e.key === 'ArrowRight') { target += SPACING; e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { target -= SPACING; e.preventDefault(); }
  };

  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);

  const io = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) clock.getDelta(); }, { threshold: 0.05 });
  io.observe(canvas);

  resize();
  layout();
  raf = requestAnimationFrame(tick);

  return {
    to(i) { target = i * SPACING; },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      planes.forEach(m => { m.material.uniforms.uTex.value?.dispose(); m.material.dispose(); });
      geo.dispose();
      renderer.dispose();
    }
  };
}
