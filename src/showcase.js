// Rendering engine: renderer, lighting, environments, camera moves and scroll driven state.
import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import assets from 'virtual:amce-assets';
import { createChair, CHAIR_CONFIG } from './chair.js';
import { createEnvironments, PALETTE } from './environments.js';

export const VIEWS = {
  hero: { pos: [3.9, 1.55, 4.6], target: [0, 0.98, 0] },
  front: { pos: [0.0, 1.15, 5.6], target: [0, 1.0, 0] },
  side: { pos: [-5.6, 1.2, 0.25], target: [0, 1.0, 0] },
  back: { pos: [0.6, 1.4, -5.6], target: [0, 1.0, 0] },
  top: { pos: [0.0, 6.4, 1.4], target: [0, 0.7, 0] },
  anatomy: { pos: [4.7, 2.7, 5.2], target: [0, 1.15, 0] },
  tech: { pos: [3.0, 1.6, 4.4], target: [0.1, 1.0, 0] },
  inplace: { pos: [-3.9, 1.45, 4.8], target: [0, 0.95, 0] },
  overview: { pos: [3.6, 1.65, 4.4], target: [0, 0.98, 0] },
  solar: { pos: [1.4, 3.6, 2.4], target: [0, 2.0, 0] },
  tactile: { pos: [-0.12, 1.25, 1.55], target: [0.44, 0.68, 0] },
  silhouette: { pos: [-5.8, 1.15, 0], target: [0, 1.0, 0] },
};

// Where the chair sits on screen in each section so it never fights the text.
// Values are fractions of the viewport: x moves right, y moves up.
const LAYOUT = {
  hero: { desktop: [0.2, 0], mobile: [0, 0.17] },
  design: { desktop: [0.08, 0], mobile: [0, 0.13] },
  anatomy: { desktop: [0.15, 0], mobile: [0, 0.15] },
  tech: { desktop: [0.1, 0], mobile: [0, 0.12] },
  inplace: { desktop: [-0.13, 0], mobile: [0, 0.15] },
  explore: { desktop: [0.1, 0], mobile: [0, 0.17] },
};

const SUNRISE = 7;
const SUNSET = 19.5;
const MAX_ELEVATION = THREE.MathUtils.degToRad(62);

export function sunElevation(hours) {
  const k = (hours - SUNRISE) / (SUNSET - SUNRISE);
  return MAX_ELEVATION * Math.sin(Math.PI * THREE.MathUtils.clamp(k, 0, 1));
}

// Relative 0..1 value, used only for the illustrative indicator.
export function solarExposure(hours) {
  return Math.max(0, Math.sin(sunElevation(hours))) / Math.sin(MAX_ELEVATION);
}

