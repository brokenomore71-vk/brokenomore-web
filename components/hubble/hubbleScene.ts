import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  HUB,
  FEATURED_BRANDS,
  MATRIX_BRANDS,
  PRIMARY_GIFT,
  type HubbleFrame,
  type ScreenPoint,
  type PartnerBrand,
} from './hubbleData';

// Geometry constants for luxury fintech proportions
const CARD = { w: 0.72, h: 0.46, t: 0.022, r: 0.045 };
const VOUCHER = { w: 0.98, h: 0.58, t: 0.024, r: 0.05 };
const SLOT = new THREE.Vector3(0, 0.78, 0);

// 400+ Matrix layout (8 cols x 5 rows = 40 hero visible tiles)
const GRID = { cols: 8, rows: 5, dx: 0.88, dy: 0.58, curvature: 0.16 };
const GRID_COUNT = GRID.cols * GRID.rows;

// Particle count for liquidity / bank transfer flow
const PARTICLES = 580;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Helper to generate high-DPI canvas textures with anisotropic filtering
function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Rounded rectangle helper
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Hubble's signature brand mark: slanted pill beside a circular dot
function drawHubbleMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.36;

  // Slanted pill
  ctx.beginPath();
  ctx.moveTo(-size * 0.44, size * 0.32);
  ctx.lineTo(-size * 0.08, -size * 0.32);
  ctx.stroke();

  // Dot
  ctx.beginPath();
  ctx.arc(size * 0.34, size * 0.3, size * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Matte-black ceramic surface with ultra-fine brushed noise and metallic bevel border
function drawCeramicCardBase(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Rich deep black to charcoal gradient
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#090909');
  g.addColorStop(0.5, '#121212');
  g.addColorStop(1, '#0c0c0c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Micro ceramic texture grain
  for (let i = 0; i < 950; i++) {
    const alpha = Math.random() * 0.035;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
  }

  // Precision-beveled metallic frame line
  ctx.strokeStyle = 'rgba(245,245,245,0.45)';
  ctx.lineWidth = 2.5;
  roundedRect(ctx, 12, 12, w - 24, h - 24, 22);
  ctx.stroke();

  // Subtle interior hairline
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  roundedRect(ctx, 16, 16, w - 32, h - 32, 18);
  ctx.stroke();
}

// Security EMV chip drawing in brushed silver/platinum
function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, w = 68, h = 50) {
  ctx.save();
  ctx.translate(x, y);

  const cg = ctx.createLinearGradient(0, 0, w, h);
  cg.addColorStop(0, '#dcdcdc');
  cg.addColorStop(0.35, '#8c8c8c');
  cg.addColorStop(0.7, '#efefef');
  cg.addColorStop(1, '#a6a6a6');
  ctx.fillStyle = cg;
  roundedRect(ctx, 0, 0, w, h, 6);
  ctx.fill();

  ctx.strokeStyle = 'rgba(20,20,20,0.85)';
  ctx.lineWidth = 1.2;
  // Chip circuit lines
  ctx.beginPath();
  ctx.moveTo(w * 0.33, 0);
  ctx.lineTo(w * 0.33, h);
  ctx.moveTo(w * 0.66, 0);
  ctx.lineTo(w * 0.66, h);
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w * 0.33, h * 0.5);
  ctx.moveTo(w * 0.66, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();

  roundedRect(ctx, w * 0.38, h * 0.28, w * 0.24, h * 0.44, 3);
  ctx.stroke();
  ctx.restore();
}

// High-fidelity laser-etched partner brand textures
function createBrandCardTexture(brand: PartnerBrand) {
  return canvasTexture(600, 380, (ctx) => {
    drawCeramicCardBase(ctx, 600, 380);

    // Hubble co-branding header
    drawHubbleMark(ctx, 42, 42, 24, '#F5F5F5');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#A3A3A3';
    ctx.font = '600 16px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('HUBBLE  ·  INSTANT SAVINGS', 68, 42);

    // EMV metallic chip
    drawChip(ctx, 40, 78, 64, 46);

    // Category / Discount pill badge in top right
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundedRect(ctx, 420, 24, 145, 34, 17);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 15px "SF Pro Display", -apple-system, sans-serif';
    ctx.fillText(brand.discount, 550, 41);

    // Brand specific laser-etched logo drawing
    ctx.textAlign = 'center';
    const cx = 300;
    const cy = 200;

    switch (brand.id) {
      case 'amazon': {
        // Crisp lowercase "amazon"
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 76px "SF Pro Display", "Helvetica Neue", sans-serif';
        ctx.fillText('amazon', cx, cy - 8);

        // Signature Amazon curved smile arrow
        ctx.strokeStyle = '#F5F5F5';
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const startX = cx - 100;
        const startY = cy + 32;
        const endX = cx + 80;
        const endY = cy + 24;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cx - 10, cy + 54, endX, endY);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = '#F5F5F5';
        ctx.beginPath();
        ctx.moveTo(endX - 4, endY - 12);
        ctx.lineTo(endX + 16, endY - 2);
        ctx.lineTo(endX + 2, endY + 12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#A3A3A3';
        ctx.font = '600 17px "SF Pro Display", sans-serif';
        ctx.fillText('SHOPPING VOUCHER', cx, cy + 68);
        break;
      }

      case 'reliance': {
        // "Reliance" in soft white
        ctx.fillStyle = '#F5F5F5';
        ctx.font = '600 36px "SF Pro Display", sans-serif';
        ctx.fillText('Reliance', cx, cy - 36);

        // Bold "SMART" capsule
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px "SF Pro Display", "Arial Black", sans-serif';
        ctx.fillText('SMART', cx, cy + 20);

        ctx.fillStyle = '#A3A3A3';
        ctx.font = '600 17px "SF Pro Display", sans-serif';
        ctx.fillText('SUPERSTORE & GROCERY', cx, cy + 68);
        break;
      }

      case 'pvr': {
        // "PVR INOX" cinematic letterspaced logo
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 64px "SF Pro Display", sans-serif';
        ctx.fillText('PVR  •  INOX', cx, cy - 4);

        ctx.fillStyle = '#A3A3A3';
        ctx.font = '600 17px "SF Pro Display", sans-serif';
        ctx.fillText('CINEMAS & EXPERIENCES', cx, cy + 56);
        break;
      }

      case 'cleartrip': {
        // Cleartrip flight tick + lowercase logo
        ctx.save();
        ctx.translate(cx - 140, cy - 22);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 32);
        ctx.lineTo(44, 0);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.font = '800 58px "SF Pro Display", sans-serif';
        ctx.fillText('cleartrip', cx - 75, cy);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#A3A3A3';
        ctx.font = '600 17px "SF Pro Display", sans-serif';
        ctx.fillText('FLIGHTS & HOTELS', cx, cy + 60);
        break;
      }

      case 'ikea': {
        // Iconic IKEA oval outline and block letters
        ctx.fillStyle = '#181818';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 140, 56, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F5F5F5';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px "Arial Black", sans-serif';
        ctx.fillText('IKEA', cx, cy + 2);

        ctx.fillStyle = '#A3A3A3';
        ctx.font = '600 17px "SF Pro Display", sans-serif';
        ctx.fillText('HOME FURNISHINGS', cx, cy + 74);
        break;
      }

      case 'timesprime': {
        // Crown icon + TIMES PRIME
        ctx.save();
        ctx.translate(cx, cy - 42);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-32, 16);
        ctx.lineTo(-40, -12);
        ctx.lineTo(-16, 0);
        ctx.lineTo(0, -20);
        ctx.lineTo(16, 0);
        ctx.lineTo(40, -12);
        ctx.lineTo(32, 16);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#F5F5F5';
        ctx.font = '700 32px "SF Pro Display", serif';
        ctx.fillText('TIMES', cx, cy + 6);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 48px "SF Pro Display", sans-serif';
        ctx.fillText('PRIME', cx, cy + 44);
        break;
      }

      default: {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 52px "SF Pro Display", sans-serif';
        ctx.fillText(brand.name, cx, cy - 4);

        ctx.fillStyle = '#A3A3A3';
        ctx.font = '600 17px "SF Pro Display", sans-serif';
        ctx.fillText(brand.sub, cx, cy + 54);
        break;
      }
    }

    // Bottom micro-details
    ctx.textAlign = 'left';
    ctx.fillStyle = '#737373';
    ctx.font = '500 15px "Courier New", monospace';
    ctx.fillText('•••• 8492', 42, 342);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#A3A3A3';
    ctx.font = '600 15px "SF Pro Display", sans-serif';
    ctx.fillText('PREMIUM GIFT CARD', 558, 342);
  });
}

