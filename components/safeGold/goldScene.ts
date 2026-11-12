import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GOLD, type GoldFrame, type ScreenPoint } from './goldData';

// The SafeGold scene: a gold piggy bank, 24K coins, a gold bar and its delivery box. It holds no
// timing of its own. Every frame it is handed the story's numbers (GoldFrame) and poses
// everything from them, so the scroll can play it forwards or backwards.

const COIN_RADIUS = 0.3;
const COIN_THICKNESS = 0.055;
const ORBIT_COINS = 6;
// How far the piggy bank and its orbiting coins reach from its centre, in world units at scale 1
// (side: orbit radius plus a coin, with a little perspective; up: a coin arcing over the slot;
// down: the legs and the bob)
const EXTENT = { side: 2.6, up: 1.75, down: 1.45 };
const PARTICLES = 520;
// Where the slot sits on the piggy bank, in its own space
const SLOT = new THREE.Vector3(-0.05, 1.04, 0);

// A short, sturdy leg with a rounded foot, turned on a lathe
const LEG_PROFILE = [
  [0, -0.24],
  [0.17, -0.24],
  [0.22, -0.225],
  [0.245, -0.19],
  [0.25, -0.13],
  [0.225, 0.22],
  [0, 0.22],
].map(([r, h]) => new THREE.Vector2(r, h));

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

// Height maps: lighter is raised. They give the coin its embossed face and milled edge, and the
// bar its stamp, without any extra geometry.
function coinFaceBump() {
  return canvasTexture(512, 512, (ctx) => {
    const c = 256;
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(0, 0, 512, 512);
    const ring = (r: number, w: number, shade: string) => {
      ctx.strokeStyle = shade;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.stroke();
    };
    ring(238, 26, '#d8d8d8'); // raised rim
    ring(206, 4, '#a0a0a0');
    // Beaded border
    ctx.fillStyle = '#c4c4c4';
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * 190, c + Math.sin(a) * 190, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e6e6e6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 150px Georgia, "Times New Roman", serif';
    ctx.fillText('24K', c, c - 10);
    ctx.font = '600 44px Georgia, "Times New Roman", serif';
    ctx.fillText('999.9', c, c + 100);
    ctx.font = '600 30px Georgia, serif';
    ctx.fillText('FINE GOLD', c, c - 110);
  });
}

function coinEdgeBump() {
  const texture = canvasTexture(512, 8, (ctx) => {
    for (let x = 0; x < 512; x += 4) {
      ctx.fillStyle = x % 8 === 0 ? '#dcdcdc' : '#505050';
      ctx.fillRect(x, 0, 4, 8);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function barBump() {
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 70, 432, 372);
    ctx.strokeStyle = '#9a9a9a';
    ctx.lineWidth = 3;
    ctx.strokeRect(62, 92, 388, 328);
    ctx.fillStyle = '#e4e4e4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 46px Georgia, "Times New Roman", serif';
    ctx.fillText('FINE GOLD', 256, 160);
    ctx.font = '800 112px Georgia, "Times New Roman", serif';
    ctx.fillText('999.9', 256, 262);
    ctx.font = '600 40px Georgia, "Times New Roman", serif';
    ctx.fillText('24K  ·  10 g', 256, 362);
  });
}

function softDot(inner: string, outer: string) {
  return canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
}

// Points that make up a ₹, for the sale's particles to settle into
function rupeePoints(count: number) {
  const size = 160;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 140px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('₹', size / 2, size / 2 + 6);
  const data = ctx.getImageData(0, 0, size, size).data;
  const filled: [number, number][] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * 4 + 3] > 140) filled.push([x / size - 0.5, 0.5 - y / size]);
    }
  }
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    if (filled.length) {
      const [x, y] = filled[Math.floor(Math.random() * filled.length)];
      points.push(new THREE.Vector3(x, y, 0));
    } else {
      const a = (i / count) * Math.PI * 2; // no glyph available: a ring will do
      points.push(new THREE.Vector3(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0));
    }
  }
  return points;
}

