import { BILL } from './splitData';

// Receipt size in CSS pixels. It is drawn once at high resolution, then shown both as paper
// on the page and, zoomed in, through the phone's camera view.
export const RECEIPT_W = 270;
export const RECEIPT_H = 430;
const RENDER_SCALE = 3;

const ROWS_START = 150;
const ROW_STEP = 22;
const TOTAL_Y = 342;

// One entry per thing the OCR picks up: the five items, then the total.
export const OCR_ROWS = [...BILL.items.map((_, i) => ROWS_START + i * ROW_STEP), TOTAL_Y];

const money = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

export function renderReceipt(canvas: HTMLCanvasElement, monoFamily: string) {
  canvas.width = RECEIPT_W * RENDER_SCALE;
  canvas.height = RECEIPT_H * RENDER_SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(RENDER_SCALE, RENDER_SCALE);
  ctx.clearRect(0, 0, RECEIPT_W, RECEIPT_H);

  // Paper with torn zigzag ends
  const tooth = 9;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  for (let x = 0; x < RECEIPT_W; x += tooth) {
    ctx.lineTo(x + tooth / 2, 0);
    ctx.lineTo(x + tooth, 5);
  }
  ctx.lineTo(RECEIPT_W, RECEIPT_H - 5);
  for (let x = RECEIPT_W; x > 0; x -= tooth) {
    ctx.lineTo(x - tooth / 2, RECEIPT_H);
    ctx.lineTo(x - tooth, RECEIPT_H - 5);
  }
  ctx.closePath();
  const paper = ctx.createLinearGradient(0, 0, RECEIPT_W, 0);
  paper.addColorStop(0, '#e9e6dc');
  paper.addColorStop(0.1, '#f8f6ee');
  paper.addColorStop(0.55, '#fdfcf6');
  paper.addColorStop(0.92, '#f5f3ea');
  paper.addColorStop(1, '#e2dfd4');
  ctx.fillStyle = paper;
  ctx.fill();

  ctx.save();
  ctx.clip();

  // Soft creases from being pulled off the roll
  [96, 247, 318].forEach((y) => {
    const crease = ctx.createLinearGradient(0, y - 7, 0, y + 7);
    crease.addColorStop(0, 'rgba(90,80,60,0)');
    crease.addColorStop(0.5, 'rgba(90,80,60,0.045)');
    crease.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = crease;
    ctx.fillRect(0, y - 7, RECEIPT_W, 14);
  });

  const ink = '#26241f';
  const soft = '#46423a';
  const L = 20;
  const R = RECEIPT_W - 20;
  const font = (weight: number, size: number) => `${weight} ${size}px ${monoFamily}`;
  const text = (s: string, x: number, y: number, align: CanvasTextAlign, f: string, color = ink) => {
    ctx.font = f;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };
  const rule = (y: number, solid = false) => {
    ctx.strokeStyle = 'rgba(38,36,31,0.55)';
    ctx.lineWidth = solid ? 1.2 : 0.8;
    ctx.setLineDash(solid ? [] : [3, 3]);
    ctx.beginPath();
    ctx.moveTo(L, y);
    ctx.lineTo(R, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  text(BILL.merchant, RECEIPT_W / 2, 36, 'center', font(600, 19));
  text('Indiranagar, Bengaluru', RECEIPT_W / 2, 53, 'center', font(400, 10.5), soft);
  rule(66);
  text('TABLE 12', L, 84, 'left', font(500, 10.5));
  text('4 GUESTS', R, 84, 'right', font(500, 10.5));
  text('06 NOV 2026', L, 100, 'left', font(400, 10.5), soft);
  text('9:41 PM', R, 100, 'right', font(400, 10.5), soft);
  rule(112);
  text('ITEM', L, 129, 'left', font(600, 9.5), soft);
  text('QTY', 176, 129, 'right', font(600, 9.5), soft);
  text('AMOUNT', R, 129, 'right', font(600, 9.5), soft);

  BILL.items.forEach((item, i) => {
    const y = ROWS_START + i * ROW_STEP;
    text(item.name, L, y, 'left', font(500, 12));
    text(String(item.qty), 176, y, 'right', font(500, 12));
    text(money(item.amount), R, y, 'right', font(500, 12));
  });

  rule(254);
  text('Subtotal', L, 272, 'left', font(400, 11));
  text(money(BILL.subtotal), R, 272, 'right', font(400, 11));
  text('CGST 2.5%', L, 288, 'left', font(400, 11), soft);
  text(money(BILL.cgst), R, 288, 'right', font(400, 11), soft);
  text('SGST 2.5%', L, 304, 'left', font(400, 11), soft);
  text(money(BILL.sgst), R, 304, 'right', font(400, 11), soft);
  rule(318, true);
  text('TOTAL', L, TOTAL_Y, 'left', font(600, 17));
  text(`₹${money(BILL.total)}`, R, TOTAL_Y, 'right', font(600, 17));
  rule(354, true);

  // Decorative barcode with a fixed pattern, so it never changes between renders
  const pattern = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 1, 3, 2, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2];
  let bx = RECEIPT_W / 2 - pattern.reduce((a, b) => a + b, 0) * 0.78;
  ctx.fillStyle = ink;
  pattern.forEach((width, i) => {
    const barWidth = width * 1.56;
    if (i % 2 === 0) ctx.fillRect(bx, 366, barWidth, 24);
    bx += barWidth;
  });

  text('THANK YOU  ·  VISIT AGAIN', RECEIPT_W / 2, 408, 'center', font(500, 9.5), soft);
  ctx.restore();
}