// Scene 5: Active digital voucher texture with high-density barcode and redemption code
function createActiveVoucherTexture() {
  return canvasTexture(700, 420, (ctx) => {
    drawCeramicCardBase(ctx, 700, 420);

    // Hubble voucher badge
    drawHubbleMark(ctx, 50, 48, 28, '#FFFFFF');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#A3A3A3';
    ctx.font = '600 18px "SF Pro Display", sans-serif';
    ctx.fillText('HUBBLE  ·  INSTANT VOUCHER DEPLOYMENT', 84, 48);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px "SF Pro Display", sans-serif';
    ctx.fillText('✓ VERIFIED & ACTIVE', 650, 48);

    // Brand and Value header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 56px "SF Pro Display", sans-serif';
    ctx.fillText(PRIMARY_GIFT.brand, 48, 126);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 54px "SF Pro Display", sans-serif';
    ctx.fillText(`₹${PRIMARY_GIFT.balance.toLocaleString('en-IN')}`, 650, 126);

    // Barcode container (pure white background with crisp dark bars)
    ctx.fillStyle = '#FFFFFF';
    roundedRect(ctx, 48, 178, 604, 110, 8);
    ctx.fill();

    // High-fidelity barcode pattern
    let seed = 42;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let bx = 72;
    ctx.fillStyle = '#050505';

    // Left guard bars
    ctx.fillRect(bx, 192, 3.5, 82);
    bx += 6;
    ctx.fillRect(bx, 192, 3.5, 82);
    bx += 12;

    while (bx < 610) {
      const bw = 2.5 + Math.floor(rand() * 4.5);
      if (rand() > 0.32) {
        ctx.fillRect(bx, 192, bw, 82);
      }
      bx += bw + 2.5 + Math.floor(rand() * 4);
    }

    // Right guard bars
    ctx.fillRect(626, 192, 3.5, 82);
    ctx.fillRect(632, 192, 3.5, 82);

    // Security redemption code & instructions
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F5F5F5';
    ctx.font = '700 24px "Courier New", monospace';
    ctx.fillText(`CODE: ${PRIMARY_GIFT.code}`, 48, 332);

    ctx.fillStyle = '#A3A3A3';
    ctx.font = '500 16px "SF Pro Display", sans-serif';
    ctx.fillText(PRIMARY_GIFT.validity, 48, 372);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#737373';
    ctx.font = '500 15px "SF Pro Display", sans-serif';
    ctx.fillText(PRIMARY_GIFT.expiry, 650, 372);
  });
}

