import * as THREE from 'three';

// The AI core: the app's crystal (the shape on its "Running fundamental analysis…" screen) built in
// 3D, in glass and violet light, with a stream of data rising through it. In the hero it also has
// the market orbiting it: index and stock tickers on cards that circle round, the far ones fading
// into the dark. `energy` (0 to 1) spins it up while the report is being made.

// A card in orbit. `avatar` puts a round picture before the text; `arrow: false` drops the up/down
// arrow from the last line (for words like "Paid" rather than a change in price).
export type Ticker = { name: string; value: string; change: string; up: boolean; avatar?: string; arrow?: boolean };

// `appear` grows the centrepiece in; `emerge` sends the cards out of it to their orbit. Both start
// at 1 (already there) unless the page plays the intro. With `receipt` (a drawn bill), the
// centrepiece is that bill, printing out, with gold coins circling it, instead of the crystal.
type Options = { tickers?: Ticker[]; font: string; appear?: boolean; emerge?: boolean; receipt?: HTMLCanvasElement };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (v: number) => 1 - Math.pow(1 - v, 3);
const easeOutBack = (v: number) => 1 + 2.4 * Math.pow(v - 1, 3) + 1.4 * Math.pow(v - 1, 2);

const VIOLET = new THREE.Color('#6E5BFF');

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class AiCoreScene {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  private rig = new THREE.Group(); // tilts with the pointer
  private crystal = new THREE.Group();
  private ring = new THREE.Group();
  private cards: THREE.Mesh[] = [];
  private coins: THREE.Mesh[] = [];
  private receiptMode = false;
  private glow: THREE.Sprite;
  private stream: THREE.Points;
  private streamSpeed: Float32Array;
  private disposables: { dispose: () => void }[] = [];
  private frame = 0;
  private running = false;
  private last = 0;
  private time = 0;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private energy = { v: 0, target: 0 };
  private appear = { v: 1, target: 1 };
  private emerge = { v: 1, target: 1 };
  private width = 1;
  private height = 1;

  constructor(options: Options) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'block h-full w-full';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.camera.position.set(0, 0.35, 8);
    this.camera.lookAt(0, 0, 0);
    this.scene.fog = new THREE.Fog(0x000000, 8, 12);
    this.scene.add(this.rig);
    this.rig.add(this.crystal, this.ring);

    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(-3, 4, 5);
    const violet = new THREE.PointLight(0x8b5cf6, 18, 10);
    violet.position.set(2, 1, 2);
    const pink = new THREE.PointLight(0xe86ab4, 10, 10);
    pink.position.set(-2.5, -1.5, 1.5);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25), key, violet, pink);

    if (options.appear === false) this.appear = { v: 0, target: 0 };
    if (options.emerge === false) this.emerge = { v: 0, target: 0 };
    if (options.receipt) {
      this.receiptMode = true;
      this.buildReceipt(options.receipt);
      this.buildCoins(options.font);
    } else this.buildCrystal();
    this.glow = this.buildGlow();
    const { points, speed } = this.buildStream();
    this.stream = points;
    this.streamSpeed = speed;
    if (options.tickers?.length) this.buildRing(options.tickers, options.font);
  }

  private track<T extends { dispose: () => void }>(thing: T) {
    this.disposables.push(thing);
    return thing;
  }

  // A tall pyramid on a short one, the gem, with a smaller pyramid hanging point-down beneath it
  private buildCrystal() {
    const glass = this.track(
      new THREE.MeshPhysicalMaterial({
        color: VIOLET,
        emissive: new THREE.Color('#2a1d9e'),
        emissiveIntensity: 0.6,
        metalness: 0.1,
        roughness: 0.15,
        clearcoat: 1,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
        flatShading: true,
      })
    );
    const edge = this.track(new THREE.LineBasicMaterial({ color: '#9d8cff', transparent: true, opacity: 0.95 }));
    const halo = this.track(new THREE.LineBasicMaterial({ color: '#6E5BFF', transparent: true, opacity: 0.35 }));
    const piece = (radius: number, height: number, y: number, flip: boolean) => {
      const geometry = this.track(new THREE.ConeGeometry(radius, height, 4, 1));
      if (flip) geometry.rotateX(Math.PI);
      geometry.translate(0, y + (flip ? -height / 2 : height / 2), 0);
      const mesh = new THREE.Mesh(geometry, glass);
      const edges = this.track(new THREE.EdgesGeometry(geometry, 1));
      const lines = new THREE.LineSegments(edges, edge);
      const glowLines = new THREE.LineSegments(edges, halo);
      glowLines.scale.setScalar(1.035);
      const group = new THREE.Group();
      group.add(mesh, lines, glowLines);
      return group;
    };
    const gem = new THREE.Group();
    gem.add(piece(0.62, 1.25, 0.05, false), piece(0.62, 0.32, 0.05, true));
    const drop = piece(0.42, 0.62, -0.42, true);
    drop.name = 'drop';
    this.crystal.add(gem, drop);
    this.crystal.rotation.y = Math.PI / 4;
    this.crystal.position.y = 0.15;
  }

  private buildGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(139,92,246,0.55)');
    g.addColorStop(0.35, 'rgba(110,91,255,0.2)');
    g.addColorStop(1, 'rgba(110,91,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const texture = this.track(new THREE.CanvasTexture(canvas));
    const material = this.track(new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(4.2);
    sprite.position.set(0, 0.1, -0.6);
    this.rig.add(sprite);
    return sprite;
  }

  // A bill, gently curled, hung from its top edge so it can print out downwards
  private buildReceipt(source: HTMLCanvasElement) {
    const w = 1.62;
    const h = w * (source.height / source.width);
    const geometry = this.track(new THREE.PlaneGeometry(w, h, 12, 40));
    geometry.translate(0, -h / 2, 0);
    const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // A curl across, and a little roll at the bottom
      pos.setZ(i, -Math.pow(x / (w / 2), 2) * 0.08 + Math.sin((-y / h) * Math.PI) * 0.1 + Math.pow(Math.max(0, -y / h - 0.85) / 0.15, 2) * 0.12);
    }
    geometry.computeVertexNormals();
    const texture = this.track(new THREE.CanvasTexture(source));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const paper = this.track(new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.75, metalness: 0, side: THREE.DoubleSide, emissive: new THREE.Color('#ffffff'), emissiveMap: texture, emissiveIntensity: 0.35 }));
    const sheet = new THREE.Mesh(geometry, paper);
    sheet.name = 'receipt';
    const hang = new THREE.Group();
    hang.position.y = h / 2;
    hang.add(sheet);
    this.crystal.add(hang);
  }

  // Gold coins with a rupee on each face, circling the bill
  private buildCoins(font: string) {
    const face = document.createElement('canvas');
    face.width = face.height = 128;
    const ctx = face.getContext('2d')!;
    const g = ctx.createRadialGradient(54, 50, 6, 64, 64, 64);
    g.addColorStop(0, '#fff1b8');
    g.addColorStop(0.6, '#f5c451');
    g.addColorStop(1, '#c48a17');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,100,10,0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#9a6a0c';
    ctx.font = `800 64px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', 64, 68);
    const faceTexture = this.track(new THREE.CanvasTexture(face));
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    const rim = this.track(new THREE.MeshStandardMaterial({ color: '#d9a531', metalness: 0.9, roughness: 0.3 }));
    const faces = this.track(new THREE.MeshStandardMaterial({ map: faceTexture, metalness: 0.55, roughness: 0.35, emissive: new THREE.Color('#5a3d00'), emissiveIntensity: 0.4 }));
    const geometry = this.track(new THREE.CylinderGeometry(0.16, 0.16, 0.035, 40));
    for (let i = 0; i < 7; i++) {
      const coin = new THREE.Mesh(geometry, [rim, faces, faces]);
      coin.userData.angle = (i / 7) * Math.PI * 2;
      coin.userData.lift = Math.sin(i * 1.7) * 0.7;
      coin.userData.spin = 1.2 + (i % 3) * 0.6;
      this.coins.push(coin);
      this.ring.add(coin);
    }
  }

  // Specks of data rising through the core
  private buildStream() {
    const count = 320;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const palette = ['#8B5CF6', '#E86AB4', '#59E3C7', '#ffffff'].map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const r = 0.4 + Math.random() * 2.6;
      const a = Math.random() * Math.PI * 2;
      positions.set([Math.cos(a) * r, -2.4 + Math.random() * 4.8, Math.sin(a) * r * 0.8], i * 3);
      const c = palette[Math.floor(Math.random() * (Math.random() < 0.7 ? 2 : 4))];
      colors.set([c.r, c.g, c.b], i * 3);
      speed[i] = 0.15 + Math.random() * 0.45;
    }
    const geometry = this.track(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const dot = document.createElement('canvas');
    dot.width = dot.height = 32;
    const ctx = dot.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    const material = this.track(
      new THREE.PointsMaterial({
        size: 0.06,
        map: this.track(new THREE.CanvasTexture(dot)),
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    const points = new THREE.Points(geometry, material);
    this.rig.add(points);
    return { points, speed };
  }

  // The market, circling: each ticker on a small dark card, like the app's Market Pulse tiles
  private buildRing(tickers: Ticker[], font: string) {
    const W = 520;
    const H = 230;
    const geometry = this.track(new THREE.PlaneGeometry(1.2, 1.2 * (H / W)));
    tickers.forEach((t, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      const draw = (avatar?: HTMLImageElement) => {
        ctx.clearRect(0, 0, W, H);
        roundRect(ctx, 4, 4, W - 8, H - 8, 34);
        ctx.fillStyle = '#17171b';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.stroke();
        let x = 38;
        if (t.avatar) {
          // The friend's picture, in a ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(96, H / 2, 58, 0, Math.PI * 2);
          ctx.fillStyle = '#2a2a30';
          ctx.fill();
          ctx.clip();
          if (avatar) ctx.drawImage(avatar, 38, H / 2 - 58, 116, 116);
          ctx.restore();
          ctx.lineWidth = 5;
          ctx.strokeStyle = t.up ? '#1FC58E' : '#E86AB4';
          ctx.beginPath();
          ctx.arc(96, H / 2, 60, 0, Math.PI * 2);
          ctx.stroke();
          x = 182;
        }
        ctx.fillStyle = '#9b9ba3';
        ctx.font = `600 34px ${font}`;
        ctx.fillText(t.name, x, 66);
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 58px ${font}`;
        ctx.fillText(t.value, x, 136);
        ctx.fillStyle = t.up ? '#1FC58E' : '#EF5350';
        ctx.font = `600 32px ${font}`;
        ctx.fillText(t.arrow === false ? t.change : `${t.up ? '↑' : '↓'} ${t.change}`, x, 190);
      };
      draw();
      if (t.avatar) {
        const img = new Image();
        img.onload = () => {
          draw(img);
          texture.needsUpdate = true;
        };
        img.src = t.avatar;
      }
      const texture = this.track(new THREE.CanvasTexture(canvas));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      const material = this.track(new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, fog: true }));
      const card = new THREE.Mesh(geometry, material);
      card.userData.angle = (i / tickers.length) * Math.PI * 2;
      card.userData.lift = (i % 2 ? 0.55 : -0.35) + (i % 3) * 0.12;
      this.cards.push(card);
      this.ring.add(card);
    });
  }

  setPointer(x: number, y: number) {
    this.pointer.tx = x;
    this.pointer.ty = y;
  }

  setEnergy(v: number) {
    this.energy.target = v;
  }

  setIntro(appear: boolean, emerge: boolean) {
    this.appear.target = appear ? 1 : 0;
    this.emerge.target = emerge ? 1 : 0;
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    // Keep the ring in view on narrow canvases by stepping back
    const z = this.camera.aspect < 1.1 ? 8.6 / Math.max(0.5, this.camera.aspect / 1.1) : 8.6;
    this.camera.position.z = z;
    this.camera.updateProjectionMatrix();
    // The far side of the ring fades into the dark, wherever the camera stands
    const fog = this.scene.fog as THREE.Fog;
    fog.near = z - 0.6;
    fog.far = z + 3.4;
  }

  setActive(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    if (on) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.loop);
    } else cancelAnimationFrame(this.frame);
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
  };

  private step(dt: number) {
    const e = this.energy;
    e.v += (e.target - e.v) * Math.min(1, dt * 3);
    const p = this.pointer;
    p.x += (p.tx - p.x) * Math.min(1, dt * 4);
    p.y += (p.ty - p.y) * Math.min(1, dt * 4);
    this.rig.rotation.set(p.y * 0.18, p.x * 0.35, 0);

    // The intro runs at a fixed pace: about 0.9s for the crystal, 1.2s for the cards
    const ap = this.appear;
    ap.v = ap.target > ap.v ? Math.min(ap.target, ap.v + dt / 0.9) : ap.target;
    const em = this.emerge;
    em.v = em.target > em.v ? Math.min(em.target, em.v + dt / 1.2) : em.target;
    const grown = clamp01(easeOutBack(ap.v));
    if (this.receiptMode) {
      // The bill prints out from its top edge, then sways
      this.crystal.scale.set(1, Math.max(0.0001, easeOutCubic(ap.v)), 1);
    } else this.crystal.scale.setScalar(Math.max(0.0001, ap.v < 1 ? easeOutBack(ap.v) : 1));
    this.crystal.visible = ap.v > 0.001;
    (this.stream.material as THREE.PointsMaterial).opacity = 0.85 * easeOutCubic(ap.v);

    // The crystal turns (spinning in fast as it appears), bobs, and its drop counter-turns beneath it
    const t = this.time;
    if (this.receiptMode) this.crystal.rotation.y = Math.sin(t * 0.55) * 0.42;
    else this.crystal.rotation.y += dt * (0.45 + e.v * 3.2 + (1 - ap.v) * 7);
    this.crystal.position.y = 0.15 + Math.sin(t * 1.3) * 0.08;
    const drop = this.crystal.getObjectByName('drop');
    if (drop) {
      drop.rotation.y = -this.crystal.rotation.y * 2;
      drop.position.y = Math.sin(t * 1.3 + 0.8) * 0.05 - e.v * 0.12;
    }
    const pulse = 1 + Math.sin(t * 2.2) * 0.05 + e.v * 0.35;
    this.glow.scale.setScalar(4.2 * pulse * Math.max(0.0001, grown));

    // The data stream rises, faster with energy, and wraps
    const pos = this.stream.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < this.streamSpeed.length; i++) {
      arr[i * 3 + 1] += dt * this.streamSpeed[i] * (1 + e.v * 5);
      if (arr[i * 3 + 1] > 2.4) arr[i * 3 + 1] = -2.4;
    }
    pos.needsUpdate = true;
    this.stream.rotation.y += dt * 0.08;

    // The market circles round, each card turned to face you
    // During the intro each card flies out of the crystal in turn
    this.cards.forEach((card, i) => {
      const k = clamp01(em.v * 1.5 - i * 0.06);
      const out = easeOutBack(k);
      const a = card.userData.angle + t * 0.16;
      card.position.set(Math.cos(a) * 2.05 * out, 0.15 + (card.userData.lift - 0.15) * out + Math.sin(t * 0.9 + a) * 0.08 * k, Math.sin(a) * 1.7 * out);
      card.scale.setScalar(Math.max(0.0001, easeOutCubic(k)));
      card.visible = k > 0.001;
      card.quaternion.copy(this.camera.quaternion);
    });

    // The coins circle closer in, tumbling, coming out with the cards
    this.coins.forEach((coin, i) => {
      const k = clamp01(em.v * 1.4 - i * 0.05);
      const out = easeOutBack(k);
      const a = coin.userData.angle - t * 0.35;
      coin.position.set(Math.cos(a) * 1.25 * out, 0.15 + coin.userData.lift * out + Math.sin(t * 1.4 + i) * 0.06, Math.sin(a) * 1.05 * out);
      coin.rotation.set(Math.PI / 2 + Math.sin(t + i) * 0.4, t * coin.userData.spin, 0);
      coin.scale.setScalar(Math.max(0.0001, easeOutCubic(k)));
      coin.visible = k > 0.001;
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
