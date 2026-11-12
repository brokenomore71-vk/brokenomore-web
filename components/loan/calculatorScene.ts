import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// The Loan Planner's printing desk calculator, loaded from public/assets/calculator.glb (built by
// scripts/build-calculator-glb.mjs). The model has no text on it: this draws the display, the key
// legends, the brand and the receipt onto its named parts, then poses it each frame from whatever
// the section's scroll timeline says (see CalculatorFrame), so the story itself lives in LoanSection.

const MODEL_URL = '/assets/calculator.glb';
// Resting pose: tipped up so the sloped deck faces you, and turned a little to show its side
const POSE = { x: 0.8, y: -0.26 };
const KEY_TRAVEL = 0.018;
// The page's key labels, and the model's key names
const KEY_IDS: Record<string, string> = { '%': 'pct', '÷': 'div', '×': 'mul', '−': 'minus', '+': 'plus', '=': 'eq', '.': 'dot' };

export type CalculatorFrame = {
  // The layout box the calculator fills, in canvas pixels
  box: { cx: number; cy: number; w: number; h: number };
  // The entrance: how far below (px), how far turned (degrees), how large and how visible
  enter: { y: number; rotateX: number; rotateY: number; scale: number; alpha: number };
  // How far down each key is (by its label on the page), 0 to 1
  presses: Record<string, number>;
  display: { label: string; value: string };
  // How much of the receipt has printed, 0 to 1
  paper: number;
  time: number;
};

