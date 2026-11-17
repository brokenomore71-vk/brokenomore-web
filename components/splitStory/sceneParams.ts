// What the split story's scroll timeline animates in the payment scene, and where the paper slot
// sits on the stage. Kept apart from paymentScene.ts, and free of three.js, so the timeline (which
// the home page loads up front) doesn't pull the whole 3D library into the first download; the
// scene itself, with three.js, loads only when the story's layer does.

// Width of paper the slot takes, in model units.
export const SLOT_PAPER_WIDTH = 3.9;

// Measured from payment_machine.glb: the slot, relative to the model's centre
// (SLOT − MODEL_CENTER in paymentScene.ts)
const SLOT_FROM_CENTER = { x: 0 - 0.045, y: 3.7 - 1.778, z: 3.55 - 0.454 };

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

// Where the slot is on the stage for a given machine pose, with y pointing down. The same sum as
// the scene's: the machine is first stood upright (x → −x, y → z, z → y), then turned by its
// rx, ry, rz (an XYZ Euler rotation, as three.js applies it), then scaled to stage pixels.
export function slotOnStage(m: SceneParams['machine']) {
  const s = m.pxPerUnit;
  // Stood upright
  const ux = -SLOT_FROM_CENTER.x * s;
  const uy = SLOT_FROM_CENTER.z * s;
  const uz = SLOT_FROM_CENTER.y * s;
  // Turned: the rotation matrix three.js builds for an XYZ Euler
  const a = Math.cos(m.rx), b = Math.sin(m.rx);
  const c = Math.cos(m.ry), d = Math.sin(m.ry);
  const e = Math.cos(m.rz), f = Math.sin(m.rz);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  const px = c * e * ux - c * f * uy + d * uz;
  const py = (af + be * d) * ux + (ae - bf * d) * uy - b * c * uz;
  const pz = (bf - ae * d) * ux + (be + af * d) * uy + a * c * uz;
  return { x: m.x + px, y: m.y - py, z: pz };
}