// Fine horizontal anisotropic grain texture for brushed titanium edges
function createBrushedMetalTexture() {
  const texture = canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#909090';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) {
      const shade = 110 + Math.floor(Math.random() * 75);
      ctx.strokeStyle = `rgba(${shade},${shade},${shade},0.45)`;
      ctx.lineWidth = Math.random() * 1.3 + 0.3;
      const y = Math.random() * 512;
      const x = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 50 + Math.random() * 260, y);
      ctx.stroke();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Extruded card geometry with proper UV mapping for front and back faces
function createCardGeometry(w: number, h: number, t: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: t,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.006,
    bevelThickness: 0.006,
    curveSegments: 12,
  });
  geom.translate(0, 0, -t / 2);

  // Map UVs cleanly across front and back faces
  const p = geom.attributes.position as THREE.BufferAttribute;
  const uv = geom.attributes.uv as THREE.BufferAttribute;
  const normal = geom.attributes.normal as THREE.BufferAttribute;

  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / w + 0.5;
    const v = p.getY(i) / h + 0.5;
    uv.setXY(i, normal.getZ(i) < -0.5 ? 1 - u : u, v);
  }
  return geom;
}

// Studio lighting environment setup
function createStudioEnvironment() {
  const scene = new THREE.Scene();
  const disposables: { dispose: () => void }[] = [];

  const roomGeom = new THREE.BoxGeometry(26, 26, 26);
  const roomMat = new THREE.MeshBasicMaterial({ color: '#030303', side: THREE.BackSide });
  scene.add(new THREE.Mesh(roomGeom, roomMat));
  disposables.push(roomGeom, roomMat);

  const softbox = (w: number, h: number, intensity: number, color: string, x: number, y: number, z: number) => {
    const geom = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(geom, mat);
  };

  softbox(12, 7, 3.4, '#ffffff', 0, 11, 2); // Overhead main softbox
  softbox(2.4, 13, 7.5, '#ffffff', -11, 1, 3); // Left key strip
  softbox(1.8, 11, 5.0, '#f5f5f5', 11, 0, -2); // Right rim strip
  softbox(8, 3, 2.4, '#ffffff', 0, 2, 11); // Front soft fill
  softbox(9, 3.5, 2.8, '#e8e8e8', 2, 4, -11); // Back rim light
  softbox(16, 5, 0.2, '#333333', 0, -11, 0); // Floor reflection

  return { scene, dispose: () => disposables.forEach((d) => d.dispose()) };
}

// ₹ Glyph particle distribution for Scene 6 liquidity conversion
function generateRupeePoints(count: number) {
  const size = 180;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 150px "SF Pro Display", "Helvetica Neue", sans-serif';
  ctx.fillText('₹', size / 2, size / 2 + 8);

  const data = ctx.getImageData(0, 0, size, size).data;
  const filled: [number, number][] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * 4 + 3] > 130) {
        filled.push([x / size - 0.5, 0.5 - y / size]);
      }
    }
  }

  const points: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    if (filled.length) {
      const [px, py] = filled[Math.floor(Math.random() * filled.length)];
      points.push(new THREE.Vector3(px * 1.5, py * 1.5, 0));
    } else {
      const a = (i / count) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0));
    }
  }
  return points;
}