// Loaded once and shared, so coming back to the page doesn't fetch it again
let modelPromise: Promise<THREE.Group> | null = null;
function loadModel() {
  if (!modelPromise) {
    modelPromise = new GLTFLoader().loadAsync(MODEL_URL).then((gltf) => gltf.scene);
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SANS = 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function legendInk(label: string) {
  if (['%', '÷', '×', '−', '+'].includes(label)) return '#16161a';
  return '#F4F4F7';
}

export class CalculatorScene {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  private width = 1;
  private height = 1;
  private disposables: { dispose: () => void }[] = [];

  private root = new THREE.Group(); // placed and sized on the page
  private model = new THREE.Group(); // the entrance and the resting pose
  private fit = { size: new THREE.Vector3(1, 1, 1), center: new THREE.Vector3() };
  private keys = new Map<string, { node: THREE.Object3D; rest: number }>();
  private lcd!: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; shown: string };
  private paper!: THREE.Object3D;

  static async create(receiptLines: [string, string, boolean?][]) {
    const source = await loadModel();
    return new CalculatorScene(source.clone(true), receiptLines);
  }

  private constructor(calculator: THREE.Group, receiptLines: [string, string, boolean?][]) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'block h-full w-full';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // A studio to reflect, so the aluminium deck reads as metal
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = environment;
    this.scene.environmentIntensity = 0.45;
    this.disposables.push(environment);

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-2, 4, 4);
    const rim = new THREE.DirectionalLight(0xc4bbff, 0.8);
    rim.position.set(3, 2, -3);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.2), key, rim);

    this.camera.position.set(0, 0, 8);
    this.scene.add(this.root);
    this.root.add(this.model);
    this.model.add(calculator);

    // The model's own materials are shared with the cached original: give this copy its own
    calculator.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = (mesh.material as THREE.Material).clone();
      this.disposables.push(mesh.material as THREE.Material);
    });

    this.dressDisplay(calculator);
    this.dressKeys(calculator);
    this.dressBrand(calculator);
    this.dressPaper(calculator, receiptLines);
    this.measure(calculator);
  }

  private find(calculator: THREE.Object3D, name: string) {
    const node = calculator.getObjectByName(name);
    if (!node) throw new Error(`calculator.glb has no "${name}"`);
    return node;
  }

  private paint(mesh: THREE.Mesh, texture: THREE.Texture, transparent = true) {
    (mesh.material as THREE.Material).dispose();
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent, toneMapped: false, side: THREE.DoubleSide });
    mesh.material = material;
    this.disposables.push(material, texture);
  }

  private dressDisplay(calculator: THREE.Object3D) {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 204;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.paint(this.find(calculator, 'Display') as THREE.Mesh, texture, false);
    this.lcd = { canvas, texture, shown: '' };
  }

  // A dark display with teal segments
  private drawDisplay(label: string, value: string) {
    const key = `${label}|${value}`;
    if (this.lcd.shown === key) return;
    this.lcd.shown = key;
    const ctx = this.lcd.canvas.getContext('2d')!;
    const { width: w, height: h } = this.lcd.canvas;
    ctx.fillStyle = '#0b1113';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(89,227,199,0.6)';
    ctx.font = `700 30px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, 34, 22);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 112px ${MONO}`;
    // Unlit segments behind the digits, shaped like the value
    ctx.fillStyle = 'rgba(89,227,199,0.07)';
    ctx.fillText(value.replace(/[0-9A-Z]/g, '8'), w - 34, h - 22);
    ctx.fillStyle = '#59E3C7';
    ctx.fillText(value, w - 34, h - 22);
    this.lcd.texture.needsUpdate = true;
  }

  private dressKeys(calculator: THREE.Object3D) {
    const labels = ['AC', '%', '÷', '×', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', '=', '0', '00', '.', 'EMI'];
    labels.forEach((label) => {
      const id = KEY_IDS[label] ?? label;
      const node = this.find(calculator, `Key_${id}`);
      this.keys.set(label, { node, rest: node.position.z });
      const legend = canvasTexture(256, 142, (ctx) => {
        ctx.fillStyle = legendInk(label);
        ctx.font = `600 ${label.length > 2 ? 62 : 82}px ${SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 128, 76);
      });
      this.paint(this.find(calculator, `Legend_${id}`) as THREE.Mesh, legend);
    });
  }

  private dressBrand(calculator: THREE.Object3D) {
    const brand = canvasTexture(512, 64, (ctx) => {
      ctx.fillStyle = '#26262c';
      ctx.font = `700 40px ${SANS}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('BrokeNoMore', 4, 34);
    });
    this.paint(this.find(calculator, 'Brand') as THREE.Mesh, brand);
  }

  // The receipt: till paper with a torn top edge
  private dressPaper(calculator: THREE.Object3D, lines: [string, string, boolean?][]) {
    const W = 620;
    const H = 1000;
    const texture = canvasTexture(W, H, (ctx) => {
      ctx.fillStyle = '#f4f2ec';
      ctx.beginPath();
      const teeth = 20;
      ctx.moveTo(0, 18);
      for (let i = 0; i < teeth; i++) {
        ctx.lineTo(((i + 0.5) / teeth) * W, 0);
        ctx.lineTo(((i + 1) / teeth) * W, 18);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      const pad = 48;
      let y = 84;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#222';
      ctx.font = `700 38px ${MONO}`;
      ctx.fillText('BROKENOMORE', W / 2, y);
      y += 40;
      ctx.fillStyle = '#777';
      ctx.font = `500 26px ${MONO}`;
      ctx.fillText('LOAN SUMMARY', W / 2, y);
      y += 34;
      const rule = () => {
        ctx.strokeStyle = '#aaa';
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(W - pad, y);
        ctx.stroke();
        y += 50;
      };
      rule();
      lines.forEach(([a, b, strong]) => {
        if (a === '---') {
          y -= 16;
          rule();
          return;
        }
        ctx.fillStyle = '#222';
        ctx.font = `${strong ? 700 : 500} 30px ${MONO}`;
        ctx.textAlign = 'left';
        ctx.fillText(a, pad, y);
        ctx.textAlign = 'right';
        ctx.fillText(b, W - pad, y);
        y += 48;
      });
      y -= 16;
      rule();
      ctx.fillStyle = '#888';
      ctx.font = `500 24px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('* Illustrative figures', W / 2, y);
    });
    const paper = this.find(calculator, 'Paper') as THREE.Mesh;
    this.paint(paper, texture);
    this.paper = paper;
  }

  // The posed model's bounds without the receipt, so it can be fitted into the page's box
  private measure(calculator: THREE.Object3D) {
    this.paper.visible = false;
    this.model.rotation.set(POSE.x, POSE.y, 0);
    this.model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(calculator);
    box.getSize(this.fit.size);
    box.getCenter(this.fit.center);
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render(f: CalculatorFrame) {
    // World units per pixel on the plane the calculator sits on
    const visibleH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const upp = visibleH / this.height;
    const scale = Math.min((f.box.h * upp) / this.fit.size.y, (f.box.w * upp) / this.fit.size.x);
    this.root.scale.setScalar(scale);
    this.root.position.set(
      (f.box.cx - this.width / 2) * upp - this.fit.center.x * scale,
      -(f.box.cy - this.height / 2) * upp - this.fit.center.y * scale,
      -this.fit.center.z * scale
    );

    // The entrance, then the resting pose with a slow idle drift
    const e = f.enter;
    this.root.visible = e.alpha > 0.01;
    const idle = Math.min(1, e.alpha * e.scale);
    this.model.position.set(0, (-e.y * upp) / scale + Math.sin(f.time * 1.1) * 0.012 * idle, 0);
    this.model.scale.setScalar(e.scale);
    this.model.rotation.set(
      POSE.x + THREE.MathUtils.degToRad(e.rotateX) + Math.sin(f.time * 0.7) * 0.015 * idle,
      POSE.y + THREE.MathUtils.degToRad(e.rotateY) + Math.sin(f.time * 0.5) * 0.03 * idle,
      0
    );

    this.keys.forEach(({ node, rest }, label) => {
      node.position.z = rest - KEY_TRAVEL * Math.min(1, Math.max(0, f.presses[label] ?? 0));
    });
    this.drawDisplay(f.display.label, f.display.value);

    // The receipt feeds out of the slot; until then it's inside the printer
    const printed = Math.min(1, Math.max(0, f.paper));
    this.paper.visible = printed > 0.001;
    this.paper.position.y = printed - 0.5;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}