// A dark studio with a few softboxes. Polished gold looks like gold because of what it reflects:
// deep shadows with bright, clean highlights, rather than an evenly lit room.
function studioEnvironment() {
  const scene = new THREE.Scene();
  const disposables: { dispose: () => void }[] = [];
  const roomGeometry = new THREE.BoxGeometry(24, 24, 24);
  const roomMaterial = new THREE.MeshBasicMaterial({ color: '#060504', side: THREE.BackSide });
  scene.add(new THREE.Mesh(roomGeometry, roomMaterial));
  disposables.push(roomGeometry, roomMaterial);
  const panel = (w: number, h: number, intensity: number, tint: string, x: number, y: number, z: number) => {
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(geometry, material);
  };
  panel(10, 6, 3.2, '#fff6e6', 0, 10, 2); // overhead softbox
  panel(2.2, 12, 7, '#fff3df', -10, 1, 3); // tall strip, left
  panel(1.6, 10, 4.5, '#ffeccc', 10, 0, -2); // strip, right
  panel(7, 2.5, 2.2, '#fff8ee', 0, 2, 10); // low front fill
  panel(8, 3, 2.6, '#ffe2a8', 2, 3, -10); // warm back rim
  panel(14, 4, 0.35, '#8c6b20', 0, -10, 0); // faint warm floor bounce
  return { scene, dispose: () => disposables.forEach((d) => d.dispose()) };
}

