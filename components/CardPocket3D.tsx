'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

export interface PocketCard {
  name: string;
  image: string;
  perks: string[];
  fees: string;
  backColor: string;
  backText: string;
}

interface CardPocket3DProps {
  cards: PocketCard[];
  /** The chosen card. `tick` changes on every pick, so picking the same card again still registers. */
  selection: { index: number; tick: number };
  onPick: (index: number) => void;
  className?: string;
}

const POCKET_W = 1.86;
const POCKET_H = 1.16;
const CARD_W = 1.6;
const CARD_H = 1.01;
const BACK_Z = -0.07;
const FRONT_Z = 0.07;
const FLAP_OPEN = -0.12;
const FLAP_CLOSED = Math.PI - 0.03;
const FLAP_CLOSED_Z = 0.125;
const HINGE_Y = POCKET_H / 2;
const FLAP_LIFT = 0.2;
const ROOT_Y_OPEN = -0.38;
const ROOT_Y_CLOSED = -0.2;
// How long the wallet rests shut, and how long the cards rest fanned out (seconds).
const CLOSED_HOLD = 0.9;
const FAN_HOLD = 3.5;

// Resting fan, front card first. Keeps every lower corner inside the pocket.
const FAN = [
  { x: 0, y: 0.8, z: 0.025, rot: -0.03 },
  { x: -0.2, y: 0.84, z: -0.005, rot: 0.2 },
  { x: 0.22, y: 0.86, z: -0.03, rot: -0.2 },
];
// Where each card peaks as it arcs out of the pocket, before settling into the fan.
const PEAK = [
  { x: 0.08, y: 1.3, rot: -0.1 },
  { x: -0.4, y: 1.22, rot: 0.42 },
  { x: 0.44, y: 1.22, rot: -0.42 },
];
// Back cards come out first, and the front card goes in last.
const OUT_ORDER = [2, 1, 0];
// Clear of the pocket's top edge, so a card can move forward without touching the wallet.
const LIFT_Y = 1.25;
// How far towards the camera a card comes when you're looking at it.
const INSPECT_Z = 2;
const DRAG_TO_ROTATION = 0.012;
const TAP_SLOP_PX = 6;

function roundedShape(w: number, h: number, r: number) {
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
  return shape;
}

// Extrude and shape UVs are in world units; map them onto the whole plate so images fill it exactly
function fitUVs(geometry: THREE.BufferGeometry, w: number, h: number) {
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + w / 2) / w, (position.getY(i) + h / 2) / h);
  }
  uv.needsUpdate = true;
}

function roundedPlate(w: number, h: number, depth: number, r: number) {
  const shape = roundedShape(w, h, r);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 12,
    bevelEnabled: true,
    bevelSize: 0.006,
    bevelThickness: 0.006,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -depth / 2);

  fitUVs(geometry, w, h);
  return geometry;
}

function walletTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const base = ctx.createLinearGradient(0, 512, 512, 0);
    base.addColorStop(0, '#24242C');
    base.addColorStop(0.55, '#34343E');
    base.addColorStop(1, '#4A4854');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 512);
    // A faint diagonal sheen, like light across brushed metal
    const sheen = ctx.createLinearGradient(0, 0, 512, 512);
    sheen.addColorStop(0.35, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.07)');
    sheen.addColorStop(0.65, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 512, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Logo and wordmark, drawn together so they sit on the pocket as one decal
function brandTexture(onReady: () => void) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const logo = new Image();
  logo.src = '/assets/images/logo_white.png';
  logo.onload = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(logo, 0, 16, 160, 160);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 84px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('BrokeNoMore', 176, 100);
    texture.needsUpdate = true;
    onReady();
  };
  return texture;
}

