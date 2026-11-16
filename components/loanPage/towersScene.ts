import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// The Loan Planner's scene: every loan a tower of glossy slabs on a dark mirror floor, one slab
// for each year still to pay. Each slab is split into what that year pays off the loan (in the
// loan's colour) and what it pays in interest (which glows red once it's revealed). A coin hangs in
// front, and beams carry each month's EMI out to it. Prepaying shatters the years it saves off the
// top of the home loan; at the end, every slab lifts away.
//
// The page drives it all through `state` (each 0 to 1, tweened by its scroll timeline) and `cam`
// (a float along the camera's keyframes), and reads back where each tower's top is on screen.

export type TowerLoan = { key: string; color: string; years: { interest: number; principal: number }[]; yearsAfter?: { interest: number; principal: number }[] };

export type SceneState = {
  rise: number; // the towers build, slab by slab
  split: number; // the interest in each slab is revealed
  emi: number; // the EMI beams run
  prepay: number; // the home loan's saved years shatter, and its interest shrinks
  dismantle: number; // every slab lifts away
  free: number; // the floor lights up
};

const SLAB_W = 2;
const SLAB_H = 0.17;
const GAP = 0.05;
const STEP = SLAB_H + GAP;
const TOWER_X = [-3.6, 0, 3.6];
const COIN = new THREE.Vector3(0, 6.4, 2.6);
const RED = new THREE.Color('#9F1239'); // interest, once it's revealed
const RED_GLOW = new THREE.Color('#EF4444');

// Where the camera stands and looks, at each step (the page tweens `cam` between them)
const SHOTS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [34, 22, 44], look: [0, 1.5, 0] }, // far out, before the fly-in
  { pos: [9.5, 5.6, 13.5], look: [0, 2, 0] }, // the hero
  { pos: [0, 4.2, 15], look: [0, 2.2, 0] }, // every loan
  { pos: [-7, 7.5, 12], look: [0, 3.2, 1.2] }, // the EMI
  { pos: [-1.6, 4.4, 11.5], look: [0.9, 2.4, 0] }, // the interest, closer in
  { pos: [8, 5, 10], look: [0, 2, 0] }, // the prepayment
  { pos: [0, 13, 13], look: [0, 1, 0] }, // debt-free, from above
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const backOut = (v: number) => 1 + 2.2 * Math.pow(v - 1, 3) + 1.2 * Math.pow(v - 1, 2);

type Slab = { group: THREE.Group; principal: THREE.Mesh; interest: THREE.Mesh; tower: number; j: number; order: number; fBefore: number; fAfter: number; extra: boolean; fragments?: THREE.Mesh[] };

export class TowersScene {
  readonly canvas: HTMLCanvasElement;
  readonly state: SceneState = { rise: 0, split: 0, emi: 0, prepay: 0, dismantle: 0, free: 0 };
  readonly cam = { v: 0 };
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  private slabs: Slab[] = [];
  private towerMats: { interest: THREE.MeshPhysicalMaterial; color: THREE.Color }[] = [];
  private beams: { tube: THREE.Mesh; packets: THREE.Mesh[]; curve: THREE.QuadraticBezierCurve3 }[] = [];
  private coin = new THREE.Group();
  private coinSize = 1;
  private floorRing!: THREE.Mesh;
  private pulse!: THREE.Mesh;
  private dust!: THREE.Points;
  private disposables: { dispose: () => void }[] = [];
  private raf = 0;
  private running = false;
  private t = 0;
  private last = 0;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private width = 1;
  private height = 1;
  private loans: TowerLoan[];

  constructor(loans: TowerLoan[]) {
    this.loans = loans;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'block h-full w-full';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x030306, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.55;
    this.disposables.push(env);
    this.scene.fog = new THREE.Fog(0x030306, 28, 85);

    this.buildLights();
    this.buildFloor();
    this.buildTowers();
    this.buildCoin();
    this.buildBeams();
    this.buildDust();
  }

  private track<T extends { dispose: () => void }>(thing: T) {
    this.disposables.push(thing);
    return thing;
  }

  private buildLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const key = new THREE.SpotLight(0xffffff, 260, 40, Math.PI / 5, 0.6, 1.6);
    key.position.set(-5, 14, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.03;
    this.scene.add(key, key.target);
    const violet = new THREE.PointLight(0x8b5cf6, 80, 26);
    violet.position.set(7, 4, -4);
    const pink = new THREE.PointLight(0xe86ab4, 60, 24);
    pink.position.set(-8, 3, -2);
    const front = new THREE.PointLight(0x6e5bff, 30, 20);
    front.position.set(0, 2, 9);
    this.scene.add(violet, pink, front);
  }

