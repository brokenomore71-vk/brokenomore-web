import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// The calculators' 3D vessel: a glass cylinder on a dark mirror floor, holding your money as two
// layers of liquid. The bottom layer is what you put in (or have repaid), the top is what it earned
// (or cost). Rings etched on the glass mark the scale. The page sets each layer's level (0 to 1 of
// the scale) and the scene eases towards it, so every change in the numbers is seen to pour.

export const VESSEL_H = 4; // the height of the scale inside the glass
const R = 1.05;
const BASE_Y = 0.2;

export class VesselScene {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private layerA: THREE.Mesh;
  private layerB: THREE.Mesh;
  private surface: THREE.Mesh;
  private bubbles: THREE.Mesh[] = [];
  private ticks: THREE.Mesh[] = [];
  private glow: THREE.Mesh;
  private target = { a: 0, b: 0 };
  private level = { a: 0, b: 0 };
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private disposables: { dispose: () => void }[] = [];
  private raf = 0;
  private running = false;
  private t = 0;
  private last = 0;
  private w = 1;
  private h = 1;

  constructor(colorA: string, colorB: string) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'absolute inset-0 block h-full w-full';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.7;
    this.disposables.push(env);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-4, 8, 6);
    const rim = new THREE.PointLight(0x8b7bff, 40, 14);
    rim.position.set(3.5, 4, -3);
    const fill = new THREE.PointLight(0x1a9bbd, 14, 12);
    fill.position.set(-3.5, 2, 2);
    this.scene.add(key, rim, fill);

    // The floor: a dark mirror under a veil, and a soft pool of violet light under the glass
    const mirror = new Reflector(this.track(new THREE.CircleGeometry(14, 64)), {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x34324a,
    });
    mirror.rotation.x = -Math.PI / 2;
    this.scene.add(mirror);
    this.disposables.push({ dispose: () => mirror.dispose() });
    const veil = new THREE.Mesh(this.track(new THREE.CircleGeometry(14, 64)), this.track(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 })));
    veil.rotation.x = -Math.PI / 2;
    veil.position.y = 0.004;
    this.scene.add(veil);
    this.glow = new THREE.Mesh(this.track(new THREE.CircleGeometry(3.2, 64)), this.track(new THREE.MeshBasicMaterial({ map: this.track(radial('rgba(110,91,255,0.55)')), transparent: true, depthWrite: false })));
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.position.y = 0.008;
    this.scene.add(this.glow);

    // The base the glass stands on
    const base = new THREE.Mesh(this.track(new THREE.CylinderGeometry(R + 0.22, R + 0.28, BASE_Y, 96)), this.track(new THREE.MeshPhysicalMaterial({ color: 0x0f0e16, metalness: 0.7, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.2 })));
    base.position.y = BASE_Y / 2;
    this.scene.add(base);
    const baseRing = new THREE.Mesh(this.track(new THREE.TorusGeometry(R + 0.25, 0.012, 12, 128)), this.track(new THREE.MeshBasicMaterial({ color: 0x8b7bff, transparent: true, opacity: 0.6 })));
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = BASE_Y;
    this.scene.add(baseRing);

    // The liquid: two layers and a lit surface on top
    const liquid = this.track(new THREE.CylinderGeometry(R - 0.06, R - 0.06, 1, 96));
    liquid.translate(0, 0.5, 0);
    this.layerA = new THREE.Mesh(liquid, this.track(new THREE.MeshPhysicalMaterial({ color: colorA, emissive: colorA, emissiveIntensity: 0.35, roughness: 0.18, metalness: 0.05, clearcoat: 1, transparent: true, opacity: 0.94 })));
    this.layerB = new THREE.Mesh(liquid, this.track(new THREE.MeshPhysicalMaterial({ color: colorB, emissive: colorB, emissiveIntensity: 0.45, roughness: 0.15, metalness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9 })));
    this.scene.add(this.layerA, this.layerB);
    this.surface = new THREE.Mesh(this.track(new THREE.CircleGeometry(R - 0.06, 96)), this.track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false })));
    this.surface.rotation.x = -Math.PI / 2;
    this.scene.add(this.surface);

    // The glass, its rim, and the scale's rings
    const glass = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(R, R, VESSEL_H + 0.5, 96, 1, true)),
      this.track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false }))
    );
    glass.position.y = BASE_Y + (VESSEL_H + 0.5) / 2;
    glass.renderOrder = 2;
    this.scene.add(glass);
    const rimRing = new THREE.Mesh(this.track(new THREE.TorusGeometry(R, 0.025, 16, 128)), this.track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.05, clearcoat: 1 })));
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = BASE_Y + VESSEL_H + 0.5;
    this.scene.add(rimRing);
    const tickGeo = this.track(new THREE.TorusGeometry(R + 0.004, 0.006, 8, 128));
    const tickMat = this.track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 }));
    for (let i = 1; i <= 4; i++) {
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.rotation.x = Math.PI / 2;
      tick.position.y = BASE_Y + (VESSEL_H * i) / 4;
      this.ticks.push(tick);
      this.scene.add(tick);
    }

    // A few bubbles rising through the liquid
    const bubbleGeo = this.track(new THREE.SphereGeometry(0.028, 10, 8));
    const bubbleMat = this.track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    for (let i = 0; i < 16; i++) {
      const b = new THREE.Mesh(bubbleGeo, bubbleMat);
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * (R - 0.2);
      b.userData = { x: Math.cos(a) * d, z: Math.sin(a) * d, y: Math.random(), speed: 0.12 + Math.random() * 0.2, s: 0.6 + Math.random() * 0.8 };
      this.bubbles.push(b);
      this.scene.add(b);
    }
  }

  private track<T extends { dispose: () => void }>(thing: T) {
    this.disposables.push(thing);
    return thing;
  }

  // Each layer's level, 0 to 1 of the scale
  setLevels(a: number, b: number) {
    this.target.a = Math.max(0, a);
    this.target.b = Math.max(0, b);
  }

  // Jump straight to the levels (for the first frame)
  snap() {
    this.level.a = this.target.a;
    this.level.b = this.target.b;
  }

  setPointer(x: number, y: number) {
    this.pointer.tx = x;
    this.pointer.ty = y;
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  }

  // Where a point on the scale (0 to 1) is on screen, just right of the glass
  scalePoint(f: number) {
    const v = new THREE.Vector3(R + 0.12, BASE_Y + f * VESSEL_H, 0).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.w, y: (-v.y * 0.5 + 0.5) * this.h };
  }

  setActive(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    if (on) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    } else cancelAnimationFrame(this.raf);
  }

  // Render one frame now (used for the first paint, and by `onFrame` callers)
  frame() {
    this.step(0);
    this.renderer.render(this.scene, this.camera);
  }

  onFrame?: () => void;

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.();
    this.raf = requestAnimationFrame(this.loop);
  };

  private step(dt: number) {
    const k = Math.min(1, dt * 5);
    this.level.a += (this.target.a - this.level.a) * k;
    this.level.b += (this.target.b - this.level.b) * k;
    const p = this.pointer;
    p.x += (p.tx - p.x) * Math.min(1, dt * 3);
    p.y += (p.ty - p.y) * Math.min(1, dt * 3);

    // The camera: a slow drift, nudged by the pointer
    const narrow = this.camera.aspect < 0.9;
    const dist = narrow ? 12.5 : 10.5;
    const ang = Math.sin(this.t * 0.18) * 0.12 + p.x * 0.35;
    this.camera.position.set(Math.sin(ang) * dist, 3.6 - p.y * 0.8, Math.cos(ang) * dist);
    this.camera.lookAt(0, BASE_Y + VESSEL_H * 0.5, 0);

    const ha = this.level.a * VESSEL_H;
    const hb = this.level.b * VESSEL_H;
    const total = ha + hb;
    this.layerA.visible = ha > 0.004;
    this.layerA.scale.set(1, Math.max(0.001, ha), 1);
    this.layerA.position.y = BASE_Y;
    this.layerB.visible = hb > 0.004;
    this.layerB.scale.set(1, Math.max(0.001, hb), 1);
    this.layerB.position.y = BASE_Y + ha;
    this.surface.visible = total > 0.01;
    this.surface.position.y = BASE_Y + total + 0.002;
    (this.surface.material as THREE.MeshBasicMaterial).opacity = 0.16 + Math.sin(this.t * 2) * 0.04;
    this.glow.scale.setScalar(0.85 + Math.min(1, total / VESSEL_H) * 0.35);

    this.bubbles.forEach((b) => {
      const u = b.userData as { x: number; z: number; y: number; speed: number; s: number };
      u.y = (u.y + dt * u.speed) % 1;
      const y = u.y * total;
      b.visible = total > 0.3 && y < total - 0.05;
      b.position.set(u.x + Math.sin(this.t * 2 + u.s * 9) * 0.03, BASE_Y + y, u.z);
      b.scale.setScalar(u.s);
    });
  }

  dispose() {
    this.setActive(false);
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}

// A soft radial glow, drawn once onto a canvas
function radial(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
