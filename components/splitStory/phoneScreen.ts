import { BILL, MODE_LABELS, PEOPLE, TO_COLLECT, inr } from './splitData';
import { OCR_ROWS, RECEIPT_H, RECEIPT_W } from './receipt';

// Everything the phone's screen shows during the story. The scroll timeline tweens these
// numbers; drawPhoneScreen turns them into a frame of the app.
export function initialScreenState() {
  return {
    home: 0, // the app's home screen fading up
    scanCta: 0,
    tapScan: 0,
    camera: 0, // iris opening from the Scan button
    lock: 0, // camera settling onto the bill
    sweep: 0,
    review: 0,
    reviewRows: 0,
    reviewTotal: 0,
    tapReview: 0,
    create: 0, // Split & Share opening
    amount: 0,
    nameChars: 0,
    tapFriend: 0,
    friend: 0,
    tapGroups: 0,
    groups: 0,
    tapMode: 0,
    mode: 0, // 0 Equal, 1 Dutch
    tapSplit: 0,
    sent: 0,
  };
}
export type ScreenState = ReturnType<typeof initialScreenState>;

export interface ScreenAssets {
  hero: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  avatars: Record<string, HTMLImageElement>;
  receipt: HTMLCanvasElement | null;
  sans: string;
}

// Colours sampled from the real Split Share screen
const C = {
  sheet: '#16171b',
  raised: '#222328',
  tile: '#1f2025',
  line: '#303136',
  accent: '#6366f1',
  accentDim: '#2c2d58',
  muted: '#85868c',
  white: '#ffffff',
  green: '#34d399',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// What each person owes right now: half with one friend, then Equal, then Dutch.
export function personAmount(index: number, s: Pick<ScreenState, 'groups' | 'mode'>) {
  const person = PEOPLE[index];
  const equal = index < 2 ? lerp(BILL.total / 2, person.equal, s.groups) : person.equal;
  return lerp(equal, person.dutch, s.mode);
}

export function drawPhoneScreen(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: ScreenState,
  a: ScreenAssets
) {
  const F = (weight: number, size: number) => `${weight} ${size}px ${a.sans}`;

  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const text = (str: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(str, x, y);
  };
  const tap = (x: number, y: number, t: number) => {
    if (t <= 0 || t >= 1) return;
    ctx.save();
    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.9;
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = (1 - t) * 0.8;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 30 + easeOut(t) * 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  const avatar = (id: string, x: number, y: number, r: number) => {
    const img = a.avatars[id];
    if (img?.complete && img.naturalWidth > 0) ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  };
  const scanIcon = (cx: number, cy: number, size: number, color: string) => {
    const k = size / 2;
    const arm = size * 0.3;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => {
      ctx.moveTo(cx + dx * k, cy + dy * (k - arm));
      ctx.lineTo(cx + dx * k, cy + dy * k);
      ctx.lineTo(cx + dx * (k - arm), cy + dy * k);
    });
    ctx.moveTo(cx - k * 0.6, cy);
    ctx.lineTo(cx + k * 0.6, cy);
    ctx.stroke();
    ctx.restore();
  };

  // ---- Home: the app, waiting for a bill ----
  const drawHome = () => {
    const bg = ctx.createRadialGradient(W / 2, H * 0.36, 40, W / 2, H * 0.36, H * 0.75);
    bg.addColorStop(0, '#34367a');
    bg.addColorStop(0.55, '#191a2c');
    bg.addColorStop(1, '#101016');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (a.logo?.complete && a.logo.naturalWidth > 0) {
      const size = 210;
      ctx.drawImage(a.logo, W / 2 - size / 2, 330, size, size);
    }
    text('Got a bill?', W / 2, 640, F(600, 52), C.white, 'center');
    text('Scan it and split it.', W / 2, 696, F(400, 29), C.muted, 'center');

    if (s.scanCta > 0) {
      ctx.save();
      ctx.globalAlpha = s.scanCta;
      ctx.translate(0, (1 - s.scanCta) * 24);
      rr(W / 2 - 150, 800, 300, 92, 46);
      ctx.fillStyle = C.accent;
      ctx.shadowColor = 'rgba(99,102,241,0.65)';
      ctx.shadowBlur = 44;
      ctx.fill();
      ctx.shadowBlur = 0;
      scanIcon(W / 2 - 88, 846, 34, C.white);
      text('Scan bill', W / 2 - 52, 858, F(600, 33), C.white);
      ctx.restore();
    }
    tap(W / 2, 846, s.tapScan);
  };

  // ---- Camera: live view of the receipt with OCR running ----
  const drawCamera = () => {
    const bg = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, H * 0.72);
    bg.addColorStop(0, '#3a3530');
    bg.addColorStop(1, '#0d0c0b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const lock = easeOut(s.lock);
    const scale = lerp(1.62, 1.92, lock);
    const rw = RECEIPT_W * scale;
    const rh = RECEIPT_H * scale;
    const rx = (W - rw) / 2 + (1 - lock) * 46;
    const ry = 150 + (RECEIPT_H * 1.92 - rh) / 2;

    ctx.save();
    ctx.translate(W / 2, ry + rh / 2);
    ctx.rotate((1 - lock) * -0.1);
    ctx.translate(-W / 2, -(ry + rh / 2));
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetY = 0;
    if (a.receipt) {
      // Drawn in thin strips that narrow and darken towards its ends, so it reads as a
      // sheet curving away from the camera rather than a flat picture
      const source = a.receipt;
      const strips = 60;
      for (let i = 0; i < strips; i++) {
        const t = i / strips;
        const bend = Math.pow(Math.abs(t - 0.45) / 0.55, 2.4);
        const inset = rw * 0.035 * bend;
        const sy = t * source.height;
        const dy = ry + t * rh;
        const stripH = rh / strips + 0.6;
        ctx.drawImage(source, 0, sy, source.width, source.height / strips, rx + inset, dy, rw - inset * 2, stripH);
        ctx.fillStyle = `rgba(40,32,20,${0.17 * bend})`;
        ctx.fillRect(rx + inset + 4, dy, rw - inset * 2 - 8, stripH);
      }
    }

    // Lines the OCR has already passed over
    OCR_ROWS.forEach((rowY, i) => {
      const seen = clamp01((s.sweep - rowY / RECEIPT_H) * 22);
      if (seen <= 0) return;
      const isTotal = i === OCR_ROWS.length - 1;
      ctx.globalAlpha = seen;
      rr(rx + 10 * scale, ry + (rowY - (isTotal ? 17 : 13)) * scale, rw - 20 * scale, (isTotal ? 24 : 18) * scale, 9);
      ctx.fillStyle = 'rgba(99,102,241,0.2)';
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Scan line with its trailing glow
    if (s.sweep > 0 && s.sweep < 1) {
      const y = ry + rh * s.sweep;
      const glow = ctx.createLinearGradient(0, y - 120, 0, y);
      glow.addColorStop(0, 'rgba(99,102,241,0)');
      glow.addColorStop(1, 'rgba(99,102,241,0.42)');
      ctx.fillStyle = glow;
      ctx.fillRect(rx, Math.max(ry, y - 120), rw, Math.min(120, y - ry));
      ctx.fillStyle = '#c7c9ff';
      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 26;
      ctx.fillRect(rx - 14, y - 2, rw + 28, 4);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // Corner brackets close in and lock onto the bill
    const pad = lerp(64, 16, lock);
    const left = W / 2 - RECEIPT_W * 0.96 - pad;
    const right = W / 2 + RECEIPT_W * 0.96 + pad;
    const top = 150 - pad;
    const bottom = 150 + RECEIPT_H * 1.92 + pad;
    const arm = 54;
    ctx.save();
    ctx.strokeStyle = s.lock >= 1 ? C.accent : C.white;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ([[left, top, 1, 1], [right, top, -1, 1], [right, bottom, -1, -1], [left, bottom, 1, -1]] as const).forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * arm);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * arm, y);
      ctx.stroke();
    });
    ctx.restore();

    // Top bar
    const topShade = ctx.createLinearGradient(0, 0, 0, 130);
    topShade.addColorStop(0, 'rgba(0,0,0,0.75)');
    topShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, W, 130);
    text('Scan bill', W / 2, 92, F(600, 30), C.white, 'center');

    // Reading progress
    const found = OCR_ROWS.slice(0, BILL.items.length).filter((rowY) => s.sweep > rowY / RECEIPT_H).length;
    const done = s.sweep >= 0.99;
    const panelY = H - 270;
    rr(36, panelY, W - 72, 170, 40);
    ctx.fillStyle = 'rgba(18,18,23,0.93)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(done ? 'Bill read' : s.sweep > 0 ? 'Reading bill…' : 'Finding the bill…', 76, panelY + 66, F(600, 31), C.white);
    text(`${found} of ${BILL.items.length} items`, W - 76, panelY + 66, F(500, 26), done ? C.green : C.muted, 'right');
    rr(76, panelY + 104, W - 152, 12, 6);
    ctx.fillStyle = C.raised;
    ctx.fill();
    if (s.sweep > 0) {
      rr(76, panelY + 104, Math.max(12, (W - 152) * s.sweep), 12, 6);
      ctx.fillStyle = done ? C.green : C.accent;
      ctx.fill();
    }
  };

  // ---- Review: what the OCR entered ----
  const drawReview = () => {
    const y0 = lerp(H, 150, easeOut(s.review));
    ctx.save();
    ctx.fillStyle = `rgba(5,5,8,${0.94 * s.review})`;
    ctx.fillRect(0, 0, W, H);
    rr(0, y0, W, H - y0 + 60, 46);
    ctx.fillStyle = C.sheet;
    ctx.fill();
    ctx.translate(0, y0 - 150);

    rr(W / 2 - 40, 172, 80, 7, 4);
    ctx.fillStyle = C.line;
    ctx.fill();
    text('Bill scanned', 44, 258, F(600, 41), C.white);
    text(`${BILL.splitName}  ·  ${BILL.items.length} items`, 44, 304, F(400, 26), C.muted);
    rr(W - 164, 222, 120, 50, 25);
    ctx.fillStyle = 'rgba(52,211,153,0.14)';
    ctx.fill();
    text('OCR', W - 104, 257, F(600, 25), C.green, 'center');

    BILL.items.forEach((item, i) => {
      const t = clamp01(s.reviewRows - i);
      if (t <= 0) return;
      const y = 340 + i * 100;
      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate((1 - easeOut(t)) * 44, 0);
      rr(36, y, W - 72, 88, 22);
      ctx.fillStyle = C.tile;
      ctx.fill();
      text(item.name, 64, y + 40, F(500, 28), C.white);
      text(`Qty ${item.qty}`, 64, y + 70, F(400, 20), C.muted);
      text(inr(item.amount, 0), W - 64, y + 54, F(600, 29), C.white, 'right');
      ctx.restore();
    });

    ctx.globalAlpha = clamp01(s.reviewRows - BILL.items.length);
    text('CGST + SGST', 64, 878, F(400, 26), C.muted);
    text(inr(BILL.cgst + BILL.sgst, 0), W - 64, 878, F(500, 26), C.muted, 'right');
    ctx.globalAlpha = 1;

    rr(36, 914, W - 72, 130, 28);
    ctx.fillStyle = C.accentDim;
    ctx.fill();
    text('Total', 68, 992, F(500, 32), C.white);
    text(inr(s.reviewTotal), W - 68, 998, F(700, 46), C.white, 'right');

    ctx.globalAlpha = clamp01(s.reviewTotal / BILL.total);
    rr(36, 1070, W - 72, 92, 46);
    ctx.fillStyle = C.accent;
    ctx.fill();
    text('Split this bill', W / 2, 1128, F(600, 31), C.white, 'center');
    ctx.globalAlpha = 1;
    tap(W / 2, 1116, s.tapReview);
    ctx.restore();
  };

  // ---- Split Share: rebuilt from the real screen, so it can respond ----
  const drawCreate = () => {
    ctx.fillStyle = '#a493d7';
    ctx.fillRect(0, 0, W, 400);
    if (a.hero?.complete && a.hero.naturalWidth > 0) {
      ctx.drawImage(a.hero, 0, 64, W, 300, 0, 64, W, 300);
    }
    rr(0, 351, W, H - 300, 46);
    ctx.fillStyle = C.sheet;
    ctx.fill();

    // Back, title, history
    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(55, 387);
    ctx.lineTo(41, 401);
    ctx.lineTo(55, 415);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(582, 401, 15, -Math.PI * 0.75, Math.PI * 0.9);
    ctx.moveTo(582, 392);
    ctx.lineTo(582, 402);
    ctx.lineTo(589, 406);
    ctx.stroke();
    ctx.restore();
    text('Split Share', W / 2, 412, F(600, 31), C.white, 'center');

    // Tabs, with the underline sliding to Groups
    const groupsT = easeOut(s.groups);
    [
      { label: 'Create', x: 133, on: 1 - groupsT },
      { label: 'Groups', x: 331, on: groupsT },
      { label: 'Split', x: 512, on: 0 },
    ].forEach((tab) => {
      text(tab.label, tab.x, 484, F(tab.on > 0.5 ? 600 : 500, 25), tab.on > 0.5 ? C.white : C.muted, 'center');
    });
    rr(lerp(133, 331, groupsT) - 27, 500, 54, 5, 3);
    ctx.fillStyle = C.accent;
    ctx.fill();
    tap(331, 475, s.tapGroups);

    // Equal / Dutch toggle
    rr(36, 547, 558, 66, 33);
    ctx.fillStyle = C.raised;
    ctx.fill();
    rr(lerp(36, 315, easeOut(s.mode)), 547, 279, 66, 33);
    ctx.fillStyle = C.accent;
    ctx.fill();
    text(MODE_LABELS.equal, 175, 589, F(600, 23), s.mode < 0.5 ? C.white : C.muted, 'center');
    text(MODE_LABELS.dutch, 454, 589, F(600, 23), s.mode >= 0.5 ? C.white : C.muted, 'center');
    tap(454, 580, s.tapMode);

    // Create tab
    if (s.groups < 1) {
      ctx.save();
      const tabAlpha = 1 - s.groups;
      ctx.globalAlpha = tabAlpha;
      text('Enter Amount', W / 2, 689, F(500, 22), C.muted, 'center');
      text(inr(s.amount), W / 2, 760, F(700, 58), C.white, 'center');

      rr(120, 802, 390, 66, 18);
      ctx.fillStyle = C.raised;
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      const typed = BILL.splitName.slice(0, Math.round(s.nameChars));
      text(typed || 'Enter Split Name', W / 2, 845, F(500, 23), typed ? C.white : C.muted, 'center');

      rr(210, 890, 210, 66, 33);
      ctx.fillStyle = C.accent;
      ctx.fill();
      text('Split', W / 2, 933, F(600, 25), C.white, 'center');

      if (s.friend > 0) {
        ctx.globalAlpha = tabAlpha * s.friend;
        text(`${inr(BILL.total / 2)} each with Atharva`, W / 2, 1002, F(500, 23), C.green, 'center');
        ctx.globalAlpha = tabAlpha;
      }

      text('Find Friends', 36, 1079, F(600, 28), C.white);
      const tiles = [36, 204, 372, 540];
      rr(tiles[0], 1128, 150, 148, 28);
      ctx.fillStyle = C.tile;
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tiles[0] + 75, 1202, 33, 0, Math.PI * 2);
      ctx.fillStyle = C.accentDim;
      ctx.fill();
      text('+', tiles[0] + 75, 1216, F(400, 40), C.accent, 'center');

      PEOPLE.slice(1).forEach((person, i) => {
        const x = tiles[i + 1];
        const picked = i === 0 ? s.friend : 0;
        rr(x, 1128, 150, 148, 28);
        ctx.fillStyle = C.tile;
        ctx.fill();
        ctx.strokeStyle = picked > 0.01 ? C.accent : C.line;
        ctx.lineWidth = lerp(1.5, 3.5, picked);
        ctx.stroke();
        avatar(person.id, x + 75, 1185, 36);
        text(person.name, x + 75, 1252, F(500, 19), C.white, 'center');
        if (picked > 0.01) {
          ctx.beginPath();
          ctx.arc(x + 124, 1152, 15 * easeOut(picked), 0, Math.PI * 2);
          ctx.fillStyle = C.accent;
          ctx.fill();
          ctx.strokeStyle = C.white;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x + 117, 1152);
          ctx.lineTo(x + 122, 1158);
          ctx.lineTo(x + 131, 1147);
          ctx.stroke();
        }
      });
      tap(279, 1190, s.tapFriend);
      ctx.restore();
    }

    // Groups tab
    if (s.groups > 0) {
      ctx.save();
      ctx.globalAlpha = s.groups;
      ctx.translate((1 - groupsT) * 50, 0);
      text(BILL.groupName, 36, 672, F(600, 31), C.white);
      text(`${PEOPLE.length} members  ·  ${inr(BILL.total)}`, 36, 710, F(400, 23), C.muted);

      PEOPLE.forEach((person, i) => {
        const y = 740 + i * 118;
        const amount = personAmount(i, s);
        rr(36, y, 558, 106, 24);
        ctx.fillStyle = C.tile;
        ctx.fill();
        avatar(person.id, 92, y + 53, 34);
        text(person.name, 144, y + 46, F(500, 25), C.white);
        rr(144, y + 66, 270, 10, 5);
        ctx.fillStyle = C.raised;
        ctx.fill();
        rr(144, y + 66, Math.max(10, 270 * Math.min(1, amount / 800)), 10, 5);
        ctx.fillStyle = C.accent;
        ctx.fill();
        text(inr(Math.round(amount), 0), 568, y + 65, F(600, 29), C.white, 'right');
      });

      rr(210, 1228, 210, 66, 33);
      ctx.fillStyle = C.accent;
      ctx.fill();
      text('Split', W / 2, 1271, F(600, 25), C.white, 'center');
      tap(W / 2, 1261, s.tapSplit);
      ctx.restore();
    }
  };

  // ---- Sent ----
  const drawSent = () => {
    ctx.save();
    const base = clamp01(s.sent * 2);
    ctx.globalAlpha = base;
    rr(0, 351, W, H - 300, 46);
    ctx.fillStyle = C.sheet;
    ctx.fill();

    const cx = W / 2;
    const cy = 590;
    ctx.beginPath();
    ctx.arc(cx, cy, 86 * easeOut(s.sent), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52,211,153,0.15)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 86, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp01(s.sent * 1.4));
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();
    const check = clamp01((s.sent - 0.5) * 2);
    if (check > 0) {
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 36, cy + 2);
      if (check < 0.4) {
        ctx.lineTo(cx - 36 + 26 * (check / 0.4), cy + 2 + 28 * (check / 0.4));
      } else {
        const k = (check - 0.4) / 0.6;
        ctx.lineTo(cx - 10, cy + 30);
        ctx.lineTo(cx - 10 + 50 * k, cy + 30 - 58 * k);
      }
      ctx.stroke();
    }

    text('Split sent', cx, 738, F(600, 44), C.white, 'center');
    text(`${inr(TO_COLLECT)} to collect`, cx, 786, F(400, 26), C.muted, 'center');

    PEOPLE.slice(1).forEach((person, i) => {
      const y = 840 + i * 118;
      const rowT = clamp01((s.sent - 0.45 - i * 0.14) * 5);
      if (rowT <= 0) return;
      ctx.save();
      ctx.globalAlpha = base * rowT;
      ctx.translate(0, (1 - easeOut(rowT)) * 26);
      rr(36, y, 558, 104, 24);
      ctx.fillStyle = C.tile;
      ctx.fill();
      avatar(person.id, 92, y + 52, 34);
      text(person.name, 144, y + 46, F(500, 25), C.white);
      text('Request sent', 144, y + 78, F(400, 21), C.green);
      text(inr(person.dutch, 0), 568, y + 62, F(600, 29), C.white, 'right');
      ctx.restore();
    });
    ctx.restore();
  };

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (s.create < 1) {
    // The home screen opens outward over the feature screenshot the phone was already showing
    if (s.home < 1) {
      ctx.fillStyle = '#a493d7';
      ctx.fillRect(0, 0, W, H);
      if (a.hero?.complete && a.hero.naturalWidth > 0) {
        ctx.drawImage(a.hero, 0, 64, W, H - 64, 0, 64, W, H - 64);
      }
    }
    ctx.save();
    if (s.home < 1) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, s.home * H * 0.62, 0, Math.PI * 2);
      ctx.clip();
    }
    drawHome();
    ctx.restore();
    if (s.camera > 0) {
      // Iris opening out from the Scan button
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, 846, s.camera * H * 1.1, 0, Math.PI * 2);
      ctx.clip();
      drawCamera();
      if (s.review > 0) drawReview();
      ctx.restore();
    }
  }
  if (s.create > 0) {
    // Split & Share opens outward from the button that was tapped
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, 1116, s.create * H * 0.95, 0, Math.PI * 2);
    ctx.clip();
    drawCreate();
    if (s.sent > 0) drawSent();
    ctx.restore();
  }
  ctx.restore();
}
