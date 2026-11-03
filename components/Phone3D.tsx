'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Phone3DProps {
  className?: string;
}

export default function Phone3D({ className = '' }: Phone3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 650;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 10);
    camera.position.set(0, 0, 0.265);

    // Renderer with rich contrast tone mapping
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88; // Deep, rich dark tones
    container.appendChild(renderer.domElement);

    // Dark sleek studio lighting (deep contrast, no washed-out milky look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Crisp directional key light on the bezel edges
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(1.8, 3, 2);
    scene.add(keyLight);

    // Subtle purple/violet fill for the cherry titanium edges
    const rimLight = new THREE.DirectionalLight(0x7c3aed, 0.8);
    rimLight.position.set(-2, 1, 1.2);
    scene.add(rimLight);

    // Top specular highlight
    const topLight = new THREE.DirectionalLight(0xffffff, 0.7);
    topLight.position.set(0, 4, -1);
    scene.add(topLight);

    // Group for model and animations
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Mouse tracking for tilt
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
        dragRotation.y += deltaX * 0.008;
        dragRotation.x += deltaY * 0.008;
        dragRotation.x = Math.max(-0.6, Math.min(0.6, dragRotation.x));
        previousPointerPosition = { x: e.clientX, y: e.clientY };
      } else {
        mouse.targetX = ((clientX / rect.width) * 2 - 1) * 0.25;
        mouse.targetY = (-(clientY / rect.height) * 2 + 1) * 0.2;
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

    // Load custom app screen texture
    const textureLoader = new THREE.TextureLoader();
    const screenTexture = textureLoader.load('/assets/images/app_screen.png');
    screenTexture.flipY = false;
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    // Load GLTF model
    const loader = new GLTFLoader();
    let isMounted = true;

    loader.load(
      '/assets/images/main.glb',
      (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;

        // Tune materials for rich dark contrast & realistic satin sheen
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;

            // Screen texture
            if ((mat.name || '').includes('Screen')) {
              child.material = new THREE.MeshBasicMaterial({
                map: screenTexture,
              });
              return;
            }

            // Dark satin titanium: retain deep dark base color, prevent pale/light washout
            if (typeof mat.metalness === 'number' && mat.metalness > 0.4) {
              mat.metalness = 0.82; // Sleek dark metallic
              mat.roughness = 0.28; // Satin sheen, avoids harsh blinding glare
              mat.needsUpdate = true;
            }

            // Dark glass
            if ((mat.name || '').includes('Glass')) {
              mat.roughness = 0.08;
              mat.needsUpdate = true;
            }
          }
        });

        // Auto-center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        modelGroup.add(model);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading 3D phone model:', error);
        setLoading(false);
      }
    );

    // Resize handler
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

    // Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Gentle floating motion
      const floatY = Math.sin(elapsedTime * 1.5) * 0.003;
      modelGroup.position.y = floatY;

      // Combine floating tilt with mouse/drag rotation
      if (isDragging) {
        modelGroup.rotation.y = dragRotation.y;
        modelGroup.rotation.x = dragRotation.x;
      } else {
        modelGroup.rotation.y = mouse.x + dragRotation.y * 0.95;
        modelGroup.rotation.x = -mouse.y + dragRotation.x * 0.95;
        dragRotation.y *= 0.98;
        dragRotation.x *= 0.98;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      screenTexture.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
