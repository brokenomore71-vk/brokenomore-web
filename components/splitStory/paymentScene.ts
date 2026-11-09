import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BILL, inr } from './splitData';
import { OCR_ROWS, RECEIPT_H, RECEIPT_W } from './receipt';

// Measured from payment_machine.glb.
const MODEL_CENTER = new THREE.Vector3(0.045, 1.778, 0.454);
const SCREEN = {
  center: new THREE.Vector3(0, 2.458, -1.255),
  normal: new THREE.Vector3(0, 0.955, -0.295),
  up: new THREE.Vector3(0, 0.295, 0.955),
  width: 4.02,
  height: 7.72,
};
// The groove behind the top bezel, which is where the paper comes out.
const SLOT = new THREE.Vector3(0, 3.7, 3.55);
const PAPER_EXIT = new THREE.Vector3(0, 0.55, 0.835).normalize();
const PAPER_FACING = new THREE.Vector3(0, 0.835, -0.55).normalize();
// Width of paper the slot takes, in model units.
export const SLOT_PAPER_WIDTH = 3.9;

// Stands the machine upright: its printer end up, its screen towards the viewer.
const MOUNT = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0))
);
const PAPER_IN_MODEL = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(PAPER_EXIT, PAPER_FACING), PAPER_EXIT, PAPER_FACING)
);

const SEGMENTS_ACROSS = 10;
const SEGMENTS_ALONG = 110;
const CURVE_SAMPLES = 140;

// What the scroll timeline animates. Distances are stage pixels from the stage's middle.
export function initialSceneParams() {
  return {
    machine: { x: 0, y: 0, pxPerUnit: 30, rx: -0.4, ry: 0, rz: 0, shake: 0 },
    paper: {
      printed: 0, // how much has come out of the slot, 0 to 1
      anchored: 1, // 1 while feeding out of the slot, 0 once torn free
      x: 0,
      y: 0,
      z: 0,
      scale: 0.5,
      rx: 0,
      ry: 0,
      rz: 0,
      pivot: 0, // 0 holds it by the slot end, 1 by its middle
      curl: 2.25, // radians the free end bends back, from the roll it came off
      tail: 0, // once torn, how far the other end curls forward
      bow: 0.1, // slight belly near the slot
      cup: 9, // the width-wise curve that stops real paper hanging limp
      twist: 7,
      wave: 0,
      visible: 0,
      overlay: 1,
    },
  };
}
export type SceneParams = ReturnType<typeof initialSceneParams>;

const scratchQuat = new THREE.Quaternion();
const scratchEuler = new THREE.Euler();

function machineQuaternion(m: SceneParams['machine'], target: THREE.Quaternion) {
  scratchEuler.set(m.rx, m.ry, m.rz, 'XYZ');
  return target.setFromEuler(scratchEuler).multiply(MOUNT);
}

// Where the slot is on the stage for a given machine pose, with y pointing down.
export function slotOnStage(m: SceneParams['machine']) {
  const p = SLOT.clone().sub(MODEL_CENTER).multiplyScalar(m.pxPerUnit).applyQuaternion(machineQuaternion(m, scratchQuat));
  return { x: m.x + p.x, y: m.y - p.y, z: p.z };
}

interface SceneOptions {
  canvas: HTMLCanvasElement;
  params: SceneParams;
  receipt: HTMLCanvasElement;
  getSweep: () => number;
  getFont: () => string;
}

// The payment machine and the paper it prints, drawn in their own 3D layer behind the phone.
export class PaymentScene {
  active = false;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(26, 1, 10, 6000);
  private machineGroup = new THREE.Group();
  private paperGroup = new THREE.Group();
  private paperGeometry: THREE.PlaneGeometry;
  private paperTexture: THREE.CanvasTexture;
  private overlayCanvas = document.createElement('canvas');
  private overlayTexture: THREE.CanvasTexture;
  private overlayMaterial: THREE.MeshBasicMaterial;
  private screenCanvas = document.createElement('canvas');
  private screenTexture: THREE.CanvasTexture;
  private curveY = new Float32Array(CURVE_SAMPLES + 1);
  private curveZ = new Float32Array(CURVE_SAMPLES + 1);
  private lastSweep = -1;
  private lastScreenKey = '';
  private frame = 0;
  private resizeObserver: ResizeObserver;
  private disposed = false;
  private clock = new THREE.Clock();