export class HubbleScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  private width = 1;
  private height = 1;
  private disposables: { dispose: () => void }[] = [];

  // Terminal hero components
  private terminal = new THREE.Group();
  private terminalBody = new THREE.Group();
  private titaniumMat!: THREE.MeshPhysicalMaterial;
  private frameMat!: THREE.MeshPhysicalMaterial;
  private statusLightMat!: THREE.MeshStandardMaterial;
  private terminalFloor!: THREE.Mesh;
  private terminalDisplay!: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; currentKey: string };
  private slotRipple!: THREE.Mesh;
  private sheenLight!: THREE.PointLight;

  // 400+ Matrix Brand Grid components
  private brandGrid = new THREE.Group();
  private gridTiles: {
    mesh: THREE.Mesh;
    materials: THREE.MeshPhysicalMaterial[];
    homePos: THREE.Vector3;
    homeRot: THREE.Euler;
    delay: number;
  }[] = [];

  // 6 Featured Partner Cards (docking and orbiting)
  private featuredCards: {
    group: THREE.Group;
    mesh: THREE.Mesh;
    brand: PartnerBrand;
    materials: THREE.MeshPhysicalMaterial[];
  }[] = [];

  // Scene 4 & 5: Primary Focus Gift Card & Active Digital Voucher
  private primaryCardGroup = new THREE.Group();
  private primaryCardMesh!: THREE.Mesh;
  private activeVoucherMesh!: THREE.Mesh;
  private primaryCardMaterials: THREE.MeshPhysicalMaterial[] = [];
  private voucherMaterials: THREE.MeshPhysicalMaterial[] = [];

  // Scene 6: Payout particle system
  private particleSystem!: THREE.Points;
  private particleStarts: THREE.Vector3[] = [];
  private particleRupeeTargets: THREE.Vector3[] = generateRupeePoints(PARTICLES);
  private particleJitters = Array.from({ length: PARTICLES }, () => ({
    delay: Math.random() * 0.28,
    lift: 0.25 + Math.random() * 0.8,
    swirl: (Math.random() - 0.5) * 1.5,
  }));

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Generate HDR studio environment reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const studio = createStudioEnvironment();
    const envMap = pmrem.fromScene(studio.scene, 0.02).texture;
    this.scene.environment = envMap;
    studio.dispose();
    pmrem.dispose();
    this.disposables.push(envMap);

    // Studio directional & ambient lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(-4.5, 7, 6.5);
    const rimLight = new THREE.DirectionalLight(0xf2f2f2, 2.0);
    rimLight.position.set(5.5, 3.5, -5);
    const underFill = new THREE.DirectionalLight(0x333333, 0.35);
    underFill.position.set(0, -5, 3);
    this.sheenLight = new THREE.PointLight(0xffffff, 0, 0, 1.8);
    this.scene.add(keyLight, rimLight, underFill, this.sheenLight);

    // Common materials
    const brushedMetal = createBrushedMetalTexture();
    this.disposables.push(brushedMetal);

    this.titaniumMat = new THREE.MeshPhysicalMaterial({
      color: '#141414',
      metalness: 0.95,
      roughness: 0.42,
      bumpMap: brushedMetal,
      bumpScale: 0.5,
      clearcoat: 0.15,
      clearcoatRoughness: 0.38,
      envMapIntensity: 1.25,
    });
    this.frameMat = new THREE.MeshPhysicalMaterial({
      color: '#cccccc',
      metalness: 1.0,
      roughness: 0.28,
      bumpMap: brushedMetal,
      bumpScale: 0.35,
      clearcoat: 0.2,
      envMapIntensity: 1.4,
    });
    this.statusLightMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 0.45,
      roughness: 0.2,
    });
    this.disposables.push(this.titaniumMat, this.frameMat, this.statusLightMat);

    // Build 3D structures
    this.buildTerminal();
    this.buildBrandMatrix();
    this.buildFeaturedCards();
    this.buildPrimaryFocusCard();
    this.buildParticleSystem();
  }

  // Build the central fintech activation terminal
  private buildTerminal() {
    const X = 0.64; // depth
    const Y = 1.54; // height
    const Z = 2.16; // width
    const front = X / 2;

    const addMesh = (geom: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], setup?: (m: THREE.Mesh) => void) => {
      const mesh = new THREE.Mesh(geom, mat);
      if (setup) setup(mesh);
      this.terminalBody.add(mesh);
      this.disposables.push(geom);
      return mesh;
    };

    // Main brushed titanium housing & inner ceramic block
    addMesh(new RoundedBoxGeometry(X, Y, Z, 6, 0.12), this.frameMat);
    addMesh(
      new RoundedBoxGeometry(X + 0.02, Y - 0.08, Z - 0.08, 6, 0.1),
      new THREE.MeshPhysicalMaterial({
        color: '#0a0a0a',
        metalness: 0.2,
        roughness: 0.65,
        clearcoat: 0.25,
      })
    );

    // Front OLED display screen
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.terminalDisplay = { canvas, texture, currentKey: '' };
    this.disposables.push(texture);

    const screenMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    this.disposables.push(screenMat);

    const screenW = Z - 0.52;
    const screenH = screenW * (360 / 640);
    addMesh(new THREE.PlaneGeometry(screenW, screenH), screenMat, (m) => {
      m.rotation.y = Math.PI / 2;
      m.position.set(front + 0.016, 0.08, 0);
    });

    // Precision screen bezel
    addMesh(new RoundedBoxGeometry(0.02, screenH + 0.08, screenW + 0.08, 3, 0.01), this.frameMat, (m) =>
      m.position.set(front + 0.005, 0.08, 0)
    );

    // Status runner light under screen
    addMesh(new RoundedBoxGeometry(0.014, 0.014, 0.48, 2, 0.005), this.statusLightMat, (m) =>
      m.position.set(front + 0.014, -0.58, 0)
    );

    // Precision Card Slot on top
    const slotLipMat = this.frameMat;
    const slotInteriorMat = new THREE.MeshStandardMaterial({ color: '#000000', metalness: 0.6, roughness: 0.8 });
    this.disposables.push(slotInteriorMat);

    addMesh(new RoundedBoxGeometry(0.24, 0.05, CARD.w + 0.24, 4, 0.02), slotLipMat, (m) => m.position.copy(SLOT));
    addMesh(new RoundedBoxGeometry(0.065, 0.065, CARD.w + 0.07, 4, 0.025), slotInteriorMat, (m) =>
      m.position.copy(SLOT).add(new THREE.Vector3(0, 0.01, 0))
    );

    // Weighted base pedestal
    addMesh(new RoundedBoxGeometry(X + 0.32, 0.1, Z + 0.14, 4, 0.04), this.frameMat, (m) =>
      m.position.set(0, -Y / 2 - 0.08, 0)
    );

    // Soft contact shadow under the terminal
    const shadowTex = canvasTexture(256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(0,0,0,0.92)');
      g.addColorStop(0.35, 'rgba(0,0,0,0.38)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.015)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    });
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    this.terminalFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.4), shadowMat);
    this.terminalFloor.rotation.x = -Math.PI / 2;
    this.terminalFloor.position.y = -Y / 2 - 0.12;
    this.terminal.add(this.terminalFloor);
    this.disposables.push(shadowTex, shadowMat, this.terminalFloor.geometry);

    // Card docking confirmation light ripple
    const rippleTex = canvasTexture(256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.75, 'rgba(255,255,255,0)');
      g.addColorStop(0.88, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    });
    const rippleMat = new THREE.MeshBasicMaterial({
      map: rippleTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.slotRipple = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), rippleMat);
    this.slotRipple.rotation.x = -Math.PI / 2;
    this.slotRipple.position.copy(SLOT).add(new THREE.Vector3(0, 0.035, 0));
    this.terminalBody.add(this.slotRipple);
    this.disposables.push(rippleTex, rippleMat, this.slotRipple.geometry);

    this.terminal.add(this.terminalBody);
    this.scene.add(this.terminal);

    this.updateTerminalDisplay(0, false, 0);
  }

  // Draw the terminal's OLED screen readouts
  private updateTerminalDisplay(dockedCount: number, unlocked: boolean, savingsProgress: number) {
    const key = `${dockedCount}_${unlocked}_${savingsProgress.toFixed(2)}`;
    if (this.terminalDisplay.currentKey === key) return;
    this.terminalDisplay.currentKey = key;

    const ctx = this.terminalDisplay.canvas.getContext('2d')!;
    const w = 640;
    const h = 360;

    // Deep black background with fine scanlines
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0c0c0c');
    bg.addColorStop(1, '#050505');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle scanlines
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }

    // Terminal header
    drawHubbleMark(ctx, 48, 48, 28, '#FFFFFF');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#A3A3A3';
    ctx.font = '600 18px "SF Pro Display", sans-serif';
    ctx.fillText('HUBBLE  ·  GIFT CARD ACTIVATION TERMINAL', 84, 48);

    if (savingsProgress > 0) {
      // Scene 3 Savings Summary Mode
      ctx.fillStyle = '#F5F5F5';
      ctx.font = '700 84px "SF Pro Display", sans-serif';
      const savingsCr = Math.round(10 * savingsProgress);
      ctx.fillText(`₹${savingsCr}Cr+`, 44, 160);

      ctx.fillStyle = '#A3A3A3';
      ctx.font = '500 24px "SF Pro Display", sans-serif';
      ctx.fillText('SAVED TILL DATE', 44, 225);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 20px "SF Pro Display", sans-serif';
      ctx.fillText('● 400+ BRAND CHANNELS ACTIVE', 44, 290);
    } else {
      // Docking counter mode
      ctx.fillStyle = '#F5F5F5';
      ctx.font = '800 112px "SF Pro Display", sans-serif';
      ctx.fillText(String(dockedCount), 44, 172);

      const numW = ctx.measureText(String(dockedCount)).width;
      ctx.fillStyle = '#A3A3A3';
      ctx.font = '500 28px "SF Pro Display", sans-serif';
      ctx.fillText(dockedCount === 1 ? 'card docked' : 'cards docked', 58 + numW, 192);

      ctx.fillStyle = unlocked ? '#FFFFFF' : '#737373';
      ctx.font = '700 22px "SF Pro Display", sans-serif';
      ctx.fillText(unlocked ? '✓  UNLOCKED  ·  ZERO WAITING PERIOD' : 'INSERT A PARTNER GIFT CARD', 44, 295);
    }

    this.terminalDisplay.texture.needsUpdate = true;
  }

  // Build the 400+ architectural matrix brand grid (Scene 1)
  private buildBrandMatrix() {
    const cardGeom = createCardGeometry(CARD.w, CARD.h, CARD.t, CARD.r);
    this.disposables.push(cardGeom);

    // Cache textures for matrix brands
    const textures = MATRIX_BRANDS.map((b) => createBrandCardTexture(b));
    this.disposables.push(...textures);

    const edgeMat = this.frameMat;

    for (let i = 0; i < GRID_COUNT; i++) {
      const col = i % GRID.cols;
      const row = Math.floor(i / GRID.cols);
      const tex = textures[i % textures.length];

      const faceMat = new THREE.MeshPhysicalMaterial({
        map: tex,
        emissive: '#ffffff',
        emissiveMap: tex,
        emissiveIntensity: 0.28,
        metalness: 0.15,
        roughness: 0.52,
        clearcoat: 0.2,
        envMapIntensity: 0.85,
        transparent: true,
      });
      this.disposables.push(faceMat);

      const mesh = new THREE.Mesh(cardGeom, [faceMat, edgeMat]);

      // Cylindrical amphitheatre curvature
      const colNorm = (col - (GRID.cols - 1) / 2) / (GRID.cols / 2);
      const rowNorm = (row - (GRID.rows - 1) / 2) / (GRID.rows / 2);

      const x = (col - (GRID.cols - 1) / 2) * GRID.dx;
      const y = -rowNorm * (GRID.rows * GRID.dy * 0.42);
      const z = -Math.cos(colNorm * 0.8) * 0.45;

      const homePos = new THREE.Vector3(x, y, z);
      const homeRot = new THREE.Euler(rowNorm * 0.08, -colNorm * 0.22, 0);

      mesh.position.copy(homePos);
      mesh.rotation.copy(homeRot);

      this.brandGrid.add(mesh);

      const dist = Math.hypot(colNorm, rowNorm);
      this.gridTiles.push({
        mesh,
        materials: [faceMat, edgeMat],
        homePos,
        homeRot,
        delay: Math.min(0.35, dist * 0.25),
      });
    }

    this.scene.add(this.brandGrid);
  }

  // Build the 6 featured 3D partner cards (Scene 2 & 3)
  private buildFeaturedCards() {
    const cardGeom = createCardGeometry(CARD.w, CARD.h, CARD.t, CARD.r);
    // Align face with slot coordinate frame (facing X)
    cardGeom.rotateY(Math.PI / 2);
    this.disposables.push(cardGeom);

    FEATURED_BRANDS.forEach((brand) => {
      const tex = createBrandCardTexture(brand);
      this.disposables.push(tex);

      const faceMat = new THREE.MeshPhysicalMaterial({
        map: tex,
        emissive: '#ffffff',
        emissiveMap: tex,
        emissiveIntensity: 0.32,
        metalness: 0.12,
        roughness: 0.5,
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
        envMapIntensity: 0.9,
        transparent: true,
      });
      const edgeMat = this.frameMat;
      this.disposables.push(faceMat);

      const mesh = new THREE.Mesh(cardGeom, [faceMat, edgeMat]);
      const group = new THREE.Group();
      group.add(mesh);
      group.visible = false;
      this.scene.add(group);

      this.featuredCards.push({
        group,
        mesh,
        brand,
        materials: [faceMat, edgeMat],
      });
    });
  }

  // Build the primary focus card (Scene 4) and active digital voucher (Scene 5)
  private buildPrimaryFocusCard() {
    // 1. Primary Card (Front face Amazon, back face tactile action buttons)
    const cardGeom = createCardGeometry(VOUCHER.w, VOUCHER.h, VOUCHER.t, VOUCHER.r);
    this.disposables.push(cardGeom);

    const cardTex = createBrandCardTexture(FEATURED_BRANDS[1]); // Amazon
    this.disposables.push(cardTex);

    const cardFaceMat = new THREE.MeshPhysicalMaterial({
      map: cardTex,
      emissive: '#ffffff',
      emissiveMap: cardTex,
      emissiveIntensity: 0.3,
      metalness: 0.12,
      roughness: 0.52,
      clearcoat: 0.28,
      envMapIntensity: 0.9,
      transparent: true,
    });
    this.primaryCardMaterials = [cardFaceMat, this.frameMat];
    this.disposables.push(cardFaceMat);

    this.primaryCardMesh = new THREE.Mesh(cardGeom, [cardFaceMat, this.frameMat]);
    this.primaryCardGroup.add(this.primaryCardMesh);

    // 2. Active Digital Voucher (Scene 5)
    const voucherTex = createActiveVoucherTexture();
    this.disposables.push(voucherTex);

    const voucherFaceMat = new THREE.MeshPhysicalMaterial({
      map: voucherTex,
      emissive: '#ffffff',
      emissiveMap: voucherTex,
      emissiveIntensity: 0.36,
      metalness: 0.1,
      roughness: 0.45,
      clearcoat: 0.35,
      envMapIntensity: 1.0,
      transparent: true,
    });
    this.voucherMaterials = [voucherFaceMat, this.frameMat];
    this.disposables.push(voucherFaceMat);

    const voucherGeom = createCardGeometry(VOUCHER.w, VOUCHER.h, VOUCHER.t, VOUCHER.r);
    this.disposables.push(voucherGeom);

    this.activeVoucherMesh = new THREE.Mesh(voucherGeom, [voucherFaceMat, this.frameMat]);
    this.activeVoucherMesh.visible = false;
    this.primaryCardGroup.add(this.activeVoucherMesh);

    this.primaryCardGroup.visible = false;
    this.scene.add(this.primaryCardGroup);
  }

  // Build the monetary conversion particle system (Scene 6)
  private buildParticleSystem() {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLES * 3);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const sprite = canvasTexture(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(245,245,245,0.85)');
      g.addColorStop(0.8, 'rgba(220,220,220,0.3)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      map: sprite,
      color: '#ffffff',
      transparent: true,
      depthWrite: false,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.disposables.push(geom, sprite, mat);

    this.particleSystem = new THREE.Points(geom, mat);
    this.particleSystem.visible = false;
    this.particleSystem.frustumCulled = false;
    this.scene.add(this.particleSystem);

    // Initial random distribution across voucher surface
    for (let i = 0; i < PARTICLES; i++) {
      this.particleStarts.push(
        new THREE.Vector3((Math.random() - 0.5) * VOUCHER.w, (Math.random() - 0.5) * VOUCHER.h, 0)
      );
    }
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

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

  render(f: HubbleFrame) {
    const W = this.width;
    const H = this.height;
    const cam = this.camera;

    // Smooth camera positioning
    cam.position.set(0, f.cam.y, f.cam.z);
    cam.lookAt(0, f.cam.y * 0.35, 0);
    cam.updateMatrixWorld();

    const visibleWidth = 2 * Math.tan((cam.fov * Math.PI) / 360) * f.cam.z * cam.aspect;
    const fit = Math.min(1, visibleWidth / 6.2);

    // 1. Positioning the hero activation terminal
    const terminalScale = Math.max(0.001, f.terminal.scale * fit);
    this.toWorld({ x: f.terminal.sx * W, y: f.terminal.sy * H }, f.terminal.z, this.terminal.position);
    this.terminal.scale.setScalar(terminalScale);
    this.terminal.rotation.set(0.06, f.terminal.rotY, 0);

    // Terminal mechanical snap recoil & pulse
    let pulse = 0;
    let dockedCount = 0;
    let lastLandingTime = -Infinity;

    f.landings.forEach((at) => {
      const tau = f.time - at;
      if (tau > 0) {
        pulse += Math.exp(-9 * tau) * Math.cos(24 * tau);
        dockedCount++;
        lastLandingTime = Math.max(lastLandingTime, at);
      }
    });

    this.terminalBody.position.y = -0.018 * Math.max(0, pulse);
    const sinceDock = f.time - lastLandingTime;
    const flash = sinceDock > 0 ? 1.8 * Math.exp(-3.2 * sinceDock) : 0;
    this.statusLightMat.emissiveIntensity = 0.35 + flash;

    const returnedCount = f.featuredReturn.filter((r) => r >= 1).length;
    const activeDocked = Math.max(0, dockedCount - returnedCount);

    this.updateTerminalDisplay(activeDocked, sinceDock > 0 && sinceDock < 1.6, f.count);

    // Slot light ripple upon card insertion
    const tauRipple = f.time - lastLandingTime;
    const uRipple = seg(tauRipple, 0, 0.75);
    (this.slotRipple.material as THREE.MeshBasicMaterial).opacity =
      tauRipple > 0 && uRipple < 1 ? (1 - uRipple) * 0.45 : 0;
    this.slotRipple.scale.setScalar(0.4 + 2.0 * smooth(uRipple));

    // Specular sheen light sweep
    this.sheenLight.intensity = f.sheen > -1 && f.sheen < 1 ? 55 * Math.sin(Math.PI * (f.sheen + 1) * 0.5) : 0;
    this.sheenLight.position.set(
      this.terminal.position.x + f.sheen * 4.5,
      this.terminal.position.y + 1.8,
      this.terminal.position.z + 2.8
    );

    // 2. Animate 400+ Matrix Brand Grid (Scene 1 & Scene 7)
    const gridScale = fit * 1.08;
    this.brandGrid.position.set(
      this.terminal.position.x,
      this.terminal.position.y + 0.3 * fit,
      this.terminal.position.z - 1.2
    );
    this.brandGrid.scale.setScalar(gridScale);

    // Horizontal axis rotation and wave motion
    this.brandGrid.rotation.set(f.grid.tilt, Math.sin(f.grid.tilt * 2) * 0.1, 0);
    this.brandGrid.updateMatrixWorld(true);

    const gridInverse = this.brandGrid.matrixWorld.clone().invert();
    this.terminal.updateMatrixWorld(true);
    const slotInGrid = this.terminalBody.localToWorld(SLOT.clone()).applyMatrix4(gridInverse);

    const backProgress = smooth(f.grid.back);
    const revealProgress = smooth(f.grid.reveal);
    this.brandGrid.visible = f.grid.converge < 1 || backProgress > 0 || revealProgress > 0;

    this.gridTiles.forEach((tile) => {
      const convergeK = smooth(seg(f.grid.converge, tile.delay, tile.delay + 0.65)) * (1 - backProgress);

      // Subtle wave hover in idle
      const wave = Math.sin(f.time * 0.6 + tile.homePos.x * 1.2) * 0.04 * (1 - convergeK);

      tile.mesh.position.copy(tile.homePos);
      tile.mesh.position.y += wave;
      tile.mesh.position.lerp(slotInGrid, convergeK);

      tile.mesh.scale.setScalar(lerp(1, 0.22, convergeK));
      tile.mesh.rotation.copy(tile.homeRot);
      tile.mesh.rotation.y += convergeK * 1.1;

      // Opacity fade when converging into the terminal
      const alpha = (1 - smooth(seg(convergeK, 0.55, 1))) * (backProgress > 0 ? lerp(1, 0.85, backProgress) : 1);
      tile.mesh.visible = alpha > 0.01;
      this.setOpacity(tile.materials, alpha);
    });

    // 3. Animate 6 Featured Partner Cards (Scene 2 & Scene 3)
    const slotWorldPos = this.terminalBody.localToWorld(SLOT.clone());
    const aboveSlotWorldPos = slotWorldPos.clone().add(new THREE.Vector3(0, 0.65 * terminalScale, 0));
    const slotFacingQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, f.terminal.rotY, 0));
    const orbitQ = new THREE.Quaternion();
    const spinQ = new THREE.Quaternion();

    this.featuredCards.forEach(({ group, materials }, i) => {
      const dockT = f.featuredDock[i] ?? 0;
      const returnT = f.featuredReturn[i] ?? 0;
      const isDocked = dockT >= 1 && returnT <= 0;

      // Card is visible before docking, during trajectory, or during return
      group.visible = !isDocked && f.grid.converge > 0.15;
      if (!group.visible) return;

      this.setOpacity(materials, 1);

      // Calculate orbital position
      const angle = (i / FEATURED_BRANDS.length) * Math.PI * 2 + f.time * 0.35;
      const radius = 2.3 * terminalScale;
      const orbitPos = new THREE.Vector3(
        this.terminal.position.x + Math.cos(angle) * radius,
        this.terminal.position.y + 0.25 * terminalScale + Math.sin(angle * 2 + i) * 0.16 * terminalScale,
        this.terminal.position.z + Math.sin(angle) * radius * 0.72
      );

      orbitQ.setFromEuler(new THREE.Euler(0, -Math.PI / 2 + Math.cos(angle) * 0.5, Math.sin(angle + i) * 0.06));
      const orbitScale = terminalScale * 1.15;

      if (dockT > 0 && dockT < 1) {
        // Precision trajectory into the slot
        const controlPos = orbitPos
          .clone()
          .lerp(aboveSlotWorldPos, 0.5)
          .add(new THREE.Vector3(0, 0.35 * terminalScale, 0.6 * terminalScale));
        const fly = easeInOut(seg(dockT, 0, 0.72));
        const pos = orbitPos.clone().lerp(controlPos, fly).lerp(controlPos.clone().lerp(aboveSlotWorldPos, fly), fly);

        // Final mechanical slot downward insertion
        const drop = seg(dockT, 0.82, 1);
        pos.y -= 1.1 * terminalScale * drop * drop;

        group.position.copy(pos);
        group.scale.setScalar(lerp(orbitScale, terminalScale, fly));

        const spin = Math.sin(Math.PI * seg(dockT, 0, 0.6)) * 2.6;
        spinQ.setFromEuler(new THREE.Euler(0, spin, 0));
        group.quaternion.copy(orbitQ).multiply(spinQ).slerp(slotFacingQ, smooth(seg(dockT, 0.38, 0.82)));
      } else if (returnT > 0 && returnT < 1) {
        // Return trajectory back to balanced ecosystem
        const rise = smooth(seg(returnT, 0, 0.35));
        const up = slotWorldPos.clone().add(new THREE.Vector3(0, lerp(-0.4, 0.65, rise) * terminalScale, 0));
        const fly = easeInOut(seg(returnT, 0.3, 1));
        const control = up
          .clone()
          .lerp(orbitPos, 0.5)
          .add(new THREE.Vector3(0, 0.3 * terminalScale, 0.45 * terminalScale));

        group.position.copy(up.clone().lerp(control, fly).lerp(control.clone().lerp(orbitPos, fly), fly));
        group.scale.setScalar(lerp(terminalScale, orbitScale, fly));
        group.quaternion.copy(slotFacingQ).slerp(orbitQ, smooth(seg(returnT, 0.3, 0.9)));
      } else {
        // Holding in smooth orbit
        group.position.copy(orbitPos);
        group.scale.setScalar(orbitScale);
        group.quaternion.copy(orbitQ);
      }
    });

    // 4. Animate Scene 4 & 5: Primary Focus Gift Card & Active Digital Voucher
    const fc = f.cardFocus;
    this.primaryCardGroup.visible = fc.t > 0;

    if (this.primaryCardGroup.visible) {
      const focusT = smooth(fc.t);
      const redeemT = smooth(fc.redeemProgress);

      // Float smoothly out from the terminal into high-focus center stage
      const startPos = slotWorldPos.clone().add(new THREE.Vector3(0, 0.2 * terminalScale, 0.2));
      const centerStagePos = this.toWorld(f.anchors.primaryCard, 2.0);

      const currentPos = startPos.clone().lerp(centerStagePos, focusT);
      // Subtle organic floating levitation
      currentPos.y += Math.sin(f.time * 1.5) * 0.04 * focusT;
      this.primaryCardGroup.position.copy(currentPos);

      const focusScale = fit * lerp(0.8, 1.45, focusT);
      this.primaryCardGroup.scale.setScalar(focusScale);

      // Card flip transition from physical Gift Card to Active Digital Voucher (Scene 5)
      const flipAngle = redeemT * Math.PI;
      this.primaryCardGroup.rotation.set(0.12 * (1 - redeemT), flipAngle, 0);

      // Switch meshes at 90 degrees
      if (redeemT < 0.5) {
        this.primaryCardMesh.visible = true;
        this.activeVoucherMesh.visible = false;
        this.setOpacity(this.primaryCardMaterials, focusT);
      } else {
        this.primaryCardMesh.visible = false;
        this.activeVoucherMesh.visible = true;
        this.setOpacity(this.voucherMaterials, focusT);
      }
    }

    // 5. Animate Scene 6: Payout particle stream & ₹ synthesis
    const p = f.payout;
    this.particleSystem.visible = p.streamProgress > 0;

    if (this.particleSystem.visible) {
      const positions = this.particleSystem.geometry.attributes.position as THREE.BufferAttribute;
      const targetWorld = this.toWorld(f.anchors.settlementBadge, 1.5);
      const voucherOrigin = this.primaryCardGroup.position.clone();

      const streamK = p.streamProgress;
      const confirmK = smooth(p.settlementConfirm);

      this.particleJitters.forEach((j, i) => {
        const k = easeInOut(seg(streamK, j.delay, j.delay + 0.65));

        const start = this.particleStarts[i].clone().multiplyScalar(fit).add(voucherOrigin);
        const end = this.particleRupeeTargets[i].clone().multiplyScalar(1.2 * fit).add(targetWorld);

        // Curved magnetic flux arc
        const mid = start
          .clone()
          .lerp(end, 0.5)
          .add(new THREE.Vector3(j.swirl * 0.6, j.lift * 0.5, 0.4));
        const current = start.clone().lerp(mid, k).lerp(mid.clone().lerp(end, k), k);

        positions.setXYZ(i, current.x, current.y, current.z);
      });

      positions.needsUpdate = true;

      const mat = this.particleSystem.material as THREE.PointsMaterial;
      mat.opacity = smooth(seg(streamK, 0, 0.15)) * (1 - confirmK * 0.4);
      mat.size = 0.065 * fit;
    }

    // Render 3D Scene
    this.renderer.render(this.scene, cam);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}
