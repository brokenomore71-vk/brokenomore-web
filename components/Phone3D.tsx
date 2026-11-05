'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Phone3DProps {
  className?: string;
  selectedFeatureId?: string | null;
  playIntro?: boolean;
  /** Holds the entrance back until the page is ready for the phone to appear. */
  startIntro?: boolean;
  onIntroComplete?: () => void;
  /** Scroll-driven rotation (radians) added on top of the resting pose. */
  scrollMotionRef?: React.RefObject<{ rotY: number }>;
}

const FEATURE_IMAGES: Record<string, string> = {
  gold: '/assets/images/features/goldsavings.jpeg',
  'gold-savings': '/assets/images/features/goldsavings.jpeg',
  split: '/assets/images/features/splitshare.jpeg',
  'split-share': '/assets/images/features/splitshare.jpeg',
  stocks: '/assets/images/features/stocks.jpeg',
  stock: '/assets/images/features/stocks.jpeg',
  loan: '/assets/images/features/loanplanner.jpeg',
  'loan-planner': '/assets/images/features/loanplanner.jpeg',
  itr: '/assets/images/features/ITR.jpeg',
  'file-itr': '/assets/images/features/ITR.jpeg',
};

const TOP_BG_COLORS: Record<string, string> = {
  gold: '#EAA837',
  'gold-savings': '#EAA837',
  split: '#A493D7',
  'split-share': '#A493D7',
  stocks: '#121212',
  stock: '#121212',
  loan: '#EBE3FA',
  'loan-planner': '#EBE3FA',
  itr: '#12121A',
  'file-itr': '#12121A',
};

