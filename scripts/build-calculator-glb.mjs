// Builds public/assets/calculator.glb: the Loan Planner's printing desk calculator.
//
//   node scripts/build-calculator-glb.mjs
//
// A wedge-shaped body that slopes up towards the back, a brushed aluminium deck with a dark
// display and twenty pill-shaped keys, and a printer housing at the back with a paper roll. The
// receipt feeds up out of the slot in front of the roll.
//
// The model carries no text: the page draws the display, the key legends, the brand mark and the
// receipt onto these named parts at runtime (see components/loan/calculatorScene.ts):
//   Display, Brand, Legend_<key>   flat planes waiting for a texture
//   Key_<key>                      each key's group; pressed along its local -z
//   PaperFeed                      sits in the slot; its local +y is the way the paper comes out
//   Paper                          the receipt, inside PaperFeed, 1 long
// Keys are named by id: AC pct div mul 7 8 9 minus 4 5 6 plus 1 2 3 eq 0 00 dot EMI.

import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// The exporter reads its output blob with FileReader, which Node doesn't have
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
};

// ---- Materials ----
const mat = {
  body: new THREE.MeshPhysicalMaterial({ name: 'Body', color: '#121216', roughness: 0.55, metalness: 0.15, clearcoat: 0.2, clearcoatRoughness: 0.5 }),
  deck: new THREE.MeshStandardMaterial({ name: 'Aluminium', color: '#9a9ca4', roughness: 0.38, metalness: 0.85 }),
  bezel: new THREE.MeshStandardMaterial({ name: 'Bezel', color: '#07070a', roughness: 0.5 }),
  display: new THREE.MeshBasicMaterial({ name: 'Display', color: '#0b1113' }),
  slot: new THREE.MeshStandardMaterial({ name: 'Slot', color: '#020203', roughness: 0.9 }),
  roll: new THREE.MeshStandardMaterial({ name: 'PaperRoll', color: '#efece4', roughness: 0.9 }),
  core: new THREE.MeshStandardMaterial({ name: 'RollCore', color: '#2b2b30', roughness: 0.6, metalness: 0.3 }),
  paper: new THREE.MeshBasicMaterial({ name: 'Paper', color: '#f4f2ec', side: THREE.DoubleSide }),
  legend: new THREE.MeshBasicMaterial({ name: 'Legend', color: '#ffffff', transparent: true }),
  brand: new THREE.MeshBasicMaterial({ name: 'Brand', color: '#ffffff', transparent: true }),
  feet: new THREE.MeshStandardMaterial({ name: 'Rubber', color: '#050505', roughness: 1 }),
};
const keyMat = (name, color, roughness = 0.45) => new THREE.MeshPhysicalMaterial({ name, color, roughness, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.3 });
const keyMats = {
  num: keyMat('KeyNumber', '#1d1d22'),
  op: keyMat('KeyOperator', '#c9cbd2', 0.5),
  clear: keyMat('KeyClear', '#E86AB4'),
  eq: keyMat('KeyEquals', '#6E5BFF'),
  emi: keyMat('KeyEMI', '#8B5CF6'),
};

const root = new THREE.Group();
root.name = 'Calculator';
const add = (geometry, material, name, parent = root) => {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  parent.add(m);
  return m;
};

// ---- The body: a wedge, seen from the side ----
// Front edge 0.06 high at z = +0.65, rising to 0.24 at z = -0.35, flat behind that
const W = 1;
const side = new THREE.Shape();
// Shape x runs front (-0.65) to back (+0.65); it becomes world -z
side.moveTo(-0.65, 0);
side.lineTo(0.65, 0);
side.lineTo(0.65, 0.24);
side.lineTo(0.35, 0.24);
side.lineTo(-0.65, 0.06);
side.closePath();
const bevel = 0.025;
const bodyGeometry = new THREE.ExtrudeGeometry(side, { depth: W - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 8 });
bodyGeometry.translate(0, 0, -(W - 2 * bevel) / 2);
bodyGeometry.rotateY(Math.PI / 2); // shape x -> world -z, extrusion -> world x
add(bodyGeometry, mat.body, 'Body');

// Rubber feet
[[-0.4, 0.5], [0.4, 0.5], [-0.4, -0.5], [0.4, -0.5]].forEach(([x, z], i) => {
  const foot = add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 24), mat.feet, `Foot_${i}`);
  foot.position.set(x, -0.03, z);
});

// ---- The deck: an aluminium plate lying on the slope ----
// Its local axes: x across, y up the slope towards the back, z out of the surface
const slope = Math.atan2(0.24 - 0.06, 1.0);
const deck = new THREE.Group();
deck.name = 'Deck';
deck.position.set(0, (0.06 + 0.24) / 2 + bevel, 0.15);
deck.rotation.x = -Math.PI / 2 + slope;
root.add(deck);
const plate = add(new RoundedBoxGeometry(0.94, 0.98, 0.012, 3, 0.005), mat.deck, 'Plate', deck);
plate.position.z = 0.006;