function ringTexture() {
  return canvasTexture(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,233,163,0)');
    g.addColorStop(0.72, 'rgba(255,233,163,0)');
    g.addColorStop(0.86, 'rgba(255,233,163,1)');
    g.addColorStop(1, 'rgba(255,233,163,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
}

interface Coin {
  group: THREE.Group;
  materials: THREE.MeshPhysicalMaterial[];
}

export class GoldScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private width = 1;
  private height = 1;
  private disposables: { dispose: () => void }[] = [];

  private pig = new THREE.Group();
  private pigBody = new THREE.Group();
  private pigGold: THREE.MeshPhysicalMaterial;
  private pigShadow: THREE.Mesh;
  private ripple: THREE.Mesh;
  private emergeCoin: Coin;
  private withdrawCoin: Coin;
  private sellCoin: Coin;
  private orbitCoins: Coin[] = [];
  private bar = new THREE.Group();
  private barMaterials: THREE.MeshPhysicalMaterial[] = [];
  private box = new THREE.Group();
  private boxLid = new THREE.Group();
  private boxMaterials: THREE.Material[] = [];
  private sheen: THREE.PointLight;
  private particles: THREE.Points;
  private particleStart = Array.from({ length: PARTICLES }, () => new THREE.Vector3());
  private particleEnd = rupeePoints(PARTICLES);
  private particleJitter = Array.from({ length: PARTICLES }, () => ({
    delay: Math.random() * 0.3,
    lift: 0.3 + Math.random() * 0.9,
    swirl: (Math.random() - 0.5) * 1.4,
    disc: new THREE.Vector2(Math.random(), Math.random()),
  }));
  private sourceCaptured = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // A studio's reflections, so the metal has something to mirror
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const studio = studioEnvironment();
    const env = pmrem.fromScene(studio.scene, 0.02).texture;
    this.scene.environment = env;
    studio.dispose();
    pmrem.dispose();
    this.disposables.push(env);

    this.scene.add(new THREE.AmbientLight(0xfff3dc, 0.15));
    const key = new THREE.DirectionalLight(0xfff1d6, 2.4);
    key.position.set(-4, 6, 6);
    const rim = new THREE.DirectionalLight(0xffe2a0, 2.2);
    rim.position.set(5, 3, -5);
    const under = new THREE.DirectionalLight(0x8c6b20, 0.6);
    under.position.set(0, -5, 3);
    this.sheen = new THREE.PointLight(0xfff4dc, 0, 0, 1.6);
    this.scene.add(key, rim, under, this.sheen);

    // ---- Materials ----
    this.pigGold = new THREE.MeshPhysicalMaterial({
      color: GOLD.primary,
      metalness: 1,
      roughness: 0.22,
      clearcoat: 0.12,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.25,
    });
    const darkGold = new THREE.MeshStandardMaterial({ color: '#4a3510', metalness: 0.9, roughness: 0.45 });
    const slotDark = new THREE.MeshStandardMaterial({ color: '#0b0803', metalness: 0.4, roughness: 0.8 });
    this.disposables.push(this.pigGold, darkGold, slotDark);

    this.buildPig(darkGold, slotDark);

    // Soft contact shadow under the piggy bank
    const shadowTex = canvasTexture(256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(0,0,0,0.9)');
      g.addColorStop(0.35, 'rgba(40,31,11,0.4)');
      g.addColorStop(0.7, 'rgba(140,107,32,0.04)');
      g.addColorStop(1, 'rgba(140,107,32,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    });
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false });
    this.pigShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), shadowMat);
    this.pigShadow.rotation.x = -Math.PI / 2;
    this.pigShadow.position.y = -1.11;
    this.pig.add(this.pigShadow);
    this.disposables.push(shadowTex, shadowMat, this.pigShadow.geometry);

    // The ring of light that spreads from the slot as a coin goes in
    const rippleTex = ringTexture();
    const rippleMat = new THREE.MeshBasicMaterial({ map: rippleTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
    this.ripple = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), rippleMat);
    this.disposables.push(rippleTex);
    this.ripple.rotation.x = -Math.PI / 2;
    this.ripple.position.copy(SLOT).add(new THREE.Vector3(0, 0.03, 0));
    this.pigBody.add(this.ripple);
    this.disposables.push(rippleMat, this.ripple.geometry);
    this.scene.add(this.pig);

    // ---- Coins ----
    const coinGeometry = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 96, 1);
    const faceBump = coinFaceBump();
    const edgeBump = coinEdgeBump();
    this.disposables.push(coinGeometry, faceBump, edgeBump);
    const makeCoin = (): Coin => {
      const edge = new THREE.MeshPhysicalMaterial({ color: GOLD.primary, metalness: 1, roughness: 0.3, bumpMap: edgeBump, bumpScale: 2.2, transparent: true });
      const face = new THREE.MeshPhysicalMaterial({
        color: GOLD.champagne,
        metalness: 1,
        roughness: 0.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        bumpMap: faceBump,
        bumpScale: 3.5,
        transparent: true,
      });
      this.disposables.push(edge, face);
      const mesh = new THREE.Mesh(coinGeometry, [edge, face, face]);
      mesh.rotation.z = Math.PI / 2; // its faces now look along x, like the slot's opening
      const group = new THREE.Group();
      group.add(mesh);
      group.visible = false;
      this.scene.add(group);
      return { group, materials: [edge, face] };
    };
    this.emergeCoin = makeCoin();
    this.withdrawCoin = makeCoin();
    this.sellCoin = makeCoin();
    for (let i = 0; i < ORBIT_COINS; i++) this.orbitCoins.push(makeCoin());

    this.buildBar();
    this.buildBox();

    // ---- The sale's particles ----
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3));
    const sprite = softDot('rgba(255,233,163,1)', 'rgba(212,175,55,0)');
    const particleMat = new THREE.PointsMaterial({ size: 0.075, map: sprite, color: GOLD.champagne, transparent: true, depthWrite: false, opacity: 0 });
    this.particles = new THREE.Points(particleGeometry, particleMat);
    this.particles.visible = false;
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
    this.disposables.push(particleGeometry, sprite, particleMat);
  }

  // A piggy bank modelled from rounded solids: a slightly pear-shaped body, snout, ears, legs and
  // a curled tail, with a slot on its back.
  private buildPig(darkGold: THREE.Material, slotDark: THREE.Material) {
    const gold = this.pigGold;
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, setup: (m: THREE.Mesh) => void) => {
      const mesh = new THREE.Mesh(geometry, material);
      setup(mesh);
      this.pigBody.add(mesh);
      this.disposables.push(geometry);
      return mesh;
    };

    const bodyGeometry = new THREE.SphereGeometry(1, 96, 64);
    const p = bodyGeometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      // Fuller at the back, a touch flatter underneath, a little narrower towards the head
      const taper = 1 - 0.08 * Math.max(0, x);
      p.setXYZ(i, x * 1.28, (y < 0 ? y * 0.92 : y) * 1.04 * taper, z * 1.0 * taper);
    }
    bodyGeometry.computeVertexNormals();
    add(bodyGeometry, gold, () => undefined);

    // Snout: turned like a lathe, flaring into the body with a rounded rim at the front
    const snoutProfile = [
      [0, 0.37],
      [0.24, 0.37],
      [0.31, 0.358],
      [0.35, 0.33],
      [0.365, 0.29],
      [0.37, 0.12],
      [0.4, -0.02],
      [0.47, -0.16],
    ].map(([r, h]) => new THREE.Vector2(r, h));
    add(new THREE.LatheGeometry(snoutProfile, 72), gold, (m) => {
      m.rotation.z = -Math.PI / 2;
      m.position.set(1.08, 0.02, 0);
    });
    [-0.11, 0.11].forEach((z) =>
      add(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 24), darkGold, (m) => {
        m.rotation.z = Math.PI / 2;
        m.scale.set(1, 1, 1.35);
        m.position.set(1.45, 0.02, z);
      })
    );

    // Eyes: small polished domes
    [-0.36, 0.36].forEach((z) =>
      add(new THREE.SphereGeometry(0.07, 24, 16), darkGold, (m) => {
        m.position.set(1.0, 0.42, z);
      })
    );

    // Ears: soft teardrops, narrowing to a rounded tip and folded slightly forward
    const earGeometry = new THREE.SphereGeometry(0.3, 48, 32);
    const ep = earGeometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < ep.count; i++) {
      const up = Math.max(0, ep.getY(i) / 0.3);
      ep.setX(i, ep.getX(i) * (1 - 0.62 * up * up));
      ep.setZ(i, ep.getZ(i) * (1 - 0.4 * up));
    }
    earGeometry.computeVertexNormals();
    [-1, 1].forEach((side) =>
      add(side < 0 ? earGeometry : earGeometry.clone(), gold, (m) => {
        m.scale.set(0.85, 1.15, 0.22);
        m.position.set(0.66, 0.98, side * 0.5);
        m.rotation.set(side * -0.42, side * 0.35, -0.55);
      })
    );

    // Legs
    [
      [0.62, 0.48],
      [0.62, -0.48],
      [-0.66, 0.48],
      [-0.66, -0.48],
    ].forEach(([x, z]) =>
      add(new THREE.LatheGeometry(LEG_PROFILE, 56), gold, (m) => {
        m.position.set(x, -0.86, z);
      })
    );

    // Curled tail
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.24, 0.12, 0),
      new THREE.Vector3(-1.42, 0.22, 0.04),
      new THREE.Vector3(-1.5, 0.38, -0.06),
      new THREE.Vector3(-1.38, 0.46, -0.1),
      new THREE.Vector3(-1.33, 0.34, 0.02),
      new THREE.Vector3(-1.46, 0.3, 0.08),
    ]);
    add(new THREE.TubeGeometry(curve, 64, 0.045, 16, false), gold, () => undefined);

    // The slot: a raised lip with a dark opening
    add(new RoundedBoxGeometry(0.2, 0.06, 0.82, 4, 0.03), gold, (m) => {
      m.position.copy(SLOT);
    });
    add(new RoundedBoxGeometry(0.075, 0.07, 0.68, 4, 0.03), slotDark, (m) => {
      m.position.copy(SLOT).add(new THREE.Vector3(0, 0.012, 0));
    });

    this.pig.add(this.pigBody);
  }

  private buildBar() {
    const bump = barBump();
    const top = new THREE.MeshPhysicalMaterial({ color: GOLD.champagne, metalness: 1, roughness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.08, bumpMap: bump, bumpScale: 3, transparent: true });
    const sides = new THREE.MeshPhysicalMaterial({ color: GOLD.primary, metalness: 1, roughness: 0.24, clearcoat: 0.4, transparent: true });
    this.barMaterials = [sides, top];
    const geometry = new RoundedBoxGeometry(0.9, 0.2, 0.46, 5, 0.045);
    // Box faces: +x, -x, +y, -y, +z, -z. Only the top carries the stamp.
    const mesh = new THREE.Mesh(geometry, [sides, sides, top, sides, sides, sides]);
    this.bar.add(mesh);
    this.bar.visible = false;
    this.scene.add(this.bar);
    this.disposables.push(bump, top, sides, geometry);
  }

  // A black presentation box with gold bands and a hinged lid
  private buildBox() {
    const black = new THREE.MeshPhysicalMaterial({ color: '#111012', metalness: 0.2, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.35, transparent: true });
    const inside = new THREE.MeshStandardMaterial({ color: '#1d160a', metalness: 0.1, roughness: 0.9, transparent: true });
    const band = new THREE.MeshPhysicalMaterial({ color: GOLD.primary, metalness: 1, roughness: 0.3, transparent: true });
    this.boxMaterials = [black, inside, band];
    this.disposables.push(black, inside, band);
    const W = 1.3;
    const H = 0.5;
    const D = 0.82;
    const t = 0.04;
    const part = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D) => {
      const geometry = new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.3);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      this.disposables.push(geometry);
    };
    part(W, t, D, black, 0, -H / 2, 0, this.box);
    part(t, H, D, black, -W / 2, 0, 0, this.box);
    part(t, H, D, black, W / 2, 0, 0, this.box);
    part(W, H, t, black, 0, 0, -D / 2, this.box);
    part(W, H, t, black, 0, 0, D / 2, this.box);
    part(W - 2 * t, 0.02, D - 2 * t, inside, 0, -H / 2 + 0.03, 0, this.box);
    part(0.12, H + 0.01, t + 0.01, band, 0, 0, D / 2 + 0.005, this.box);

    // The lid hinges along the back edge
    this.boxLid.position.set(0, H / 2, -D / 2);
    part(W + 0.04, 0.07, D + 0.04, black, 0, 0.035, D / 2, this.boxLid);
    part(0.12, 0.075, D + 0.05, band, 0, 0.036, D / 2, this.boxLid);
    part(W + 0.05, 0.075, 0.12, band, 0, 0.036, D / 2, this.boxLid);
    this.box.add(this.boxLid);
    this.box.visible = false;
    this.scene.add(this.box);
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  // Where a point on screen lands on the plane at depth z
  private toWorld(point: ScreenPoint, z: number, target = new THREE.Vector3()) {
    const ndc = new THREE.Vector3((point.x / this.width) * 2 - 1, -(point.y / this.height) * 2 + 1, 0.5);
    ndc.unproject(this.camera);
    const dir = ndc.sub(this.camera.position).normalize();
    const t = (z - this.camera.position.z) / dir.z;
    return target.copy(this.camera.position).addScaledVector(dir, t);
  }

  private setOpacity(materials: THREE.Material[], opacity: number) {
    materials.forEach((m) => {
      m.opacity = opacity;
      m.depthWrite = opacity > 0.98;
    });
  }

  render(f: GoldFrame) {
    const W = this.width;
    const H = this.height;
    const cam = this.camera;
    cam.position.set(0, f.cam.y, f.cam.z);
    cam.lookAt(0, f.cam.y * 0.35, 0);
    cam.updateMatrixWorld();

    // On narrow screens everything is scaled to fit the width
    const visibleWidth = 2 * Math.tan((cam.fov * Math.PI) / 360) * f.cam.z * cam.aspect;
    // (wide enough for the coins circling the piggy bank, not just the piggy bank)
    const fit = Math.min(1, visibleWidth / 5.3);

    // ---- The piggy bank ----
    let pigScale = f.pig.scale * fit;
    let pigX = f.pig.sx * W;
    let pigY = f.pig.sy * H;
    // Keep it, and the coins circling it, inside the free area so it never covers text or cards
    if (f.room?.length) {
      const pxPerUnit = H / (2 * Math.tan((cam.fov * Math.PI) / 360) * Math.max(0.1, f.cam.z - f.pig.z));
      let best: { room: (typeof f.room)[number]; scale: number } | null = null;
      for (const room of f.room) {
        const w = room.right - room.left;
        const h = room.bottom - room.top;
        if (w <= 0 || h <= 0) continue;
        const scale = Math.min(w / (2 * EXTENT.side * pxPerUnit), h / ((EXTENT.up + EXTENT.down) * pxPerUnit));
        if (!best || scale > best.scale) best = { room, scale };
      }
      if (best) {
        pigScale = Math.min(pigScale, best.scale);
        const { room } = best;
        const half = EXTENT.side * pigScale * pxPerUnit;
        pigX = Math.min(Math.max(pigX, room.left + half), room.right - half);
        pigY = Math.min(Math.max(pigY, room.top + EXTENT.up * pigScale * pxPerUnit), room.bottom - EXTENT.down * pigScale * pxPerUnit);
      }
    }
    this.toWorld({ x: pigX, y: pigY }, f.pig.z, this.pig.position);
    // A gentle idle float: bobbing and swaying, always on, even when the scroll is still
    const bob = Math.sin(f.drift * 1.3) * 0.06;
    const sway = Math.sin(f.drift * 0.6) * 0.07;
    this.pig.position.y += bob * pigScale;
    this.pigShadow.position.y = -1.11 - bob;
    this.pig.scale.setScalar(pigScale);
    const pigRotY = f.pig.rotY + sway;
    this.pig.rotation.set(0.06, pigRotY, Math.sin(f.drift * 0.9) * 0.02);

    // Each coin going in makes it dip and settle
    let dip = 0;
    let squash = 0;
    let lastLanding = -Infinity;
    f.landings.forEach((at) => {
      const tau = f.time - at;
      if (tau > 0) {
        dip += -0.07 * Math.exp(-6 * tau) * Math.sin(16 * tau);
        squash += 0.05 * Math.exp(-7 * tau) * Math.cos(18 * tau);
        lastLanding = Math.max(lastLanding, at);
      }
    });
    this.pigBody.position.y = dip;
    this.pigBody.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);

    // It grows richer as the gold builds up
    this.pigGold.roughness = lerp(0.26, 0.14, f.pig.value);
    this.pigGold.envMapIntensity = lerp(1.15, 1.6, f.pig.value);
    this.pigGold.clearcoat = lerp(0.08, 0.3, f.pig.value);

    const tau = f.time - lastLanding;
    const u = seg(tau, 0, 0.8);
    (this.ripple.material as THREE.MeshBasicMaterial).opacity = tau > 0 && u < 1 ? (1 - u) * 0.55 : 0;
    this.ripple.scale.setScalar(0.5 + 1.9 * smooth(u));

    // A soft highlight that travels across the gold
    this.sheen.intensity = f.sheen > -1 && f.sheen < 1 ? 60 * Math.sin(Math.PI * (f.sheen + 1) * 0.5) : 0;
    this.sheen.position.set(this.pig.position.x + f.sheen * 4.2, this.pig.position.y + 1.6, this.pig.position.z + 2.6);

    this.pig.updateMatrixWorld(true);
    const slot = this.pigBody.localToWorld(SLOT.clone());
    const slotTurn = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, pigRotY, 0));

    const spinQ = new THREE.Quaternion();
    // ---- A coin rising out of the piggy bank and becoming the portfolio ----
    {
      const e = f.emerge;
      const { group, materials } = this.emergeCoin;
      group.visible = e > 0 && e < 1;
      if (group.visible) {
        const rise = smooth(seg(e, 0, 0.28));
        const fly = easeInOut(seg(e, 0.28, 0.82));
        const up = slot.clone().add(new THREE.Vector3(0, lerp(-0.3, 0.75, rise) * pigScale, 0));
        const card = this.toWorld(f.anchors.portfolio, 1.6);
        const mid = up.clone().lerp(card, 0.5).add(new THREE.Vector3(0, 0.35, 0.6));
        const p1 = up.clone().lerp(mid, fly);
        const p2 = mid.clone().lerp(card, fly);
        group.position.copy(p1.lerp(p2, fly));
        group.scale.setScalar(lerp(pigScale, 2.2 * fit, fly));
        const facing = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
        spinQ.setFromEuler(new THREE.Euler(0, f.pig.rotY + (1 - fly) * 9, 0));
        group.quaternion.copy(spinQ).slerp(facing, smooth(seg(e, 0.6, 0.86)));
        this.setOpacity(materials, 1 - smooth(seg(e, 0.84, 1)));
      }
    }

    // ---- Withdraw: coin to bar, bar into its box, the box on its way ----
    const bench = this.toWorld(f.anchors.bench, 0.8);
    {
      const w = f.withdraw;
      const { group, materials } = this.withdrawCoin;
      group.visible = w.coin > 0 && w.morph < 1;
      if (group.visible) {
        const fly = easeInOut(w.coin);
        const from = this.toWorld(f.anchors.withdraw, 1.2);
        const pos = from.clone().lerp(bench, fly);
        pos.y += Math.sin(Math.PI * fly) * 0.6;
        group.position.copy(pos);
        group.scale.setScalar(fit * lerp(0.5, 1.5, smooth(seg(w.coin, 0, 0.4))) * (1 - smooth(w.morph)));
        group.rotation.set(0.25, Math.PI / 2 + w.coin * 7 + w.morph * 10, 0);
        this.setOpacity(materials, 1);
      }
      this.bar.visible = w.morph > 0 && w.away < 1;
      this.box.visible = w.pack > 0;
      const boxAt = bench.clone().add(new THREE.Vector3(0, -0.6 * fit, 0));
      if (this.bar.visible) {
        const grow = smooth(w.morph);
        const settle = 1 - grow;
        const into = smooth(w.drop);
        this.bar.position.copy(bench).lerp(boxAt.clone().add(new THREE.Vector3(0, -0.04 * fit, 0)), into);
        this.bar.position.y += Math.sin(Math.PI * grow) * 0.15;
        this.bar.scale.setScalar(fit * lerp(0.2, 1.1, grow) * lerp(1, 0.86, into));
        this.bar.rotation.set(lerp(0.42, 0.1, into), -0.3 + settle * 6, settle * 0.6);
        // Rides with the box once inside it
        if (w.away > 0) this.bar.position.add(this.awayOffset(w.away, fit));
        this.setOpacity(this.barMaterials, 1 - smooth(seg(w.away, 0.5, 1)));
      }
      if (this.box.visible) {
        const appear = smooth(w.pack);
        this.box.position.copy(boxAt).add(new THREE.Vector3(0, (1 - appear) * -0.4, 0)).add(this.awayOffset(w.away, fit));
        this.box.scale.setScalar(fit * lerp(0.6, 0.95, appear) * (1 + 0.25 * smooth(w.away)));
        this.box.rotation.set(0.32 - 0.12 * smooth(w.away), -0.35 + 0.2 * smooth(w.away), 0);
        this.boxLid.rotation.x = lerp(-1.95, 0, smooth(w.lid));
        this.setOpacity(this.boxMaterials, appear * (1 - smooth(seg(w.away, 0.5, 1))));
        this.box.visible = this.box.visible && w.away < 1;
      }
    }

    // ---- Sell: a coin streams into a ₹ ----
    {
      const s = f.sell;
      const { group, materials } = this.sellCoin;
      const target = this.toWorld(f.anchors.rupee, 0.8);
      group.visible = s.coin > 0 && s.burst < 0.35;
      if (group.visible) {
        const fly = easeInOut(s.coin);
        const from = this.toWorld(f.anchors.sell, 1.2);
        const pos = from.clone().lerp(bench, fly);
        pos.y += Math.sin(Math.PI * fly) * 0.5;
        group.position.copy(pos);
        group.scale.setScalar(fit * lerp(0.5, 1.6, smooth(seg(s.coin, 0, 0.4))) * (1 - smooth(seg(s.burst, 0, 0.35))));
        group.rotation.set(0, Math.PI / 2 + (1 - fly) * 8, 0);
        this.setOpacity(materials, 1);
      }
      this.particles.visible = s.burst > 0 && s.fade < 1;
      if (this.particles.visible) {
        if (!this.sourceCaptured) {
          // The particles start spread across the coin's face
          const radius = COIN_RADIUS * 1.6 * fit;
          this.particleJitter.forEach((j, i) => {
            const r = Math.sqrt(j.disc.x) * radius;
            const a = j.disc.y * Math.PI * 2;
            this.particleStart[i].set(Math.cos(a) * r, Math.sin(a) * r, 0);
          });
          this.sourceCaptured = true;
        }
        const positions = this.particles.geometry.attributes.position as THREE.BufferAttribute;
        const size = 1.15 * fit;
        this.particleJitter.forEach((j, i) => {
          const k = easeInOut(seg(s.burst, j.delay, j.delay + 0.6));
          const start = this.particleStart[i].clone().add(bench);
          const end = this.particleEnd[i].clone().multiplyScalar(size).add(target);
          const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(j.swirl * 0.5, j.lift * 0.45, 0.3));
          const p = start.clone().lerp(mid, k).lerp(mid.clone().lerp(end, k), k);
          positions.setXYZ(i, p.x, p.y, p.z);
        });
        positions.needsUpdate = true;
        const mat = this.particles.material as THREE.PointsMaterial;
        mat.opacity = smooth(seg(s.burst, 0, 0.15)) * (1 - smooth(s.fade));
        mat.size = 0.05 * fit;
      } else if (s.burst <= 0) {
        this.sourceCaptured = false;
      }
    }

    // ---- The coins circling the piggy bank. These are the coins that drop into its slot, one
    // by one, and that rise back out into their orbit at the end. ----
    const above = slot.clone().add(new THREE.Vector3(0, 0.6 * pigScale, 0));
    const orbitQ = new THREE.Quaternion();
    this.orbitCoins.forEach(({ group, materials }, i) => {
      const t = f.deposits[i] ?? 0;
      const back = f.returns[i] ?? 0;
      const appear = f.appears[i] ?? 1;
      const inside = t >= 1 && back <= 0;
      group.visible = !inside && appear > 0;
      if (!group.visible) return;
      this.setOpacity(materials, 1);

      // Where it is in its orbit right now: it turns as the page scrolls, and slowly on its own
      const spinTime = f.time + f.drift * 0.35;
      const angle = (i / ORBIT_COINS) * Math.PI * 2 + spinTime * 0.32;
      const r = 2.05 * pigScale;
      const orbit = new THREE.Vector3(
        this.pig.position.x + Math.cos(angle) * r,
        this.pig.position.y + 0.25 * pigScale + Math.sin(angle * 2 + i) * 0.18 * pigScale,
        this.pig.position.z + Math.sin(angle) * r * 0.75
      );
      orbitQ.setFromEuler(new THREE.Euler(0.2, -angle + Math.PI / 2 + spinTime * 0.6, 0.15));
      const orbitScale = pigScale * 0.85;

      if (t > 0 && t < 1) {
        // Off its orbit, over the top, square with the slot, and down through it
        const control = orbit.clone().lerp(above, 0.5).add(new THREE.Vector3(0, 0.35 * pigScale, 0.6 * pigScale));
        const fly = easeInOut(seg(t, 0, 0.7));
        const pos = orbit.clone().lerp(control, fly).lerp(control.clone().lerp(above, fly), fly);
        const drop = seg(t, 0.82, 1);
        pos.y -= 1.05 * pigScale * drop * drop;
        group.position.copy(pos);
        group.scale.setScalar(lerp(orbitScale, pigScale, fly));
        const spin = Math.sin(Math.PI * seg(t, 0, 0.6)) * 2.5;
        spinQ.setFromEuler(new THREE.Euler(0, spin, 0));
        group.quaternion.copy(orbitQ).multiply(spinQ).slerp(slotTurn, smooth(seg(t, 0.35, 0.82)));
      } else if (back > 0 && back < 1) {
        // Up out of the slot and out into its place in the orbit
        const rise = smooth(seg(back, 0, 0.35));
        const up = slot.clone().add(new THREE.Vector3(0, lerp(-0.4, 0.6, rise) * pigScale, 0));
        const fly = easeInOut(seg(back, 0.3, 1));
        const control = up.clone().lerp(orbit, 0.5).add(new THREE.Vector3(0, 0.3 * pigScale, 0.4 * pigScale));
        group.position.copy(up.clone().lerp(control, fly).lerp(control.clone().lerp(orbit, fly), fly));
        group.scale.setScalar(lerp(pigScale, orbitScale, fly));
        group.quaternion.copy(slotTurn).slerp(orbitQ, smooth(seg(back, 0.3, 0.9)));
      } else if (appear < 1) {
        // Like a planet finding its orbit: it slips out from behind the piggy bank and spirals
        // outwards, already circling, until it settles into its place in the orbit
        const k = smooth(appear);
        const swept = angle - (1 - k) * Math.PI * 1.6;
        const radius = r * lerp(0.35, 1, k);
        const behind = (1 - smooth(seg(appear, 0, 0.45))) * 1.0 * pigScale;
        group.position.set(
          this.pig.position.x + Math.cos(swept) * radius,
          this.pig.position.y + 0.25 * pigScale + Math.sin(swept * 2 + i) * 0.18 * pigScale * k,
          this.pig.position.z + Math.sin(swept) * radius * 0.75 - behind
        );
        group.scale.setScalar(orbitScale * lerp(0.5, 1, k));
        spinQ.setFromEuler(new THREE.Euler(0, (1 - k) * 3, 0));
        group.quaternion.copy(orbitQ).multiply(spinQ);
      } else {
        group.position.copy(orbit);
        group.scale.setScalar(orbitScale);
        group.quaternion.copy(orbitQ);
      }
    });

    this.renderer.render(this.scene, cam);
  }

  private awayOffset(away: number, fit: number) {
    const k = smooth(away);
    return new THREE.Vector3(0.3 * k * fit, -0.9 * k * fit, 3.2 * k);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}