// The back of a card: stripe, signature panel, and what the card actually offers
function cardBackTexture(card: PocketCard) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 646;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = card.backColor;
    ctx.fillRect(0, 0, 1024, 646);
    const shade = ctx.createLinearGradient(0, 0, 1024, 646);
    shade.addColorStop(0, 'rgba(255,255,255,0.08)');
    shade.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 1024, 646);

    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 56, 1024, 104);
    ctx.fillStyle = '#E9E7EE';
    ctx.fillRect(56, 192, 560, 56);

    ctx.fillStyle = card.backText;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 44px ${font}`;
    ctx.fillText(card.name, 56, 318);

    ctx.font = `400 29px ${font}`;
    let y = 372;
    card.perks.forEach((perk) => {
      let line = '•  ';
      perk.split(' ').forEach((word) => {
        if (ctx.measureText(`${line}${word}`).width > 900) {
          ctx.fillText(line, 56, y);
          y += 38;
          line = '    ';
        }
        line += `${word} `;
      });
      ctx.fillText(line, 56, y);
      y += 44;
    });

    ctx.font = `500 26px ${font}`;
    ctx.fillText(card.fees, 56, 604);
    ctx.textAlign = 'right';
    ctx.fillText('BrokeNoMore', 968, 604);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function CardPocket3D({ cards: cardData, selection, onPick, className = '' }: CardPocket3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const selectRef = useRef<((index: number) => void) | null>(null);
  const flipRef = useRef<(() => void) | null>(null);
  const closeRef = useRef<(() => void) | null>(null);
  const initialIndexRef = useRef(selection.index);
  const cardDataRef = useRef(cardData);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let teardown: (() => void) | undefined;

    const setup = () => {
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        setWebglFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.NeutralToneMapping;
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = environment;
      scene.environmentIntensity = 0.75;

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
      keyLight.position.set(1.5, 3, 4);
      scene.add(keyLight);
      // Soft violet edge light, so the dark pouch separates from the page without shouting
      const rimLight = new THREE.DirectionalLight(0x9d8cff, 1.4);
      rimLight.position.set(-3, 1.5, -1);
      scene.add(rimLight);

      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
      const fit = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        camera.position.set(0, 0.15, Math.max(3.1 / (2 * tan), 2.7 / (2 * tan * camera.aspect)));
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      fit();
      const resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(container);

      const tilt = new THREE.Group();
      scene.add(tilt);
      const root = new THREE.Group();
      root.position.y = -0.55;
      root.rotation.set(0.1, ROOT_Y_CLOSED, 0.05);
      tilt.add(root);

      // Wallet
      const leather = new THREE.MeshPhysicalMaterial({
        map: walletTexture(),
        roughness: 0.42,
        metalness: 0.6,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
      });
      // A lighter edge traces the pouch's shape, like the border on the navbar
      const pouchEdge = new THREE.MeshStandardMaterial({ color: 0x8c8a99, roughness: 0.35, metalness: 0.7 });
      const pouch = [leather, pouchEdge];
      const back = new THREE.Mesh(roundedPlate(POCKET_W, POCKET_H, 0.03, 0.1), pouch);
      back.position.z = BACK_Z;
      root.add(back);
      const front = new THREE.Mesh(roundedPlate(POCKET_W, POCKET_H, 0.04, 0.1), pouch);
      front.position.z = FRONT_Z;
      root.add(front);

      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(POCKET_W + 0.02, 0.13, 0.012),
        new THREE.MeshPhysicalMaterial({ color: 0x15151b, roughness: 0.5, metalness: 0.4 })
      );
      strap.position.set(0, 0.34, FRONT_Z + 0.03);
      root.add(strap);

      const flapPivot = new THREE.Group();
      flapPivot.position.set(0, HINGE_Y, FLAP_CLOSED_Z);
      flapPivot.rotation.x = FLAP_CLOSED;
      root.add(flapPivot);
      const flapGeometry = roundedPlate(POCKET_W, 0.8, 0.03, 0.1);
      flapGeometry.translate(0, 0.4, 0);
      flapPivot.add(new THREE.Mesh(flapGeometry, pouch));
      const clasp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.02, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 1 })
      );
      clasp.rotation.x = Math.PI / 2;
      clasp.position.set(0, 0.68, -0.025);
      flapPivot.add(clasp);

      // Brand decal
      const brand = new THREE.Mesh(
        new THREE.PlaneGeometry(0.96, 0.24),
        new THREE.MeshBasicMaterial({
          map: brandTexture(() => {
            brand.visible = true;
          }),
          transparent: true,
          toneMapped: false,
        })
      );
      brand.visible = false;
      brand.position.set(-0.36, -0.28, FRONT_Z + 0.028);
      root.add(brand);

      // Cards
      const textureLoader = new THREE.TextureLoader();
      const anisotropy = renderer.capabilities.getMaxAnisotropy();
      const textures = cardDataRef.current.map(({ image }) => {
        const texture = textureLoader.load(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = anisotropy;
        return texture;
      });
      const backTextures = cardDataRef.current.map((card) => {
        const texture = cardBackTexture(card);
        texture.anisotropy = anisotropy;
        return texture;
      });
      const cardEdge = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.5 });
      const cardGeometry = roundedPlate(CARD_W, CARD_H, 0.012, 0.07);
      const faceGeometry = new THREE.ShapeGeometry(roundedShape(CARD_W, CARD_H, 0.07), 12);
      fitUVs(faceGeometry, CARD_W, CARD_H);
      const faceOffset = 0.0125;

      const cardMaterials = FAN.map(() => new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0 }));
      const backMaterial = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 });
      let shownIndex = initialIndexRef.current;
      const applyCards = (index: number) => {
        shownIndex = index;
        cardMaterials.forEach((material, slot) => {
          material.map = textures[(index + slot) % textures.length];
          material.needsUpdate = true;
        });
        backMaterial.map = backTextures[index];
        backMaterial.needsUpdate = true;
      };
      applyCards(shownIndex);

      // Each card face knows its slot, so a click can tell which card it landed on
      const faceSlots = new Map<THREE.Object3D, number>();
      const flips: THREE.Group[] = [];
      const cards = FAN.map((pose, slot) => {
        const holder = new THREE.Group();
        holder.position.set(0, 0, pose.z);
        const flip = new THREE.Group();
        holder.add(flip);
        flips.push(flip);
        flip.add(new THREE.Mesh(cardGeometry, [cardEdge, cardEdge]));
        const face = new THREE.Mesh(faceGeometry, cardMaterials[slot]);
        face.position.z = faceOffset;
        flip.add(face);
        faceSlots.set(face, slot);
        root.add(holder);
        return holder;
      });
      // Only the front card ever gets looked at from behind
      const frontCard = cards[0];
      const frontFlip = flips[0];
      const backFace = new THREE.Mesh(faceGeometry, backMaterial);
      backFace.position.z = -faceOffset;
      backFace.rotation.y = Math.PI;
      frontFlip.add(backFace);
      faceSlots.set(backFace, 0);

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const moveFlap = (
        timeline: gsap.core.Timeline,
        open: boolean,
        at: number,
        duration: number
      ) => {
        const [fromRot, toRot, fromZ, toZ, fromRoot, toRoot] = open
          ? [FLAP_CLOSED, FLAP_OPEN, FLAP_CLOSED_Z, BACK_Z, ROOT_Y_CLOSED, ROOT_Y_OPEN]
          : [FLAP_OPEN, FLAP_CLOSED, BACK_Z, FLAP_CLOSED_Z, ROOT_Y_OPEN, ROOT_Y_CLOSED];
        const opts = { ease: 'power2.inOut', duration, immediateRender: false };
        timeline
          .fromTo(flapPivot.rotation, { x: fromRot }, { x: toRot, ...opts }, at)
          .fromTo(flapPivot.position, { z: fromZ }, { z: toZ, ...opts }, at)
          .fromTo(root.rotation, { y: fromRoot }, { y: toRoot, ...opts }, at)
          // The flap lifts clear as it swings, then seats itself
          .fromTo(
            flapPivot.position,
            { y: HINGE_Y },
            { y: HINGE_Y + FLAP_LIFT, ease: 'sine.out', duration: duration / 2, immediateRender: false },
            at
          )
          .fromTo(
            flapPivot.position,
            { y: HINGE_Y + FLAP_LIFT },
            { y: HINGE_Y, ease: 'sine.in', duration: duration / 2, immediateRender: false },
            at + duration / 2
          );
      };

      // Pocket opens, cards come out one by one, rest, slowly go back in, pocket shuts.
      const timeline = gsap.timeline({ repeat: -1, paused: true });
      moveFlap(timeline, true, CLOSED_HOLD, 0.8);

      const riseAt = CLOSED_HOLD + 0.6;
      OUT_ORDER.forEach((slot, i) => {
        const at = riseAt + i * 0.38;
        const position = cards[slot].position;
        const rotation = cards[slot].rotation;
        const up = { duration: 0.6, ease: 'power2.out', immediateRender: false };
        const settle = { duration: 0.8, ease: 'power2.inOut', immediateRender: false };
        timeline
          .fromTo(position, { x: 0, y: 0 }, { x: PEAK[slot].x, y: PEAK[slot].y, ...up }, at)
          .fromTo(rotation, { z: 0 }, { z: PEAK[slot].rot, ...up }, at)
          .fromTo(position, { x: PEAK[slot].x, y: PEAK[slot].y }, { x: FAN[slot].x, y: FAN[slot].y, ...settle }, at + 0.6)
          .fromTo(rotation, { z: PEAK[slot].rot }, { z: FAN[slot].rot, ...settle }, at + 0.6);
      });

      const fanAt = timeline.duration();
      timeline.addLabel('fan', fanAt);

      const sinkAt = fanAt + FAN_HOLD;
      OUT_ORDER.forEach((slot, i) => {
        const at = sinkAt + i * 0.22;
        const down = { duration: 1.5, ease: 'sine.inOut', immediateRender: false };
        timeline
          .fromTo(cards[slot].position, { x: FAN[slot].x, y: FAN[slot].y }, { x: 0, y: 0, ...down }, at)
          .fromTo(cards[slot].rotation, { z: FAN[slot].rot }, { z: 0, ...down }, at);
      });
      moveFlap(timeline, false, timeline.duration() - 0.1, 0.85);

      // Where a card sits to be looked at: square on to the camera, wherever the wallet is angled
      const inspectPose = () => {
        root.updateWorldMatrix(true, false);
        const position = root.worldToLocal(new THREE.Vector3(0, camera.position.y, INSPECT_Z));
        const facing = root.getWorldQuaternion(new THREE.Quaternion()).invert();
        return { position, rotation: new THREE.Euler().setFromQuaternion(facing) };
      };
      const faceFront = (timeline: gsap.core.Timeline, at: number) => {
        const turns = Math.round(frontFlip.rotation.y / (Math.PI * 2));
        timeline.to(frontFlip.rotation, { y: turns * Math.PI * 2, duration: 0.45, ease: 'power2.inOut' }, at);
      };

      let swap: gsap.core.Timeline | null = null;
      let flipTween: gsap.core.Tween | null = null;
      let mode: 'loop' | 'busy' | 'inspect' = 'loop';
      let running = false;

      const finish = (next: gsap.core.Timeline) => {
        if (reducedMotion) next.progress(1);
      };

      const flipCard = () => {
        if (mode !== 'inspect') return;
        flipTween?.kill();
        const nearest = Math.round(frontFlip.rotation.y / Math.PI) * Math.PI;
        flipTween = gsap.to(frontFlip.rotation, {
          y: nearest + Math.PI,
          duration: reducedMotion ? 0 : 0.8,
          ease: 'power2.inOut',
        });
      };

      // Picking a card: if it isn't in front, the cards duck into the pocket to swap (nothing
      // passes through the wallet). The chosen card then rises clear and comes forward.
      const select = (index: number) => {
        if (mode === 'inspect' && index === shownIndex) {
          flipCard();
          return;
        }
        const wasInspecting = mode === 'inspect';
        const changed = index !== shownIndex;
        mode = 'busy';
        setInspecting(false);
        timeline.pause();
        swap?.kill();
        flipTween?.kill();

        const next = gsap.timeline({
          onComplete: () => {
            swap = null;
            mode = 'inspect';
            setInspecting(true);
          },
        });
        swap = next;
        next
          .to(flapPivot.rotation, { x: FLAP_OPEN, duration: 0.5, ease: 'power2.inOut' }, 0)
          .to(flapPivot.position, { y: HINGE_Y, z: BACK_Z, duration: 0.5, ease: 'power2.inOut' }, 0)
          .to(root.rotation, { y: ROOT_Y_OPEN, duration: 0.5, ease: 'power2.inOut' }, 0);

        let at = 0;
        faceFront(next, 0);
        if (wasInspecting) {
          next
            .to(frontCard.position, { x: 0, y: LIFT_Y, z: FAN[0].z, duration: 0.5, ease: 'power2.inOut' }, 0)
            .to(frontCard.rotation, { x: 0, y: 0, z: 0, duration: 0.5, ease: 'power2.inOut' }, 0);
          at = 0.5;
        }
        if (changed) {
          cards.forEach((holder, slot) => {
            const start = at + slot * 0.03;
            next
              .to(holder.position, { x: 0, y: 0, duration: 0.42, ease: 'power2.in' }, start)
              .to(holder.rotation, { z: 0, duration: 0.42, ease: 'power2.in' }, start);
          });
          next.call(() => applyCards(index), [], at + 0.5);
          at += 0.55;
        }

        [2, 1].forEach((slot, i) => {
          const rise = { duration: 0.85, ease: 'back.out(1.25)' };
          next
            .to(cards[slot].position, { x: FAN[slot].x, y: FAN[slot].y, ...rise }, at + i * 0.1)
            .to(cards[slot].rotation, { z: FAN[slot].rot, ...rise }, at + i * 0.1);
        });
        next
          .to(frontCard.position, { x: 0, y: LIFT_Y, z: FAN[0].z, duration: 0.55, ease: 'power2.out' }, at)
          .to(frontCard.rotation, { z: 0, duration: 0.55, ease: 'power2.out' }, at);
        const forward = { duration: 0.8, ease: 'power3.inOut' };
        next
          .to(
            frontCard.position,
            {
              x: () => inspectPose().position.x,
              y: () => inspectPose().position.y,
              z: () => inspectPose().position.z,
              ...forward,
            },
            at + 0.55
          )
          .to(
            frontCard.rotation,
            {
              x: () => inspectPose().rotation.x,
              y: () => inspectPose().rotation.y,
              z: () => inspectPose().rotation.z,
              ...forward,
            },
            at + 0.55
          );
        finish(next);
      };

      const close = () => {
        if (mode !== 'inspect') return;
        mode = 'busy';
        setInspecting(false);
        flipTween?.kill();
        const next = gsap.timeline({
          onComplete: () => {
            swap = null;
            mode = 'loop';
            timeline.seek('fan', false);
            if (running && !reducedMotion) timeline.play();
          },
        });
        swap = next;
        faceFront(next, 0);
        next
          .to(frontCard.position, { x: 0, y: LIFT_Y, z: FAN[0].z, duration: 0.65, ease: 'power3.inOut' }, 0)
          .to(frontCard.rotation, { x: 0, y: 0, z: 0, duration: 0.65, ease: 'power3.inOut' }, 0)
          .to(frontCard.position, { x: FAN[0].x, y: FAN[0].y, duration: 0.7, ease: 'power2.inOut' }, 0.65)
          .to(frontCard.rotation, { z: FAN[0].rot, duration: 0.7, ease: 'power2.inOut' }, 0.65);
        finish(next);
      };

      selectRef.current = select;
      flipRef.current = flipCard;
      closeRef.current = close;

      if (reducedMotion) {
        flapPivot.position.set(0, HINGE_Y, BACK_Z);
        flapPivot.rotation.x = FLAP_OPEN;
        root.rotation.y = ROOT_Y_OPEN;
        cards.forEach((holder, slot) => {
          holder.position.x = FAN[slot].x;
          holder.position.y = FAN[slot].y;
          holder.rotation.z = FAN[slot].rot;
        });
      }

      // Gentle tilt towards the pointer, plus clicking and dragging on the cards
      const canvas = renderer.domElement;
      canvas.style.touchAction = 'pan-y';
      canvas.setAttribute('aria-hidden', 'true');
      const pointer = { x: 0, y: 0 };
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      // The nearest thing under the pointer counts, so a card tucked behind the pouch can't be hit
      const slotAt = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObject(root, true)[0];
        return hit ? faceSlots.get(hit.object) : undefined;
      };

      let press: { x: number; y: number; lastX: number; moved: boolean; onCard: boolean } | null = null;
      const onPointerDown = (e: PointerEvent) => {
        const slot = slotAt(e);
        press = { x: e.clientX, y: e.clientY, lastX: e.clientX, moved: false, onCard: slot === 0 };
        if (mode === 'inspect' && slot === 0) flipTween?.kill();
      };
      const onPointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        pointer.x = THREE.MathUtils.clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        pointer.y = THREE.MathUtils.clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

        if (press) {
          if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > TAP_SLOP_PX) press.moved = true;
          if (mode === 'inspect' && press.onCard) {
            frontFlip.rotation.y += (e.clientX - press.lastX) * DRAG_TO_ROTATION;
          }
          press.lastX = e.clientX;
        } else if (e.target === canvas) {
          canvas.style.cursor = slotAt(e) === undefined ? '' : mode === 'inspect' ? 'grab' : 'pointer';
        }
      };
      const onPointerUp = (e: PointerEvent) => {
        if (!press) return;
        const { moved, onCard } = press;
        press = null;
        if (mode === 'inspect') {
          if (moved && onCard) {
            // Let go mid-turn: settle on whichever side is closest
            flipTween = gsap.to(frontFlip.rotation, {
              y: Math.round(frontFlip.rotation.y / Math.PI) * Math.PI,
              duration: 0.5,
              ease: 'power2.out',
            });
          } else if (!moved && e.target === canvas) {
            if (onCard) flipCard();
            else close();
          }
          return;
        }
        if (moved || e.target !== canvas) return;
        const slot = slotAt(e);
        if (slot !== undefined) onPickRef.current((shownIndex + slot) % textures.length);
      };
      const onPointerCancel = () => {
        press = null;
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
      };
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
      window.addEventListener('keydown', onKeyDown);

      let rafId = 0;
      const clock = new THREE.Clock();
      const frame = () => {
        rafId = requestAnimationFrame(frame);
        const t = clock.getElapsedTime();
        // The wallet holds still while a card is out, so the card stays square to the camera
        const follow = mode === 'loop' && !reducedMotion ? 1 : 0;
        tilt.rotation.y += (pointer.x * 0.14 * follow - tilt.rotation.y) * 0.05;
        tilt.rotation.x += (pointer.y * 0.08 * follow - tilt.rotation.x) * 0.05;
        if (!reducedMotion) tilt.position.y = Math.sin(t * 1.1) * 0.018 * follow;
        renderer.render(scene, camera);
      };

      // Only animate while on screen. The first view opens with the cards coming out of the pocket.
      const onScreen = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !running) {
            running = true;
            clock.start();
            frame();
            swap?.play();
            if (!reducedMotion && mode === 'loop') timeline.play();
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(rafId);
            timeline.pause();
            swap?.pause();
          }
        },
        { threshold: 0.35 }
      );
      onScreen.observe(container);

      teardown = () => {
        onScreen.disconnect();
        resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        window.removeEventListener('keydown', onKeyDown);
        cancelAnimationFrame(rafId);
        selectRef.current = null;
        flipRef.current = null;
        closeRef.current = null;
        timeline.kill();
        swap?.kill();
        flipTween?.kill();
        textures.forEach((texture) => texture.dispose());
        backTextures.forEach((texture) => texture.dispose());
        scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if ('map' in material && material.map instanceof THREE.CanvasTexture) material.map.dispose();
            material.dispose();
          });
        });
        environment.dispose();
        pmrem.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        renderer.dispose();
      };
    };

    // Build the scene (and fetch the card images) only when the section is getting close
    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        nearby.disconnect();
        setup();
      },
      { rootMargin: '800px' }
    );
    nearby.observe(container);

    return () => {
      nearby.disconnect();
      teardown?.();
    };
  }, []);

  const lastTickRef = useRef(selection.tick);
  useEffect(() => {
    initialIndexRef.current = selection.index;
    if (selection.tick === lastTickRef.current) return;
    lastTickRef.current = selection.tick;
    selectRef.current?.(selection.index);
  }, [selection]);

  const pillButton =
    'px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer transition-colors duration-200';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {webglFailed && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardData[selection.index].image} alt="" className="w-3/4 max-w-sm rounded-2xl" />
        </div>
      )}
      {!webglFailed && (
        <div className="absolute z-10 bottom-1 inset-x-0 flex justify-center items-center gap-2 pointer-events-none">
          {inspecting ? (
            <>
              <button
                type="button"
                onClick={() => flipRef.current?.()}
                className={`${pillButton} pointer-events-auto bg-white text-black hover:bg-neutral-200`}
              >
                Flip card
              </button>
              <button
                type="button"
                onClick={() => closeRef.current?.()}
                className={`${pillButton} pointer-events-auto border border-white/30 text-white bg-black/40 hover:bg-white/10`}
              >
                Put it back
              </button>
            </>
          ) : (
            <p className="text-xs text-neutral-400">Tap any card to see both sides</p>
          )}
        </div>
      )}
    </div>
  );
}
