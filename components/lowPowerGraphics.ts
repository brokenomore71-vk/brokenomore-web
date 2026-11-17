// Whether this browser draws WebGL without a real GPU (software rendering, as on machines with no
// graphics acceleration and in headless test browsers). There, every frame of a full-screen shader
// or a 3D model is computed on the CPU and can take 50-150 ms, blocking the page the whole time
// it animates. The 3D pieces check this and draw still frames (only when something changes)
// instead of animating continuously. Asked once and remembered.
let cached: boolean | null = null;

export function isLowPowerGraphics(): boolean {
  if (cached !== null) return cached;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const strict = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null;
    if (strict) {
      strict.getExtension('WEBGL_lose_context')?.loseContext();
      cached = false;
    } else {
      // No GPU-backed context. If WebGL works at all, it's software-rendered.
      const loose = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null;
      loose?.getExtension('WEBGL_lose_context')?.loseContext();
      cached = !!loose;
    }
  } catch {
    cached = false;
  }
  return cached;
}