export default function Phone3D({
  className = '',
  selectedFeatureId = null,
  playIntro = false,
  startIntro = true,
  onIntroComplete,
  scrollMotionRef,
}: Phone3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  const canvasTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const selectedFeatureIdRef = useRef<string | null | undefined>(selectedFeatureId);

  const onIntroCompleteRef = useRef(onIntroComplete);
  onIntroCompleteRef.current = onIntroComplete;
  const playIntroRef = useRef(playIntro);
  playIntroRef.current = playIntro;
  const startIntroRef = useRef(startIntro);
  startIntroRef.current = startIntro;
  const scrollMotionRefLatest = useRef(scrollMotionRef);
  scrollMotionRefLatest.current = scrollMotionRef;
  const hasNotifiedIntroRef = useRef(false);

  // Animation & spring reaction references
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const hapticOffsetRef = useRef<{ z: number; targetZ: number }>({
    z: 0,
    targetZ: 0,
  });

  // Render the white BrokeNoMore app logo centered on the dark screen
  const drawLogoToCanvas = (
    canvas: HTMLCanvasElement,
    logoImg: HTMLImageElement,
    texture: THREE.CanvasTexture
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    // 1. Deep Midnight Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    // 2. Large Centered White Logo
    const logoSize = Math.round(width * 0.6);
    const logoX = (width - logoSize) / 2;
    const logoY = (height - logoSize) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

    texture.needsUpdate = true;
  };

  // Render feature screenshot onto the phone screen without time/battery
  const drawFeatureToCanvas = (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    featureId: string,
    texture: THREE.CanvasTexture
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw the full high-res screenshot
    ctx.drawImage(img, 0, 0, width, height);

    // 2. Ensure top status bar (time/battery) is completely filled with the seamless header background
    const topColor = TOP_BG_COLORS[featureId];
    if (topColor) {
      ctx.fillStyle = topColor;
      ctx.fillRect(0, 0, width, Math.round(height * (64 / 1400)));
    }

    texture.needsUpdate = true;
  };

  // Preload logo and feature screenshots on mount
  useEffect(() => {
    // Preload Logo
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = '/assets/images/logo_white.png';
    logoImageRef.current = logoImg;

    // Preload Feature Images
    const uniqueSources = Array.from(new Set(Object.values(FEATURE_IMAGES)));
    uniqueSources.forEach((src) => {
      if (!imageCacheRef.current.has(src)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
          imageCacheRef.current.set(src, img);
          const currentId = selectedFeatureIdRef.current;
          if (currentId && FEATURE_IMAGES[currentId] === src) {
            const canvas = displayCanvasRef.current;
            const texture = canvasTextureRef.current;
            if (canvas && texture) {
              drawFeatureToCanvas(canvas, img, currentId, texture);
            }
          }
        };
        imageCacheRef.current.set(src, img);
      }
    });
  }, []);

  // Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Offscreen Canvas setup for 630x1400 native retina screen texture
    const screenWidth = 630;
    const screenHeight = 1400;

    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = screenWidth;
    displayCanvas.height = screenHeight;
    displayCanvasRef.current = displayCanvas;

    // Fill initial black background
    const ctx = displayCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, screenWidth, screenHeight);
    }

    // Create CanvasTexture immediately
    const canvasTexture = new THREE.CanvasTexture(displayCanvas);
    canvasTexture.flipY = false;
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTextureRef.current = canvasTexture;

    // Initial draw: selected feature image or BrokeNoMore white logo
    const initialFeatureId = selectedFeatureIdRef.current;
    if (initialFeatureId && FEATURE_IMAGES[initialFeatureId]) {
      const src = FEATURE_IMAGES[initialFeatureId];
      const cached = imageCacheRef.current.get(src);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        drawFeatureToCanvas(displayCanvas, cached, initialFeatureId, canvasTexture);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
          imageCacheRef.current.set(src, img);
          if (selectedFeatureIdRef.current === initialFeatureId) {
            drawFeatureToCanvas(displayCanvas, img, initialFeatureId, canvasTexture);
          }
        };
      }
    } else {
      const logoImg = logoImageRef.current || new Image();
      if (!logoImageRef.current) {
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/assets/images/logo_white.png';
        logoImageRef.current = logoImg;
      }
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        drawLogoToCanvas(displayCanvas, logoImg, canvasTexture);
      } else {
        logoImg.onload = () => {
          if (!selectedFeatureIdRef.current) {
            drawLogoToCanvas(displayCanvas, logoImg, canvasTexture);
          }
        };
      }
    }

    // Three.js Scene Setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 650;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 10);
    camera.position.set(0, 0, 0.285);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: 'default',
        });
      } catch (err) {
        console.error('WebGL is blocked or unavailable:', err);
        setLoading(false);
        return;
      }
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    if (playIntroRef.current) {
      renderer.domElement.style.visibility = 'hidden';
    }
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('Phone3D WebGL context lost.');
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    // Cinematic Lighting matching floating product showcase
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2.5, 2.5, 2.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(-2, 1.2, 1.2);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 4, 1.5);
    scene.add(topLight);

    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // Interactive pointer drag tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let isDragging = false;
    let previousPointerPosition = { x: 0, y: 0 };
    let dragRotation = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (isDragging) {
        const deltaX = e.clientX - previousPointerPosition.x;
        const deltaY = e.clientY - previousPointerPosition.y;
        dragRotation.y += deltaX * 0.007;
        dragRotation.x += deltaY * 0.007;
        dragRotation.x = Math.max(-0.55, Math.min(0.55, dragRotation.x));
        previousPointerPosition = { x: e.clientX, y: e.clientY };
      } else {
        mouse.targetX = ((clientX / rect.width) * 2 - 1) * 0.22;
        mouse.targetY = (-(clientY / rect.height) * 2 + 1) * 0.18;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousPointerPosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const screenMaterial = new THREE.MeshBasicMaterial({
      map: canvasTexture,
    });

    // Load 3D GLTF Model (main.glb)
    const loader = new GLTFLoader();
    let isMounted = true;
    let modelLoaded = false;

    loader.load(
      '/assets/images/main.glb',
      (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;

        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;

            // Apply custom canvas texture displaying the app logo or feature
            if ((mat.name || '').includes('Screen')) {
              child.material = screenMaterial;
              return;
            }

            // Dark satin titanium frame
            if (typeof mat.metalness === 'number' && mat.metalness > 0.4) {
              mat.metalness = 0.85;
              mat.roughness = 0.24;
              mat.needsUpdate = true;
            }

            // Dark camera and sensor glass (prevent alpha buffer draining)
            if ((mat.name || '').includes('Glass')) {
              mat.roughness = 0.06;
              mat.depthWrite = false;
              mat.needsUpdate = true;
            }

            // Ensure backpanel and body are solid opaque
            if ((mat.name || '').includes('Backpanel')) {
              mat.transparent = false;
              mat.opacity = 1.0;
              mat.needsUpdate = true;
            }
          }
        });

        // Center phone model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        modelGroup.add(model);
        modelLoaded = true;
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading 3D phone model:', error);
        setLoading(false);
      }
    );

    // Responsive resize observer
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Animation loop (60 FPS) with Entrance Animation
    let animId: number;
    let clock = new THREE.Clock();
    let introStartTime: number | null = null;
    let introCompleted = !playIntroRef.current;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Intro entrance animation (rising from down to up while spinning into position)
      let introProgress = 1;
      if (!introCompleted && modelLoaded && startIntroRef.current) {
        if (introStartTime === null) {
          introStartTime = elapsedTime;
          // The canvas flies in from the side, scaling up, while the model below settles into pose
          const canvas = renderer.domElement;
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.set(canvas, { autoAlpha: 1 });
          } else {
            gsap.fromTo(
              canvas,
              { x: -200, scale: 0.3, autoAlpha: 0 },
              { x: 0, scale: 1, autoAlpha: 1, duration: 0.8, ease: 'power2.out' }
            );
          }
        }
        const introDuration = 1.35; // brisk, cinematic rise
        const rawProgress = Math.min(1, Math.max(0, (elapsedTime - introStartTime) / introDuration));
        // Quartic ease out: rapid initial upward rush, buttery-smooth deceleration into resting pose
        introProgress = 1 - Math.pow(1 - rawProgress, 4);

        if (rawProgress >= 0.7 && !hasNotifiedIntroRef.current) {
          hasNotifiedIntroRef.current = true;
          onIntroCompleteRef.current?.();
        }

        if (rawProgress >= 1) {
          introCompleted = true;
        }
      }

      // Smooth mouse follow (only active after intro arrives)
      if (introCompleted) {
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
      }

      // Spring-based Haptic bounce interpolation
      const haptic = hapticOffsetRef.current;
      haptic.z += (haptic.targetZ - haptic.z) * 0.12;
      haptic.targetZ *= 0.92;

      // Organic 3D floating waves matching the reference pose
      const floatFactor = introCompleted ? 1 : introProgress;
      const floatY = Math.sin(elapsedTime * 1.3) * 0.007 * floatFactor;
      const floatX = Math.cos(elapsedTime * 0.9) * 0.002 * floatFactor;
      const floatRotX = Math.sin(elapsedTime * 1.1) * 0.018 * floatFactor;
      const floatRotY = Math.cos(elapsedTime * 0.95) * 0.022 * floatFactor;
      const floatRotZ = Math.sin(elapsedTime * 1.0) * 0.014 * floatFactor;

      // Base isometric floating diagonal pose matching reference image:
      const targetRotX = 0.16 + floatRotX;
      const targetRotY = -0.32 + floatRotY;
      const targetRotZ = -0.24 + floatRotZ;

      // Starting pose: tilted back and turned partly away; the canvas tween handles the travel
      const startPosY = 0;
      const startRotX = 0.45;  // tilted back as it ascends
      const startRotY = targetRotY - 0.9;
      const startRotZ = -0.05;

      const currentPosY = startPosY + (0 - startPosY) * introProgress + floatY;
      const currentRotX = startRotX + (targetRotX - startRotX) * introProgress;
      const scrollRotY = scrollMotionRefLatest.current?.current?.rotY ?? 0;
      const currentRotY = startRotY + (targetRotY - startRotY) * introProgress + scrollRotY;
      const currentRotZ = startRotZ + (targetRotZ - startRotZ) * introProgress;

      modelGroup.position.x = floatX;
      modelGroup.position.y = currentPosY;
      modelGroup.position.z = haptic.z;

      if (isDragging && introCompleted) {
        modelGroup.rotation.x = currentRotX + dragRotation.x;
        modelGroup.rotation.y = currentRotY + dragRotation.y;
        modelGroup.rotation.z = currentRotZ;
      } else if (introCompleted) {
        modelGroup.rotation.x = currentRotX - mouse.y * 0.4 + dragRotation.x * 0.95;
        modelGroup.rotation.y = currentRotY + mouse.x * 0.5 + dragRotation.y * 0.95;
        modelGroup.rotation.z = currentRotZ;
        dragRotation.y *= 0.98;
        dragRotation.x *= 0.98;
      } else {
        modelGroup.rotation.x = currentRotX;
        modelGroup.rotation.y = currentRotY;
        modelGroup.rotation.z = currentRotZ;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      gsap.killTweensOf(renderer.domElement);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      canvasTexture.dispose();
      screenMaterial.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, []);

  // When selectedFeatureId changes, update the phone screen
  useEffect(() => {
    selectedFeatureIdRef.current = selectedFeatureId;
    hapticOffsetRef.current.targetZ = 0.018; // Haptic spring pop

    const canvas = displayCanvasRef.current;
    const texture = canvasTextureRef.current;
    if (!canvas || !texture) return;

    if (!selectedFeatureId) {
      const logoImg = logoImageRef.current;
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        drawLogoToCanvas(canvas, logoImg, texture);
      }
      return;
    }

    const imageSrc = FEATURE_IMAGES[selectedFeatureId];
    if (imageSrc) {
      const cached = imageCacheRef.current.get(imageSrc);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        drawFeatureToCanvas(canvas, cached, selectedFeatureId, texture);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        img.onload = () => {
          imageCacheRef.current.set(imageSrc, img);
          if (selectedFeatureIdRef.current === selectedFeatureId) {
            drawFeatureToCanvas(canvas, img, selectedFeatureId, texture);
          }
        };
      }
    }
  }, [selectedFeatureId]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {loading && startIntro && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-300">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">Loading 3D Phone...</span>
        </div>
      )}
    </div>
  );
}