  constructor(private options: SceneOptions) {
    const { canvas, receipt } = options;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const environment = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.42;
    environment.dispose();

    // Lit from the front and slightly below, so paper rolling away from the viewer falls into
    // shade the way a real curl does
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(-240, -160, 900);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -700;
    key.shadow.camera.right = 700;
    key.shadow.camera.top = 700;
    key.shadow.camera.bottom = -700;
    key.shadow.camera.near = 100;
    key.shadow.camera.far = 2600;
    key.shadow.bias = -0.0015;
    key.shadow.radius = 5;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9aa0ff, 0.9);
    rim.position.set(500, 200, -500);
    this.scene.add(rim);
    const top = new THREE.DirectionalLight(0xffffff, 0.3);
    top.position.set(100, 800, 200);
    this.scene.add(top);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12));

    // Paper: one sheet of geometry, printed on the front and blank on the back
    this.paperGeometry = new THREE.PlaneGeometry(RECEIPT_W, RECEIPT_H, SEGMENTS_ACROSS, SEGMENTS_ALONG);
    this.paperTexture = new THREE.CanvasTexture(receipt);
    this.paperTexture.colorSpace = THREE.SRGBColorSpace;
    this.paperTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const front = new THREE.Mesh(
      this.paperGeometry,
      new THREE.MeshStandardMaterial({ map: this.paperTexture, alphaTest: 0.5, alphaToCoverage: true, roughness: 0.92, metalness: 0, side: THREE.FrontSide, envMapIntensity: 0.7 })
    );
    const back = new THREE.Mesh(
      this.paperGeometry,
      new THREE.MeshStandardMaterial({ color: 0xcfccc1, alphaTest: 0.5, alphaToCoverage: true, map: this.paperBackTexture(), roughness: 0.95, metalness: 0, side: THREE.BackSide, envMapIntensity: 0.7 })
    );
    this.overlayCanvas.width = RECEIPT_W * 2;
    this.overlayCanvas.height = RECEIPT_H * 2;
    this.overlayTexture = new THREE.CanvasTexture(this.overlayCanvas);
    this.overlayTexture.colorSpace = THREE.SRGBColorSpace;
    this.overlayMaterial = new THREE.MeshBasicMaterial({
      map: this.overlayTexture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const overlay = new THREE.Mesh(this.paperGeometry, this.overlayMaterial);
    front.castShadow = true;
    [front, back, overlay].forEach((mesh) => {
      mesh.frustumCulled = false;
      this.paperGroup.add(mesh);
    });
    this.paperGroup.visible = false;
    this.scene.add(this.paperGroup);

    this.machineGroup.visible = false;
    this.scene.add(this.machineGroup);

    this.screenCanvas.width = 640;
    this.screenCanvas.height = 1229;
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.colorSpace = THREE.SRGBColorSpace;
    this.screenTexture.anisotropy = 4;

    new GLTFLoader().load('/assets/payment_machine.glb', (gltf) => {
      if (this.disposed) return;
      this.addMachine(gltf.scene);
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  private addMachine(model: THREE.Group) {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const isDark = (child.material as THREE.Material).name.includes('003');
      child.material = new THREE.MeshStandardMaterial(
        isDark ? { color: 0x17181d, roughness: 0.36, metalness: 0.15 } : { color: 0xd9dae0, roughness: 0.48, metalness: 0.05 }
      );
      child.castShadow = true;
      child.receiveShadow = true;
    });

    // The model's display is a blank panel, so a live screen sits just above it
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN.width, SCREEN.height),
      new THREE.MeshBasicMaterial({ map: this.screenTexture, toneMapped: false })
    );
    const right = new THREE.Vector3().crossVectors(SCREEN.up, SCREEN.normal);
    screen.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, SCREEN.up, SCREEN.normal));
    // Sits clear of the blank panel, which isn't perfectly flat
    screen.position.copy(SCREEN.center).addScaledVector(SCREEN.normal, 0.09);
    model.add(screen);

    const mount = new THREE.Group();
    mount.quaternion.copy(MOUNT);
    model.position.copy(MODEL_CENTER).multiplyScalar(-1);
    mount.add(model);
    this.machineGroup.add(mount);
    this.machineGroup.visible = true;
  }

  // The back of the sheet: same torn outline as the front, with nothing printed on it
  private paperBackTexture() {
    const canvas = document.createElement('canvas');
    const source = this.options.receipt;
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(source, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /** Call after the receipt's canvas has been redrawn. */
  receiptChanged() {
    this.paperTexture.needsUpdate = true;
    this.lastScreenKey = '';
  }

  setActive(active: boolean) {
    if (active === this.active) return;
    this.active = active;
    this.options.canvas.style.visibility = active ? 'visible' : 'hidden';
    if (active) {
      this.clock.getDelta();
      this.frame = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.frame);
    }
  }

  private resize() {
    const { canvas } = this.options;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // Sets the camera so one world unit is one CSS pixel at z = 0, matching the page's layout
    this.camera.position.set(0, 0, height / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    this.camera.updateProjectionMatrix();
  }

  private tick = () => {
    if (!this.active || this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    this.update(this.clock.getElapsedTime());
    this.renderer.render(this.scene, this.camera);
  };

  private update(time: number) {
    const { machine: m, paper: p } = this.options.params;

    // The printer's shudder follows the paper, so it stops when the scrolling does
    const shudder = m.shake * Math.sin(p.printed * 620);
    this.machineGroup.position.set(m.x + shudder, -m.y, 0);
    this.machineGroup.scale.setScalar(m.pxPerUnit);
    scratchEuler.set(m.rx, m.ry, m.rz, 'XYZ');
    this.machineGroup.quaternion.setFromEuler(scratchEuler);

    this.paperGroup.visible = p.visible > 0.5 && p.printed > 0.001;
    if (this.paperGroup.visible) {
      this.shapePaper(time);
      this.poseOfPaper(shudder);
      this.overlayMaterial.opacity = p.overlay;
      this.drawOverlay();
    }
    this.drawScreen();
  }

  private poseOfPaper(shudder: number) {
    const { machine: m, paper: p } = this.options.params;
    const slot = slotOnStage(m);
    const group = this.paperGroup;

    scratchEuler.set(p.rx, p.ry, p.rz, 'XYZ');
    group.quaternion.setFromEuler(scratchEuler);
    if (p.anchored > 0) {
      const anchored = machineQuaternion(m, new THREE.Quaternion()).multiply(PAPER_IN_MODEL);
      group.quaternion.slerp(anchored, p.anchored);
    }
    group.position.set(
      THREE.MathUtils.lerp(p.x, slot.x + shudder, p.anchored),
      -THREE.MathUtils.lerp(p.y, slot.y, p.anchored),
      THREE.MathUtils.lerp(p.z, slot.z, p.anchored)
    );
    group.scale.setScalar(p.scale);
  }

  // Bends the sheet along a curve built from its bending angle, so its length never stretches
  // the way a simple sine-wave distortion would.
  private shapePaper(time: number) {
    const { paper: p } = this.options.params;
    const L = RECEIPT_H;
    const step = L / CURVE_SAMPLES;
    let y = 0;
    let z = 0;
    this.curveY[0] = 0;
    this.curveZ[0] = 0;
    for (let i = 1; i <= CURVE_SAMPLES; i++) {
      const s = (i - 0.5) / CURVE_SAMPLES;
      const angle =
        -p.bow * Math.sin(Math.PI * Math.min(1, s * 1.6)) + p.curl * Math.pow(s, 1.9) - p.tail * Math.pow(Math.max(0, 1 - s * 2.2), 2);
      y += Math.cos(angle) * step;
      z -= Math.sin(angle) * step;
      this.curveY[i] = y;
      this.curveZ[i] = z;
    }
    const center = (CURVE_SAMPLES / 2) | 0;
    const offsetY = this.curveY[center] * p.pivot;
    const offsetZ = this.curveZ[center] * p.pivot;

    const positions = this.paperGeometry.attributes.position as THREE.BufferAttribute;
    const breath = Math.sin(time * 0.9) * 1.1;
    for (let row = 0; row <= SEGMENTS_ALONG; row++) {
      // Row 0 is the top of the bill, which leaves the printer first
      const fromTop = row / SEGMENTS_ALONG;
      const s = Math.max(0, p.printed - fromTop); // how far along the curve this row has travelled
      const sample = s * CURVE_SAMPLES;
      const i0 = Math.min(CURVE_SAMPLES - 1, Math.floor(sample));
      const blend = sample - i0;
      const cy = this.curveY[i0] + (this.curveY[i0 + 1] - this.curveY[i0]) * blend - offsetY;
      const cz = this.curveZ[i0] + (this.curveZ[i0 + 1] - this.curveZ[i0]) * blend - offsetZ;
      const out = s > 0 ? Math.min(1, s * 14) : 0; // cup and twist can't show until paper is free of the slot
      const ripple = p.wave * Math.sin(s * 6.4 + 0.6) + breath * s;

      for (let col = 0; col <= SEGMENTS_ACROSS; col++) {
        const across = (col / SEGMENTS_ACROSS) * 2 - 1;
        const vertex = row * (SEGMENTS_ACROSS + 1) + col;
        const cup = p.cup * (across * across - 0.33) * out;
        const twist = p.twist * across * s * s;
        positions.setXYZ(vertex, (across * RECEIPT_W) / 2, cy, cz + cup + twist + ripple);
      }
    }
    positions.needsUpdate = true;
    this.paperGeometry.computeVertexNormals();
  }

  // The OCR's marks are kept off the bill itself, on a layer that bends with the paper
  private drawOverlay() {
    const sweep = this.options.getSweep();
    if (sweep === this.lastSweep) return;
    this.lastSweep = sweep;

    const ctx = this.overlayCanvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, RECEIPT_W, RECEIPT_H);

    OCR_ROWS.forEach((rowY, i) => {
      const seen = Math.max(0, Math.min(1, (sweep - rowY / RECEIPT_H) * 22));
      if (seen <= 0) return;
      const isTotal = i === OCR_ROWS.length - 1;
      ctx.globalAlpha = seen;
      ctx.beginPath();
      ctx.roundRect(10, rowY - (isTotal ? 17 : 13), RECEIPT_W - 20, isTotal ? 24 : 18, 4);
      ctx.fillStyle = 'rgba(99,102,241,0.16)';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    if (sweep > 0 && sweep < 1) {
      const y = sweep * RECEIPT_H;
      const trail = ctx.createLinearGradient(0, y - 64, 0, y);
      trail.addColorStop(0, 'rgba(99,102,241,0)');
      trail.addColorStop(1, 'rgba(99,102,241,0.34)');
      ctx.fillStyle = trail;
      ctx.fillRect(0, y - 64, RECEIPT_W, 64);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(0, y - 1, RECEIPT_W, 2);
    }
    this.overlayTexture.needsUpdate = true;
  }

  // The machine's own display, showing the bill and its printing progress
  private drawScreen() {
    const printed = this.options.params.paper.printed;
    const key = `${Math.round(printed * 40)}|${this.options.getFont()}`;
    if (key === this.lastScreenKey) return;
    this.lastScreenKey = key;

    const ctx = this.screenCanvas.getContext('2d');
    if (!ctx) return;
    const W = this.screenCanvas.width;
    const H = this.screenCanvas.height;
    const font = this.options.getFont();
    const done = printed >= 0.995;

    const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0, '#20225a');
    bg.addColorStop(0.55, '#10112b');
    bg.addColorStop(1, '#090a18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 44px ${font}`;
    ctx.fillText(BILL.splitName, 52, 110);
    ctx.fillStyle = '#9b9dc4';
    ctx.font = `400 30px ${font}`;
    ctx.fillText('Table 12  ·  4 guests', 52, 158);

    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.roundRect(40, 212, W - 80, 250, 32);
    ctx.fill();
    ctx.fillStyle = '#a5a7ff';
    ctx.font = `600 28px ${font}`;
    ctx.fillText('TOTAL DUE', 76, 282);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 76px ${font}`;
    ctx.fillText(inr(BILL.total), 76, 392);

    BILL.items.forEach((item, i) => {
      const y = 540 + i * 62;
      ctx.fillStyle = '#d6d7ea';
      ctx.font = `400 30px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText(item.name, 52, y);
      ctx.textAlign = 'right';
      ctx.fillText(inr(item.amount, 0), W - 52, y);
    });
    ctx.textAlign = 'left';

    const barY = H - 150;
    ctx.fillStyle = done ? '#34d399' : '#ffffff';
    ctx.font = `600 34px ${font}`;
    ctx.fillText(done ? 'Bill printed' : 'Printing bill…', 52, barY - 28);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(52, barY, W - 104, 16, 8);
    ctx.fill();
    ctx.fillStyle = done ? '#34d399' : '#6366f1';
    ctx.beginPath();
    ctx.roundRect(52, barY, Math.max(16, (W - 104) * printed), 16, 8);
    ctx.fill();

    this.screenTexture.needsUpdate = true;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.paperGeometry.dispose();
    this.paperTexture.dispose();
    this.overlayTexture.dispose();
    this.screenTexture.dispose();
    this.scene.environment?.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const material = object.material as THREE.Material;
        material.dispose();
      }
    });
    this.renderer.dispose();
  }
}