  // A mirror floor, a fine grid on it, and a ring that lights up when the debt's gone
  private buildFloor() {
    const mirror = new Reflector(this.track(new THREE.CircleGeometry(40, 64)), {
      clipBias: 0.003,
      textureWidth: Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5)),
      textureHeight: Math.round(window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.5)),
      color: 0x2a2838,
    });
    mirror.rotation.x = -Math.PI / 2;
    this.scene.add(mirror);
    this.disposables.push({ dispose: () => mirror.dispose() });
    // A dark veil just above it, so the reflection reads as polished stone rather than glass
    const veil = new THREE.Mesh(this.track(new THREE.CircleGeometry(40, 64)), this.track(new THREE.MeshStandardMaterial({ color: 0x07070c, transparent: true, opacity: 0.62, roughness: 0.6, metalness: 0.2 })));
    veil.rotation.x = -Math.PI / 2;
    veil.position.y = 0.005;
    veil.receiveShadow = true;
    this.scene.add(veil);
    const grid = new THREE.GridHelper(60, 60, 0x2b2550, 0x16142a);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    this.scene.add(grid);
    this.disposables.push(grid.geometry, grid.material as THREE.Material);
    this.floorRing = new THREE.Mesh(this.track(new THREE.RingGeometry(4.3, 4.42, 128)), this.track(new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0, side: THREE.DoubleSide })));
    this.floorRing.rotation.x = -Math.PI / 2;
    this.floorRing.position.y = 0.02;
    this.scene.add(this.floorRing);
    // A wave that keeps rolling out from it
    this.pulse = new THREE.Mesh(this.track(new THREE.RingGeometry(4.3, 4.36, 128)), this.track(new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })));
    this.pulse.rotation.x = -Math.PI / 2;
    this.pulse.position.y = 0.025;
    this.scene.add(this.pulse);
  }

  private buildTowers() {
    const geo = this.track(new RoundedBoxGeometry(SLAB_W, 1, SLAB_W, 3, 0.06));
    const frag = this.track(new THREE.BoxGeometry(0.42, SLAB_H, 0.42));
    let order = 0;
    // Build bottom-up across all three, interleaved, so they rise together
    const tallest = Math.max(...this.loans.map((l) => l.years.length));
    this.loans.forEach((loan) => {
      const color = new THREE.Color(loan.color);
      this.towerMats.push({ color, interest: this.track(new THREE.MeshPhysicalMaterial({ color: color.clone(), metalness: 0.2, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.15, transparent: true, opacity: 0.95, emissive: RED_GLOW.clone(), emissiveIntensity: 0 })) });
    });
    for (let j = 0; j < tallest; j++) {
      this.loans.forEach((loan, ti) => {
        if (j >= loan.years.length) return;
        const y = loan.years[j];
        const after = loan.yearsAfter?.[j];
        const principalMat = this.track(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(loan.color), metalness: 0.35, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12, emissive: new THREE.Color(loan.color), emissiveIntensity: 0.12 }));
        const principal = new THREE.Mesh(geo, principalMat);
        const interest = new THREE.Mesh(geo, this.towerMats[ti].interest);
        principal.castShadow = interest.castShadow = true;
        principal.receiveShadow = interest.receiveShadow = true;
        const group = new THREE.Group();
        group.add(principal, interest);
        group.position.set(TOWER_X[ti], j * STEP + SLAB_H / 2, 0);
        this.scene.add(group);
        const total = y.interest + y.principal;
        const extra = !!loan.yearsAfter && j >= loan.yearsAfter.length;
        const slab: Slab = { group, principal, interest, tower: ti, j, order: order++, fBefore: y.interest / total, fAfter: after ? after.interest / (after.interest + after.principal) : y.interest / total, extra };
        // The years a prepayment saves: they'll break into pieces
        if (extra) {
          const mat = this.track(principalMat.clone());
          mat.transparent = true;
          slab.fragments = Array.from({ length: 16 }, (_, k) => {
            const m = new THREE.Mesh(frag, mat);
            m.userData.home = new THREE.Vector3(TOWER_X[ti] + ((k % 4) - 1.5) * 0.48, j * STEP + SLAB_H / 2, (Math.floor(k / 4) - 1.5) * 0.48);
            m.userData.dir = new THREE.Vector3(((k % 4) - 1.5) * 1.1 + (Math.random() - 0.5), 1.5 + Math.random() * 2.5, (Math.floor(k / 4) - 1.5) * 1.1 + (Math.random() - 0.5));
            m.userData.spin = new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8);
            m.visible = false;
            this.scene.add(m);
            return m;
          });
        }
        this.slabs.push(slab);
      });
    }
  }

  // A coin of light, where each month's EMI goes
  private buildCoin() {
    const rim = new THREE.Mesh(this.track(new THREE.TorusGeometry(0.9, 0.09, 24, 96)), this.track(new THREE.MeshPhysicalMaterial({ color: 0xf5c451, metalness: 1, roughness: 0.22, emissive: 0x8a5a00, emissiveIntensity: 0.5 })));
    const face = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.86, 0.86, 0.1, 64)), this.track(new THREE.MeshPhysicalMaterial({ color: 0x6e5bff, metalness: 0.6, roughness: 0.15, emissive: 0x6e5bff, emissiveIntensity: 0.8, clearcoat: 1 })));
    face.rotation.x = Math.PI / 2;
    const glow = new THREE.Mesh(this.track(new THREE.SphereGeometry(1.5, 32, 16)), this.track(new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.12, depthWrite: false })));
    this.coin.add(rim, face, glow);
    this.coin.position.copy(COIN);
    this.coinSize = 0.6;
    this.coin.scale.setScalar(0.001);
    this.scene.add(this.coin);
  }

  private buildBeams() {
    this.loans.forEach((loan, ti) => {
      const from = new THREE.Vector3(TOWER_X[ti], loan.years.length * STEP + 0.2, 0);
      const mid = from.clone().lerp(COIN, 0.5).add(new THREE.Vector3(0, 1.6, 0));
      const curve = new THREE.QuadraticBezierCurve3(from, mid, COIN.clone());
      const tube = new THREE.Mesh(this.track(new THREE.TubeGeometry(curve, 48, 0.014, 8)), this.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(loan.color), transparent: true, opacity: 0 })));
      this.scene.add(tube);
      const pg = this.track(new THREE.SphereGeometry(0.05, 12, 8));
      const pm = this.track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const packets = Array.from({ length: 5 }, () => {
        const m = new THREE.Mesh(pg, pm);
        m.visible = false;
        this.scene.add(m);
        return m;
      });
      this.beams.push({ tube, packets, curve });
    });
  }

  private buildDust() {
    const n = 500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 40, Math.random() * 14, (Math.random() - 0.5) * 40], i * 3);
    const g = this.track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(g, this.track(new THREE.PointsMaterial({ color: 0xa99dff, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false })));
    this.scene.add(this.dust);
  }

  setPointer(x: number, y: number) {
    this.pointer.tx = x;
    this.pointer.ty = y;
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.fov = this.camera.aspect < 0.8 ? 52 : 36;
    // On wide screens, the towers stand right of centre, clear of the captions
    if (this.camera.aspect > 1.1) this.camera.setViewOffset(this.width, this.height, -this.width * 0.13, 0, this.width, this.height);
    // On phones, lower, under the captions
    else this.camera.setViewOffset(this.width, this.height, 0, -this.height * 0.1, this.width, this.height);
    this.camera.updateProjectionMatrix();
  }

  // Where a tower's top is on screen, in canvas pixels (and whether it's in front of the camera)
  towerTop(ti: number) {
    const loan = this.loans[ti];
    const count = loan.yearsAfter ? loan.years.length + (loan.yearsAfter.length - loan.years.length) * this.state.prepay : loan.years.length;
    const v = new THREE.Vector3(TOWER_X[ti], count * STEP * (1 - this.state.dismantle) + 0.6, 0).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.width, y: (-v.y * 0.5 + 0.5) * this.height, visible: v.z < 1 };
  }

  coinOnScreen() {
    return this.project(COIN.x, this.coin.position.y, COIN.z);
  }

  project(x: number, y: number, z: number) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.width, y: (-v.y * 0.5 + 0.5) * this.height };
  }

  setActive(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    if (on) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    } else cancelAnimationFrame(this.raf);
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  private step(dt: number) {
    const s = this.state;
    const t = this.t;

    // The camera, along its shots, drifting a little and following the pointer
    const p = this.pointer;
    p.x += (p.tx - p.x) * Math.min(1, dt * 3);
    p.y += (p.ty - p.y) * Math.min(1, dt * 3);
    const v = Math.min(SHOTS.length - 1, Math.max(0, this.cam.v));
    const a = Math.floor(v);
    const b = Math.min(SHOTS.length - 1, a + 1);
    const k = ease(v - a);
    const lerp3 = (x: number[], y: number[]) => new THREE.Vector3(x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k);
    const pos = lerp3(SHOTS[a].pos, SHOTS[b].pos);
    const look = lerp3(SHOTS[a].look, SHOTS[b].look);
    const narrow = this.camera.aspect < 0.8;
    if (narrow) pos.sub(look).multiplyScalar(1.6).add(look);
    pos.x += Math.sin(t * 0.25) * 0.4 + p.x * 1.6;
    pos.y += Math.sin(t * 0.33) * 0.2 - p.y * 0.9;
    this.camera.position.copy(pos);
    this.camera.lookAt(look);

    // The towers
    const total = this.slabs.length;
    this.towerMats.forEach((m) => {
      m.interest.color.copy(m.color).lerp(RED, s.split);
      m.interest.emissiveIntensity = s.split * (0.38 + Math.sin(t * 3) * 0.08);
    });
    this.slabs.forEach((sl) => {
      const loan = this.loans[sl.tower];
      // Rising: each slab drops into place in turn
      const r = clamp01((s.rise * (total + 8) - sl.order) / 8);
      const drop = (1 - backOut(r)) * 6;
      // Dismantling: top slabs first, each lifting away and spinning off into the dark
      const height = loan.years.length;
      const dm = clamp01((s.dismantle * (height + 6) - (height - sl.j)) / 6);
      const lift = ease(dm);
      const baseY = sl.j * STEP + SLAB_H / 2;
      sl.group.position.set(TOWER_X[sl.tower] + Math.sin(sl.order) * lift * 3, baseY + drop + lift * (8 + sl.j * 0.3), Math.cos(sl.order) * lift * 3);
      sl.group.rotation.set(lift * 1.2 * Math.sin(sl.order * 1.7), lift * 2.5, lift * 0.8 * Math.cos(sl.order));
      const scale = r <= 0 || lift >= 0.999 ? 0.001 : 1 - lift * 0.85;
      sl.group.scale.setScalar(scale);
      // The split: principal below, interest above, by how much of that year goes to each
      const f = sl.fBefore + (sl.fAfter - sl.fBefore) * s.prepay;
      const fi = f * s.split + (1 - s.split) * 0.5;
      sl.principal.scale.set(1, SLAB_H * (1 - fi), 1);
      sl.principal.position.y = -SLAB_H / 2 + (SLAB_H * (1 - fi)) / 2;
      sl.interest.scale.set(1, SLAB_H * fi, 1);
      sl.interest.position.y = SLAB_H / 2 - (SLAB_H * fi) / 2;
      // A saved year: it shatters as the prepayment goes in, top first
      if (sl.extra && sl.fragments) {
        const kept = loan.yearsAfter!.length;
        const n = height - kept;
        const order = height - 1 - sl.j; // top one first
        const sh = clamp01((s.prepay * (n + 3) - order) / 3);
        sl.group.visible = sh <= 0.02 && r > 0;
        sl.fragments.forEach((m) => {
          m.visible = sh > 0.02 && sh < 0.999;
          if (!m.visible) return;
          const home = m.userData.home as THREE.Vector3;
          const dir = m.userData.dir as THREE.Vector3;
          const spin = m.userData.spin as THREE.Vector3;
          m.position.set(home.x + dir.x * sh * 3, home.y + dir.y * sh * 2 - sh * sh * 3, home.z + dir.z * sh * 3);
          m.rotation.set(spin.x * sh, spin.y * sh, spin.z * sh);
          (m.material as THREE.MeshPhysicalMaterial).opacity = 1 - sh;
          m.scale.setScalar(1 - sh * 0.5);
        });
      }
    });

    // The coin, and the beams carrying the EMI to it
    const coinIn = clamp01(s.emi * 3) * (1 - s.split);
    this.coin.scale.setScalar(Math.max(0.001, backOut(coinIn) * this.coinSize));
    this.coin.rotation.y = t * 1.2;
    this.coin.position.y = COIN.y + Math.sin(t * 1.5) * 0.12;
    this.beams.forEach((bm, i) => {
      const on = clamp01(s.emi * 2 - i * 0.2) * (1 - s.split);
      (bm.tube.material as THREE.MeshBasicMaterial).opacity = on * 0.55;
      bm.packets.forEach((pk, j) => {
        pk.visible = on > 0.05;
        if (!pk.visible) return;
        pk.position.copy(bm.curve.getPoint((t * 0.4 + j / bm.packets.length + i * 0.13) % 1));
      });
    });

    // Debt-free: the ring on the floor lights up
    (this.floorRing.material as THREE.MeshBasicMaterial).opacity = s.free * (0.7 + Math.sin(t * 2) * 0.2);
    this.floorRing.scale.setScalar(0.8 + s.free * 0.2);
    const w = (t * 0.45) % 1;
    this.pulse.scale.setScalar(1 + w * 0.9);
    (this.pulse.material as THREE.MeshBasicMaterial).opacity = s.free * (1 - w) * 0.6;

    this.dust.rotation.y += dt * 0.02;
  }

  dispose() {
    this.setActive(false);
    this.disposables.forEach((d) => d.dispose());
    this.slabs.forEach((sl) => (sl.principal.material as THREE.Material).dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}
