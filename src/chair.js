/**
 * AMCE chair
 *
 * PLACEHOLDER - NOT FINAL DESIGN
 * The procedural model below is a temporary stand in built from a reference photo
 * for testing only. Proportions and placement follow that photo. Materials follow the
 * AMCE brief. No logos or branding from the photo are reproduced.
 *
 * To use the real model drop it at /public/models/amce-chair.glb and restart the dev
 * server. It is loaded with GLTFLoader (DRACO and meshopt ready), auto fitted and centred.
 *
 * Every dimension, hotspot anchor, explode offset and finish lives in CHAIR_CONFIG.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {
  weaveTextures,
  woodTexture,
  stoneTexture,
  brushedTexture,
  solarTexture,
  contactShadowTexture,
} from './textures.js';

export const CHAIR_CONFIG = {
  modelUrl: '/models/amce-chair.glb',
  dracoPath: '/draco/',
  // A loaded GLB is scaled so its height equals this value in metres.
  fitHeight: 2.07,

  // All values in metres. x runs along the seat, y is up, z points to the front.
  dims: {
    seatStartX: -0.95,
    seatLength: 1.5,
    seatDepth: 0.58,
    panTop: 0.37,
    panThk: 0.05,
    cushionThk: 0.09,
    endPanelThk: 0.08,
    footLength: 0.42,
    footThk: 0.035,
    backBottom: 0.48,
    backHeight: 0.46,
    backThk: 0.085,
    backTilt: 0.2, // radians, leaning back
    pillarW: 0.42,
    pillarH: 2.0,
    canopyLen: 1.98,
    canopyDepth: 0.9,
    canopyThk: 0.07,
    canopyForward: 0.08,
    armLen: 0.26,
    armDepth: 0.44,
    armThk: 0.045,
    armHeight: 0.66,
    padRadius: 0.055,
  },

  // Hotspot anchors in metres in centred chair space:
  // origin is on the floor under the centre of the chair bounding box.
  // These are also used for a loaded GLB, so adjust them to match the real model.
  anchors: {
    solar: { position: [0.0, 2.075, 0.0], part: 'canopy', dir: [-0.7, -1] },
    wireless: { position: [0.44, 0.685, -0.04], part: 'pillar', dir: [-1, -0.7] },
    usb: { position: [0.78, 0.6, 0.214], part: 'pillar', dir: [1, -0.35] },
    battery: { position: [0.78, 0.27, 0.214], part: 'pillar', dir: [1, 0.45] },
  },

  // How far each part travels in the anatomy section (procedural model only).
  explode: {
    base: [-0.35, 0, 0],
    seatCushion: [0, 0.42, 0.18],
    backCushion: [-0.05, 0.62, -0.55],
    pillar: [0.6, 0, 0.05],
    canopy: [0.15, 0.95, 0],
  },

  finishes: {
    bronze: {
      label: 'Brushed Bronze & Warm Sand Bouclé',
      frame: { color: '#8A7254', metalness: 0.88, roughness: 0.4 },
      cushion: '#CDBB9F',
      arm: 'timber',
      swatch: ['#8A7254', '#CDBB9F'],
    },
    charcoal: {
      label: 'Anodized Charcoal & Slate Weave',
      frame: { color: '#2F302E', metalness: 0.72, roughness: 0.48 },
      cushion: '#5D635B',
      arm: 'stone',
      swatch: ['#2F302E', '#5D635B'],
    },
  },
  defaultFinish: 'bronze',
};

const D = CHAIR_CONFIG.dims;

function rbox(w, h, d, r, seg = 3) {
  const radius = Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005);
  return new RoundedBoxGeometry(w, h, d, seg, Math.max(radius, 0.0005));
}

function addMesh(parent, geometry, material, x, y, z, shadows = true) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = shadows;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function createMaterials() {
  const weave = weaveTextures();
  const tex = {
    weave,
    wood: woodTexture(),
    stone: stoneTexture(),
    brushed: brushedTexture(),
    solar: solarTexture(),
  };
  const mats = {
    frame: new THREE.MeshPhysicalMaterial({
      name: 'frame',
      color: '#8A7254',
      metalness: 0.88,
      roughness: 0.4,
      roughnessMap: tex.brushed,
      anisotropy: 0.3,
    }),
    cushion: new THREE.MeshStandardMaterial({
      name: 'cushion',
      color: '#CDBB9F',
      map: weave.map,
      bumpMap: weave.bump,
      bumpScale: 0.9,
      roughness: 0.86,
      metalness: 0,
    }),
    arm: new THREE.MeshStandardMaterial({ name: 'arm', map: tex.wood, roughness: 0.62 }),
    brass: new THREE.MeshPhysicalMaterial({ name: 'brass', color: '#B08D57', metalness: 1, roughness: 0.3 }),
    solar: new THREE.MeshPhysicalMaterial({
      name: 'solar',
      map: tex.solar,
      roughness: 0.42,
      metalness: 0.1,
      clearcoat: 0.25,
      clearcoatRoughness: 0.6,
    }),
    silicon: new THREE.MeshStandardMaterial({ name: 'inset', color: '#14181E', roughness: 0.62, metalness: 0.2 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'rubber', color: '#171717', roughness: 0.8 }),
    port: new THREE.MeshStandardMaterial({ name: 'port', color: '#060606', roughness: 0.5 }),
    groove: new THREE.MeshStandardMaterial({ name: 'groove', color: '#0e0e0d', roughness: 0.9 }),
    indicator: new THREE.MeshStandardMaterial({
      name: 'indicator',
      color: '#3a3833',
      emissive: '#F4E6C8',
      emissiveIntensity: 0,
      roughness: 0.4,
    }),
  };
  return { tex, mats };
}

function buildProcedural() {
  const { tex, mats } = createMaterials();
  const root = new THREE.Group();
  root.name = 'AMCE_Chair_Procedural';
  const inner = new THREE.Group();
  root.add(inner);

  const parts = {};
  for (const name of Object.keys(CHAIR_CONFIG.explode)) {
    const g = new THREE.Group();
    g.name = name;
    inner.add(g);
    parts[name] = g;
  }

  const x0 = D.seatStartX;
  const x1 = x0 + D.seatLength; // pillar inner face
  const seatCx = (x0 + x1) / 2;
  const pillarCx = x1 + D.pillarW / 2;
  const pillarOuter = x1 + D.pillarW;
  const zFront = D.seatDepth / 2;

  // Base: end panel, foot plate, seat pan and backrest brackets
  addMesh(parts.base, rbox(D.endPanelThk, D.panTop - D.panThk, D.seatDepth, 0.012), mats.frame,
    x0 + D.endPanelThk / 2, (D.panTop - D.panThk) / 2, 0);
  addMesh(parts.base, rbox(D.footLength, D.footThk, D.seatDepth, 0.01), mats.frame,
    x0 + D.footLength / 2, D.footThk / 2, 0);
  addMesh(parts.base, rbox(D.seatLength, D.panThk, D.seatDepth, 0.014), mats.frame,
    seatCx, D.panTop - D.panThk / 2, 0);

  const backPivotY = D.panTop + 0.03;
  const backPivotZ = -zFront + 0.05;
  const bracketPivot = new THREE.Group();
  bracketPivot.position.set(seatCx, backPivotY, backPivotZ);
  bracketPivot.rotation.x = -D.backTilt;
  parts.base.add(bracketPivot);
  for (const bx of [-0.45, 0.4]) {
    addMesh(bracketPivot, rbox(0.045, 0.5, 0.025, 0.006), mats.frame, bx, 0.2, -D.backThk / 2 - 0.012);
  }

  // Seat cushion
  addMesh(parts.seatCushion, rbox(D.seatLength - 0.04, D.cushionThk, D.seatDepth - 0.02, 0.036, 4),
    mats.cushion, seatCx, D.panTop + D.cushionThk / 2, 0.005);

  // Back cushion
  const backPivot = new THREE.Group();
  backPivot.position.set(seatCx, backPivotY, backPivotZ);
  backPivot.rotation.x = -D.backTilt;
  parts.backCushion.add(backPivot);
  addMesh(backPivot, rbox(D.seatLength - 0.06, D.backHeight, D.backThk, 0.034, 4), mats.cushion,
    0, D.backBottom - backPivotY + D.backHeight / 2, 0);

  // Pillar with armrest, charging pad, indicator, USB port and battery hatch
  addMesh(parts.pillar, rbox(D.pillarW, D.pillarH, D.seatDepth, 0.018), mats.frame,
    pillarCx, D.pillarH / 2, 0);
  addMesh(parts.pillar, rbox(0.006, 1.1, D.seatDepth - 0.12, 0.002), mats.silicon,
    pillarOuter + 0.002, 1.3, 0);

  const armCx = x1 - D.armLen / 2 + 0.01;
  const armZ = 0.03;
  addMesh(parts.pillar, rbox(D.armLen, D.armThk, D.armDepth, 0.012), mats.arm, armCx, D.armHeight, armZ);
  const armTop = D.armHeight + D.armThk / 2;
  const padX = x1 - 0.12;
  const pad = addMesh(parts.pillar, new THREE.CylinderGeometry(D.padRadius, D.padRadius, 0.004, 48),
    mats.brass, padX, armTop - 0.0012, 0.04, false);
  pad.name = 'wireless_pad';
  const ind = addMesh(parts.pillar, new THREE.CylinderGeometry(0.0055, 0.0055, 0.003, 20),
    mats.indicator, padX, armTop + 0.0002, armZ + D.armDepth / 2 - 0.035, false);
  ind.name = 'charging_indicator';

  const faceZ = zFront;
  addMesh(parts.pillar, rbox(0.06, 0.036, 0.004, 0.006), mats.rubber, pillarCx, 0.6, faceZ + 0.001, false);
  addMesh(parts.pillar, rbox(0.03, 0.011, 0.004, 0.003), mats.port, pillarCx, 0.6, faceZ + 0.0025, false);
  // Battery service hatch: a hairline groove outline on the pillar face
  const hw = 0.3;
  const hh = 0.34;
  const gw = 0.0025;
  const hy = 0.27;
  const grooveZ = faceZ + 0.0004;
  const grooveH = new THREE.BoxGeometry(hw, gw, 0.001);
  const grooveV = new THREE.BoxGeometry(gw, hh, 0.001);
  addMesh(parts.pillar, grooveH, mats.groove, pillarCx, hy + hh / 2, grooveZ, false);
  addMesh(parts.pillar, grooveH, mats.groove, pillarCx, hy - hh / 2, grooveZ, false);
  addMesh(parts.pillar, grooveV, mats.groove, pillarCx - hw / 2, hy, grooveZ, false);
  addMesh(parts.pillar, grooveV, mats.groove, pillarCx + hw / 2, hy, grooveZ, false);

  // Canopy with flush solar inlay
  const canopyCx = pillarOuter - D.canopyLen / 2;
  const canopyY = D.pillarH + D.canopyThk / 2;
  addMesh(parts.canopy, rbox(D.canopyLen, D.canopyThk, D.canopyDepth, 0.016), mats.frame,
    canopyCx, canopyY, D.canopyForward);
  addMesh(parts.canopy, rbox(D.canopyLen - 0.08, 0.006, D.canopyDepth - 0.08, 0.002), mats.solar,
    canopyCx, D.pillarH + D.canopyThk + 0.0015, D.canopyForward, false);

  // Centre on the bounding box with the base on the floor
  const box = new THREE.Box3().setFromObject(inner);
  const c = box.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -box.min.y, -c.z);

  // Anchors follow their part when the chair is exploded
  const anchors = {};
  for (const [id, a] of Object.entries(CHAIR_CONFIG.anchors)) {
    const o = new THREE.Object3D();
    o.name = `anchor_${id}`;
    o.position.set(a.position[0] + c.x, a.position[1] + box.min.y, a.position[2] + c.z);
    (parts[a.part] || inner).add(o);
    anchors[id] = o;
  }

  addContactShadow(root, box);

  const explodeVecs = Object.fromEntries(
    Object.entries(CHAIR_CONFIG.explode).map(([k, v]) => [k, new THREE.Vector3(...v)]),
  );

  let finishTween = null;
  function setFinish(name, duration = 0.9) {
    const f = CHAIR_CONFIG.finishes[name];
    if (!f) return;
    finishTween?.kill();
    const fromFrame = mats.frame.color.clone();
    const toFrame = new THREE.Color(f.frame.color);
    const fromCushion = mats.cushion.color.clone();
    const toCushion = new THREE.Color(f.cushion);
    const fromM = mats.frame.metalness;
    const fromR = mats.frame.roughness;
    const armMap = f.arm === 'stone' ? tex.stone : tex.wood;
    const armRough = f.arm === 'stone' ? 0.74 : 0.62;
    const p = { k: 0 };
    const apply = () => {
      mats.frame.color.lerpColors(fromFrame, toFrame, p.k);
      mats.cushion.color.lerpColors(fromCushion, toCushion, p.k);
      mats.frame.metalness = THREE.MathUtils.lerp(fromM, f.frame.metalness, p.k);
      mats.frame.roughness = THREE.MathUtils.lerp(fromR, f.frame.roughness, p.k);
      if (p.k >= 0.5 && mats.arm.map !== armMap) {
        mats.arm.map = armMap;
        mats.arm.roughness = armRough;
        mats.arm.color.set(f.arm === 'stone' ? '#6c6d68' : '#ffffff');
        mats.arm.needsUpdate = true;
      }
    };
    if (duration <= 0) {
      p.k = 1;
      apply();
      return;
    }
    finishTween = gsap.to(p, { k: 1, duration, ease: 'power2.inOut', onUpdate: apply });
  }

  function setExplode(k) {
    for (const [name, g] of Object.entries(parts)) {
      g.position.copy(explodeVecs[name]).multiplyScalar(k);
    }
  }

  function setIndicator(k) {
    mats.indicator.emissiveIntensity = k * 2.2;
  }

  setFinish(CHAIR_CONFIG.defaultFinish, 0);

  return {
    root,
    anchors,
    procedural: true,
    setFinish,
    setExplode,
    setIndicator,
    dispose() {
      finishTween?.kill();
      // Textures not currently attached to a material
      tex.wood.dispose();
      tex.stone.dispose();
    },
  };
}

function addContactShadow(root, box) {
  const size = box.getSize(new THREE.Vector3());
  const mat = new THREE.MeshBasicMaterial({
    map: contactShadowTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    opacity: 0.85,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.scale.set(size.x * 1.25, size.z * 1.5, 1);
  plane.position.y = 0.003;
  plane.renderOrder = 2;
  plane.name = 'contact_shadow';
  root.add(plane);
}

async function loadGlb() {
  const draco = new DRACOLoader().setDecoderPath(CHAIR_CONFIG.dracoPath);
  const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
  try {
    const gltf = await loader.loadAsync(CHAIR_CONFIG.modelUrl);
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    // Auto fit and centre by bounding box
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = size.y > 0 ? CHAIR_CONFIG.fitHeight / size.y : 1;
    model.scale.multiplyScalar(scale);
    box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.x -= c.x;
    model.position.z -= c.z;
    model.position.y -= box.min.y;

    const root = new THREE.Group();
    root.name = 'AMCE_Chair_GLB';
    root.add(model);
    const fitted = new THREE.Box3().setFromObject(root);
    addContactShadow(root, fitted);

    const anchors = {};
    for (const [id, a] of Object.entries(CHAIR_CONFIG.anchors)) {
      const o = new THREE.Object3D();
      o.position.fromArray(a.position);
      root.add(o);
      anchors[id] = o;
    }

    // Finishes apply to GLB materials named "frame" and "cushion" if present.
    const named = {};
    model.traverse((o) => {
      if (o.isMesh && o.material && o.material.name) named[o.material.name.toLowerCase()] = o.material;
    });
    let indicator = named.indicator || null;

    return {
      root,
      anchors,
      procedural: false,
      setFinish(name) {
        const f = CHAIR_CONFIG.finishes[name];
        if (!f) return;
        if (named.frame?.color) named.frame.color.set(f.frame.color);
        if (named.cushion?.color) named.cushion.color.set(f.cushion);
      },
      setExplode() {},
      setIndicator(k) {
        if (indicator && 'emissiveIntensity' in indicator) indicator.emissiveIntensity = k * 2.2;
      },
      dispose() {},
    };
  } finally {
    draco.dispose();
  }
}

export async function createChair({ useGlb }) {
  if (useGlb) {
    try {
      return await loadGlb();
    } catch (err) {
      console.warn('AMCE: could not load the GLB model, using the procedural placeholder.', err);
    }
  }
  return buildProcedural();
}