// The display, near the top of the slope
const bezel = add(new RoundedBoxGeometry(0.86, 0.22, 0.014, 3, 0.006), mat.bezel, 'DisplayBezel', deck);
bezel.position.set(0, 0.34, 0.017);
const display = add(new THREE.PlaneGeometry(0.8, 0.17), mat.display, 'Display', deck);
display.position.set(0, 0.34, 0.0245);

// The brand mark, between the display and the keys
const brand = add(new THREE.PlaneGeometry(0.4, 0.05), mat.brand, 'Brand', deck);
brand.position.set(-0.22, 0.195, 0.0125);

// ---- Twenty pill-shaped keys ----
const KEYS = [
  ['AC', 'pct', 'div', 'mul'],
  ['7', '8', '9', 'minus'],
  ['4', '5', '6', 'plus'],
  ['1', '2', '3', 'eq'],
  ['0', '00', 'dot', 'EMI'],
];
const KEY_W = 0.18;
const KEY_H = 0.1;
const KEY_D = 0.03;
const pill = new THREE.Shape();
{
  const r = KEY_H / 2;
  const x = KEY_W / 2 - r;
  pill.moveTo(-x, -r);
  pill.lineTo(x, -r);
  pill.absarc(x, 0, r, -Math.PI / 2, Math.PI / 2, false);
  pill.lineTo(-x, r);
  pill.absarc(-x, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
}
const keyBevel = 0.008;
const keyGeometry = new THREE.ExtrudeGeometry(pill, { depth: KEY_D, bevelEnabled: true, bevelSize: keyBevel, bevelThickness: keyBevel, bevelSegments: 4, curveSegments: 16 });
const legendGeometry = new THREE.PlaneGeometry(KEY_W * 0.8, KEY_H * 0.8);
const keypad = new THREE.Group();
keypad.name = 'Keypad';
deck.add(keypad);
KEYS.forEach((row, r) =>
  row.forEach((id, c) => {
    const material =
      id === 'AC' ? keyMats.clear : id === 'eq' ? keyMats.eq : id === 'EMI' ? keyMats.emi : ['pct', 'div', 'mul', 'minus', 'plus'].includes(id) ? keyMats.op : keyMats.num;
    const key = new THREE.Group();
    key.name = `Key_${id}`;
    key.position.set(-0.315 + c * 0.21, 0.1 - r * 0.135, 0.012 + keyBevel);
    keypad.add(key);
    add(keyGeometry, material, `KeyCap_${id}`, key);
    const legend = add(legendGeometry, mat.legend.clone(), `Legend_${id}`, key);
    legend.material.name = `Legend_${id}`;
    legend.position.z = KEY_D + keyBevel + 0.0012;
  })
);

// ---- The printer at the back: a housing, the paper roll in its cradle, and the slot ----
const housing = add(new RoundedBoxGeometry(0.98, 0.16, 0.32, 4, 0.03), mat.body, 'PrinterHousing');
housing.position.set(0, 0.24 + bevel + 0.08 - 0.005, -0.49);
const housingTop = housing.position.y + 0.08;
const roll = add(new THREE.CylinderGeometry(0.085, 0.085, 0.66, 48), mat.roll, 'PaperRoll');
roll.rotation.z = Math.PI / 2;
roll.position.set(0, housingTop + 0.05, -0.56);
const core = add(new THREE.CylinderGeometry(0.028, 0.028, 0.7, 24), mat.core, 'RollCore');
core.rotation.z = Math.PI / 2;
core.position.copy(roll.position);
const slot = add(new RoundedBoxGeometry(0.72, 0.012, 0.03, 2, 0.005), mat.slot, 'PaperSlot');
slot.position.set(0, housingTop + 0.001, -0.36);

// Where the paper comes out: up out of the slot and leaning back, clear of the roll
const feed = new THREE.Group();
feed.name = 'PaperFeed';
feed.position.set(0, housingTop, -0.36);
feed.rotation.x = -Math.atan2(0.6, 0.8);
root.add(feed);
const paper = add(new THREE.PlaneGeometry(0.62, 1), mat.paper, 'Paper', feed);
paper.position.y = -0.5; // fully inside the housing until it prints

// ---- Export ----
const scene = new THREE.Scene();
scene.add(root);
const exporter = new GLTFExporter();
const glb = await new Promise((resolve, reject) => exporter.parse(scene, resolve, reject, { binary: true }));
const out = path.resolve('public/assets/calculator.glb');
fs.writeFileSync(out, Buffer.from(glb));
console.log(`Wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
