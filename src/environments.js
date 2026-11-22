// Two environments that crossfade: Studio Plain and Hotel Terrace.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { travertineTexture } from './textures.js';

export const PALETTE = {
  travertine: new THREE.Color('#F3EFE6'),
  limestone: new THREE.Color('#E6E0D4'),
  ink: new THREE.Color('#1A1917'),
  alabaster: new THREE.Color('#ECE6DB'),
};

// Floor that curves up into a back wall.
function cycloramaGeometry({ width = 180, front = 80, back = -5, radius = 4, height = 40 } = {}) {
  const profile = [];
  const flatSteps = 40;
  for (let i = 0; i <= flatSteps; i++) {
    profile.push([0, front + (back - front) * (i / flatSteps)]);
  }
  const arcSteps = 24;
  for (let i = 1; i <= arcSteps; i++) {
    const a = (i / arcSteps) * (Math.PI / 2);
    profile.push([radius - Math.cos(a) * radius, back - Math.sin(a) * radius]);
  }
  profile.push([height, back - radius]);

  const positions = [];
  const indices = [];
  profile.forEach(([y, z]) => {
    positions.push(-width / 2, y, z, width / 2, y, z);
  });
  for (let i = 0; i < profile.length - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
  }
`;
const skyFragment = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 groundColor;
  uniform float opacity;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 c = h > 0.0 ? mix(horizonColor, topColor, pow(h, 0.55)) : mix(horizonColor, groundColor, pow(-h, 0.35));
    gl_FragColor = vec4(c, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createEnvironments() {
  // Studio Plain
  const studio = new THREE.Group();
  studio.name = 'Studio_Plain';
  const studioMat = new THREE.MeshStandardMaterial({
    color: PALETTE.alabaster.clone(),
    roughness: 0.96,
    metalness: 0,
    transparent: true,
  });
  const cyc = new THREE.Mesh(cycloramaGeometry(), studioMat);
  cyc.receiveShadow = true;
  studio.add(cyc);

  // Hotel Terrace
  const terrace = new THREE.Group();
  terrace.name = 'Hotel_Terrace';
  const floorTex = travertineTexture([16 / 2.4, 18 / 2.4], 21);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.82, transparent: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.001, 3);
  floor.receiveShadow = true;
  terrace.add(floor);

  const wallTex = travertineTexture([5, 0.3], 44);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, transparent: true });
  const capMat = new THREE.MeshStandardMaterial({ color: '#E9E1D3', roughness: 0.7, transparent: true });

  const walls = [
    { size: [16, 0.5, 0.32], pos: [0, 0.25, -6] },
    { size: [0.32, 0.5, 18], pos: [-8, 0.25, 3] },
  ];
  for (const w of walls) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(...w.size, 2, 0.02), wallMat);
    m.position.set(...w.pos);
    m.castShadow = true;
    m.receiveShadow = true;
    terrace.add(m);
    const cap = new THREE.Mesh(
      new RoundedBoxGeometry(w.size[0] + 0.08, 0.05, w.size[2] + 0.08, 2, 0.012),
      capMat,
    );
    cap.position.set(w.pos[0], 0.525, w.pos[2]);
    cap.castShadow = true;
    cap.receiveShadow = true;
    terrace.add(cap);
  }
  // Two low stone benches as quiet terrace furniture
  for (const x of [-5.2, 5.4]) {
    const block = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.42, 0.5, 2, 0.02), wallMat);
    block.position.set(x, 0.21, -4.6);
    block.castShadow = true;
    block.receiveShadow = true;
    terrace.add(block);
  }

  // Sky dome
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    uniforms: {
      topColor: { value: new THREE.Color('#AFC0CC') },
      horizonColor: { value: new THREE.Color('#E9E4DA') },
      groundColor: { value: new THREE.Color('#CFC7B8') },
      opacity: { value: 0 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), skyMat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;

  const studioMats = [studioMat];
  const terraceMats = [floorMat, wallMat, capMat];

  const dark = PALETTE.ink;
  return {
    studio,
    terrace,
    sky,
    skyUniforms: skyMat.uniforms,
    setMix(m) {
      const s = 1 - m;
      studio.visible = s > 0.001;
      terrace.visible = m > 0.001;
      sky.visible = m > 0.001;
      studioMats.forEach((mat) => (mat.opacity = s));
      terraceMats.forEach((mat) => (mat.opacity = m));
      skyMat.uniforms.opacity.value = m;
    },
    setDark(d, out) {
      studioMat.color.lerpColors(PALETTE.alabaster, dark, d);
      if (out) out.copy(studioMat.color);
    },
  };
}