const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const SKY = {
  day: { top: new THREE.Color('#AEBFCB'), horizon: new THREE.Color('#E9E4DA') },
  gold: { top: new THREE.Color('#8E9AAB'), horizon: new THREE.Color('#EBCBA4') },
  dusk: { top: new THREE.Color('#4B5366'), horizon: new THREE.Color('#D49A74') },
};
const SUN = {
  noon: new THREE.Color('#FFF3E2'),
  gold: new THREE.Color('#FFC48A'),
  dusk: new THREE.Color('#F08A55'),
  studio: new THREE.Color('#FFF6EC'),
};

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export class Showcase {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.motion = !reducedMotion;
    this.onFrame = null;
    this.onUserOrbit = null;
    this.disposed = false;
    this.paused = false;
    this.exposure = this.motion ? 0 : 1;
    this.turntable = false;
    this.rot = 0;
    this.rotTarget = 0;
    this.section = 'hero';
    this.currentView = 'hero';
    this.exploreActive = false;
    this.mobile = window.innerWidth < 760;
    this.s = {
      dark: { c: 1, t: 1, k: 3 },
      envMix: { c: 0, t: 0, k: 2.6 },
      sun: { c: 11, t: 11, k: 2.4 },
      explode: { c: 0, t: 0, k: 3.2 },
      shiftX: { c: 0, t: 0, k: 2.6 },
      shiftY: { c: 0, t: 0, k: 2.6 },
      indicator: { c: 0, t: 0, k: 1.1 },
    };
    this._v = new THREE.Vector3();
    this._c1 = new THREE.Color();
    this._c2 = new THREE.Color();
    this._bg = new THREE.Color();
  }

  async init() {
    const canvas = this.canvas;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = this.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE.ink);
    scene.fog = new THREE.Fog(PALETTE.ink.clone(), 14, 46);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 220);
    this.camera = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.045; // weighty
    controls.rotateSpeed = 0.55;
    controls.enablePan = false;
    controls.enableZoom = false; // keeps page scroll working over the canvas
    controls.minDistance = 0.8;
    controls.maxDistance = 18;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.enabled = false;
    controls.addEventListener('start', () => {
      this.camTween?.kill();
      this.onUserOrbit?.();
    });
    this.controls = controls;
    this.setInteractive(false);

    // Lighting: built in RoomEnvironment through PMREM, or /public/hdr/studio.hdr if present
    this.pmrem = new THREE.PMREMGenerator(renderer);
    let envTex = null;
    if (assets.hdr) {
      try {
        const hdr = await new RGBELoader().loadAsync('/hdr/studio.hdr');
        envTex = this.pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
      } catch (err) {
        console.warn('AMCE: studio.hdr could not be loaded, using RoomEnvironment.', err);
      }
    }
    if (!envTex) {
      const room = new RoomEnvironment();
      envTex = this.pmrem.fromScene(room, 0.04).texture;
      room.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.envTex = envTex;
    scene.environment = envTex;
    scene.environmentIntensity = 0.7;

    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.castShadow = true;
    const maxTex = renderer.capabilities.maxTextureSize;
    const shadowSize = Math.min(this.mobile ? 2048 : 4096, maxTex);
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    const sc = sun.shadow.camera;
    sc.left = -5;
    sc.right = 5;
    sc.top = 5;
    sc.bottom = -5;
    sc.near = 0.5;
    sc.far = 40;
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.025;
    sun.target.position.set(0, 0.6, 0);
    scene.add(sun, sun.target);
    this.sun = sun;

    const fill = new THREE.DirectionalLight(0xfff8f0, 0.5);
    fill.position.set(-6, 3.5, 5);
    scene.add(fill);
    this.fill = fill;

    this.env = createEnvironments();
    scene.add(this.env.studio, this.env.terrace, this.env.sky);

    this.chair = await createChair({ useGlb: assets.glb });
    if (this.disposed) return;
    scene.add(this.chair.root);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);

    this.goTo('hero', 0);
    this.setSection('hero');
    this.applyScene(1);

    this.clock = new THREE.Clock();
    const tick = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(tick);
      this.frame();
    };
    tick();
  }

  // ---------- public API ----------

  fadeIn() {
    if (!this.motion) {
      this.exposure = 1;
      return;
    }
    this.fadeTween = gsap.to(this, { exposure: 1, duration: 2.8, ease: 'power2.out' });
  }

  set(key, value) {
    const s = this.s[key];
    if (!s) return;
    s.t = value;
    if (!this.motion) s.c = value;
  }

  setTurntable(on) {
    this.turntable = on && this.motion;
    if (!this.turntable) {
      this.rotTarget = Math.round(this.rot / (Math.PI * 2)) * Math.PI * 2;
    }
  }

  setSection(name) {
    this.section = name;
    const l = LAYOUT[name];
    if (!l) return;
    const [x, y] = this.mobile ? l.mobile : l.desktop;
    this.set('shiftX', x);
    this.set('shiftY', y);
  }

  setFinish(name) {
    this.chair?.setFinish(name, this.motion ? 0.9 : 0);
  }

  setExplore(active, { coarse = false } = {}) {
    this.exploreActive = active;
    this.controls.enabled = active;
    this.setInteractive(active && !coarse);
  }

  // Canvas only takes pointer input while orbiting is allowed, so page scroll keeps working.
  setInteractive(on) {
    this.interactive = on;
    this.canvas.style.pointerEvents = on ? 'auto' : 'none';
    this.canvas.style.touchAction = on ? 'none' : 'pan-y';
    this.canvas.style.cursor = on ? 'grab' : 'default';
  }

  viewScale() {
    const aspect = this.width / this.height;
    if (aspect >= 1.25) return 1;
    return THREE.MathUtils.clamp((1.25 / aspect) * 0.78, 1, 2.05);
  }

  resolveView(name) {
    const v = VIEWS[name] || VIEWS.overview;
    const target = new THREE.Vector3(...v.target);
    const pos = new THREE.Vector3(...v.pos).sub(target).multiplyScalar(this.viewScale()).add(target);
    return { pos, target };
  }

  // Glides around the chair on a spherical path so the camera never cuts through it.
  goTo(name, duration = 1.1) {
    this.currentView = name;
    const { pos, target } = this.resolveView(name);
    this.camTween?.kill();
    const cam = this.camera;
    const ctl = this.controls;
    if (!this.motion || duration <= 0 || !this.clock) {
      cam.position.copy(pos);
      ctl.target.copy(target);
      ctl.update();
      return;
    }
    const t0 = ctl.target.clone();
    const s0 = new THREE.Spherical().setFromVector3(cam.position.clone().sub(t0));
    const s1 = new THREE.Spherical().setFromVector3(pos.clone().sub(target));
    let dTheta = s1.theta - s0.theta;
    if (dTheta > Math.PI) dTheta -= Math.PI * 2;
    if (dTheta < -Math.PI) dTheta += Math.PI * 2;
    const sph = new THREE.Spherical();
    const p = { k: 0 };
    this.camTween = gsap.to(p, {
      k: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        const k = p.k;
        ctl.target.lerpVectors(t0, target, k);
        sph.set(
          THREE.MathUtils.lerp(s0.radius, s1.radius, k),
          THREE.MathUtils.lerp(s0.phi, s1.phi, k),
          s0.theta + dTheta * k,
        );
        cam.position.setFromSpherical(sph).add(ctl.target);
      },
    });
  }

  projectAnchor(id, out) {
    const a = this.chair?.anchors[id];
    if (!a) return null;
    this._v.setFromMatrixPosition(a.matrixWorld).project(this.camera);
    out.x = (this._v.x * 0.5 + 0.5) * this.width;
    out.y = (-this._v.y * 0.5 + 0.5) * this.height;
    out.visible = this._v.z < 1;
    return out;
  }

  // ---------- internals ----------

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (!w || !h) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const wasMobile = this.mobile;
    this.mobile = w < 760;
    if (wasMobile !== this.mobile) this.setSection(this.section);
    if (!this.exploreActive && !this.camTween?.isActive()) this.goTo(this.currentView, 0);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    for (const s of Object.values(this.s)) {
      if (!this.motion) {
        s.c = s.t;
      } else {
        s.c += (s.t - s.c) * (1 - Math.exp(-dt * s.k));
      }
    }
    if (this.turntable) {
      this.rot += dt * 0.22;
    } else if (this.motion) {
      this.rot += (this.rotTarget - this.rot) * (1 - Math.exp(-dt * 2.2));
    } else {
      this.rot = this.rotTarget;
    }
    this.applyScene(dt);
    this.controls.update();
    if (!this.paused) this.renderer.render(this.scene, this.camera);
    this.onFrame?.(this);
  }

  applyScene() {
    const { s, scene, env, sun, fill, renderer, camera } = this;
    const m = s.envMix.c;
    const d = s.dark.c;
    const hours = s.sun.c;

    env.setMix(m);
    const studioBg = this._c1;
    env.setDark(d, studioBg);

    // Sun path
    const el = sunElevation(hours);
    const k = THREE.MathUtils.clamp((hours - SUNRISE) / (SUNSET - SUNRISE), 0, 1);
    const az = THREE.MathUtils.degToRad(100 - 200 * k);
    const dist = 16;
    sun.position.set(
      Math.cos(el) * Math.sin(az) * dist,
      Math.max(Math.sin(el) * dist, 0.35),
      Math.cos(el) * Math.cos(az) * dist,
    ).add(sun.target.position);

    const elDeg = THREE.MathUtils.radToDeg(el);
    const day = smooth(0, 22, elDeg);
    const warm = 1 - smooth(6, 38, elDeg);
    const sunCol = this._c2.lerpColors(SUN.noon, SUN.gold, warm);
    if (elDeg < 8) sunCol.lerp(SUN.dusk, 1 - elDeg / 8);
    const keyCol = new THREE.Color().lerpColors(SUN.studio, sunCol, 0.35 + 0.65 * m);
    sun.color.copy(keyCol);
    const studioI = 2.5 * (0.75 + 0.25 * day);
    const terraceI = 2.5 * day + 0.1;
    sun.intensity = THREE.MathUtils.lerp(studioI, terraceI, m);
    fill.intensity = (1 - m) * 0.5 * (1 - 0.7 * d);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.78, 0.2 + 0.4 * day, m) * (1 - 0.72 * d);

    // Sky colours through the day
    const top = new THREE.Color();
    const hor = new THREE.Color();
    if (elDeg > 20) {
      const t = smooth(20, 45, elDeg);
      top.lerpColors(SKY.gold.top, SKY.day.top, t);
      hor.lerpColors(SKY.gold.horizon, SKY.day.horizon, t);
    } else {
      const t = smooth(0, 20, elDeg);
      top.lerpColors(SKY.dusk.top, SKY.gold.top, t);
      hor.lerpColors(SKY.dusk.horizon, SKY.gold.horizon, t);
    }
    env.skyUniforms.topColor.value.copy(top);
    env.skyUniforms.horizonColor.value.copy(hor);
    env.skyUniforms.groundColor.value.copy(hor).multiplyScalar(0.82);

    this._bg.lerpColors(studioBg, hor, m);
    scene.background.copy(this._bg);
    scene.fog.color.copy(this._bg);
    scene.fog.near = THREE.MathUtils.lerp(14, 9, m);
    scene.fog.far = THREE.MathUtils.lerp(46, 30, m);

    renderer.toneMappingExposure = this.exposure * (1 - 0.08 * m + 0.3 * m * (1 - day));

    // Charging indicator softly turns on at dusk
    s.indicator.t = elDeg < 14 ? 1 : 0;
    this.chair.setIndicator(s.indicator.c);
    this.chair.setExplode(easeInOut(THREE.MathUtils.clamp(s.explode.c, 0, 1)));
    this.chair.root.rotation.y = this.rot;

    const w = this.width;
    const h = this.height;
    camera.setViewOffset(w, h, -s.shiftX.c * w, s.shiftY.c * h, w, h);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.camTween?.kill();
    this.fadeTween?.kill();
    if (!this.renderer) return;
    this.controls?.dispose();
    this.chair?.dispose();
    const textures = new Set();
    this.scene?.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const mat of mats) {
        for (const key of Object.keys(mat)) {
          const v = mat[key];
          if (v && v.isTexture) textures.add(v);
        }
        mat.dispose();
      }
    });
    textures.forEach((t) => t.dispose());
    this.envTex?.dispose();
    this.pmrem?.dispose();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
  }
}

export { CHAIR_CONFIG };
