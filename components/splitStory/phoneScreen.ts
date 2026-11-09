import { BILL, EQUAL, EQUAL_MEMBERS, FRIEND_LIST, ITEM_OWNERS, MODE_LABELS, PEOPLE, TO_COLLECT, inr } from './splitData';
import { OCR_ROWS, RECEIPT_H, RECEIPT_W } from './receipt';

// Everything the phone's screen shows during the story. The scroll timeline tweens these
// numbers; drawPhoneScreen turns them into a frame of the app. Screens are listed in the
// order the story reaches them, and each one's reveal goes 0 to 1 as it takes over.
export function initialScreenState() {
  return {
    // ---- Equal ----
    create: 0, // Split Share's Create tab, over the screenshot the phone was showing
    amountChars: 0, // digits of the amount keyed in
    nameChars: 0,
    tapSplit: 0,
    friends: 0, // Select Friends sliding in
    tapPick1: 0,
    pick1: 0,
    tapPick2: 0,
    pick2: 0,
    tapNext: 0,
    payer: 0, // Who Paid? sliding in
    tapPayer: 0,
    payerPick: 0,
    tapSubmit: 0,
    receipt: 0, // the split bill receipt rising up
    receiptRows: 0,
    eqStatus: 0, // Paid / Unpaid stamped on
    tapBack: 0,
    // ---- Dutch ----
    back: 0, // Create tab again, sliding back in
    tapMode: 0,
    mode: 0, // 0 Equal, 1 Dutch
    home: 0, // "Got a bill?" opening out of the Dutch toggle
    scanCta: 0,
    tapScan: 0,
    camera: 0, // iris opening from the Scan button
    lock: 0, // camera settling onto the bill
    sweep: 0,
    review: 0,
    reviewRows: 0,
    reviewTotal: 0,
    tapReview: 0,
    tagged: 0, // items tagged to a person, one by one
    tapSend: 0,
    sent: 0,
    // ---- Only for the cards around the phone ----
    eqShare: 0, // equal shares counting up on the cards
    dutch: 0, // the cards switch over to Dutch amounts
    assign: 0, // items landed on the cards
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

// Colours sampled from the real Split Share screens
const C = {
  sheet: '#16171b',
  page: '#131418',
  raised: '#222328',
  tile: '#1f2025',
  line: '#303136',
  outline: '#55565c',
  accent: '#6366f1',
  accentDim: '#2c2d58',
  nextDim: '#383a7a',
  muted: '#85868c',
  white: '#ffffff',
  green: '#34d399',
  red: '#f05252',
  lilac: '#a493d7',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeBack = (t: number) => {
  const x = clamp01(t) - 1;
  return 1 + 2.4 * x * x * x + 1.4 * x * x;
};

// The amount as it reads while being typed, e.g. "2,500"
export const typedAmount = (chars: number) => {
  const digits = EQUAL.typed.slice(0, Math.round(chars));
  return digits ? Number(digits).toLocaleString('en-IN') : '';
};

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
  const spaced = (str: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign, spacing: number) => {
    const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    const before = c.letterSpacing;
    if (before !== undefined) c.letterSpacing = `${spacing}px`;
    text(str, x, y, font, color, align);
    if (before !== undefined) c.letterSpacing = before;
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
  const tick = (x: number, y: number, size: number, color: string, width = 3.5) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.45, y);
    ctx.lineTo(x - size * 0.12, y + size * 0.33);
    ctx.lineTo(x + size * 0.48, y - size * 0.32);
    ctx.stroke();
    ctx.restore();
  };
  // A filled circle with a tick, popping in as t goes to 1
  const checkDot = (x: number, y: number, r: number, t: number) => {
    if (t <= 0.01) return;
    const k = easeBack(t);
    ctx.beginPath();
    ctx.arc(x, y, r * k, 0, Math.PI * 2);
    ctx.fillStyle = C.accent;
    ctx.fill();
    if (t > 0.4) tick(x, y, r * 1.05 * k, C.white, 3);
  };
  const pencil = (x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = C.white;
    rr(-size * 0.5, -size * 0.11, size * 0.82, size * 0.22, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.38, -size * 0.11);
    ctx.lineTo(size * 0.56, 0);
    ctx.lineTo(size * 0.38, size * 0.11);
    ctx.fill();
    ctx.restore();
  };
  const chevron = (y: number) => {
    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(55, y - 14);
    ctx.lineTo(41, y);
    ctx.lineTo(55, y + 14);
    ctx.stroke();
    ctx.restore();
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
  const heroReady = () => !!a.hero?.complete && (a.hero?.naturalWidth ?? 0) > 0;

  // The illustrated banner and the dark sheet over it, which sits higher once inside a flow
  const banner = (sheetTop: number) => {
    ctx.fillStyle = C.lilac;
    ctx.fillRect(0, 0, W, sheetTop + 60);
    if (heroReady()) ctx.drawImage(a.hero!, 0, 0, W, sheetTop + 50, 0, 0, W, sheetTop + 50);
    rr(0, sheetTop, W, H - sheetTop + 60, 46);
    ctx.fillStyle = C.sheet;
    ctx.fill();
  };

  // ---- The screenshot the slideshow left on the phone ----
  const drawHero = () => {
    ctx.fillStyle = C.lilac;
    ctx.fillRect(0, 0, W, H);
    if (heroReady()) ctx.drawImage(a.hero!, 0, 0, W, H);
  };

  // ---- Split Share, Create tab: rebuilt from the real screen, so it can respond ----
  const drawCreate = () => {
    banner(351);

    chevron(401);
    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(582, 401, 15, -Math.PI * 0.75, Math.PI * 0.9);
    ctx.moveTo(582, 392);
    ctx.lineTo(582, 402);
    ctx.lineTo(589, 406);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(425, 401, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    text('Split Share', 315, 412, F(600, 31), C.white, 'center');
    text('?', 425, 409, F(600, 17), C.white, 'center');

    [
      { label: 'Create', x: 133, on: true },
      { label: 'Groups', x: 331, on: false },
      { label: 'Split', x: 512, on: false },
    ].forEach((tab) => text(tab.label, tab.x, 484, F(tab.on ? 600 : 500, 25), tab.on ? C.white : C.muted, 'center'));
    rr(133 - 27, 500, 54, 5, 3);
    ctx.fillStyle = C.accent;
    ctx.fill();

    // Equal / Dutch toggle
    const modeT = easeOut(s.mode);
    rr(36, 547, 558, 66, 33);
    ctx.fillStyle = C.raised;
    ctx.fill();
    rr(lerp(36, 315, modeT), 547, 279, 66, 33);
    ctx.fillStyle = C.accent;
    ctx.fill();
    text(MODE_LABELS.equal, 175, 589, F(600, 23), s.mode < 0.5 ? C.white : C.muted, 'center');
    text(MODE_LABELS.dutch, 454, 589, F(600, 23), s.mode >= 0.5 ? C.white : C.muted, 'center');

    // Amount: the app's ₹100.00 placeholder until digits are keyed in
    text('Enter Amount', 315, 689, F(500, 22), C.muted, 'center');
    const typed = typedAmount(s.amountChars);
    ctx.font = F(700, 62);
    const sym = '₹';
    const body = typed || '100.00';
    const symW = ctx.measureText(sym).width;
    const bodyW = ctx.measureText(body).width;
    const startX = 315 - (symW + 6 + bodyW) / 2 - 16;
    text(sym, startX, 762, F(700, 62), C.white);
    text(body, startX + symW + 6, 762, F(700, 62), typed ? C.white : '#5c5d63');
    const caretOn = s.amountChars > 0.2 && s.amountChars < EQUAL.typed.length - 0.2;
    if (caretOn) {
      rr(startX + symW + 10 + bodyW, 714, 4, 56, 2);
      ctx.fillStyle = C.accent;
      ctx.fill();
    }
    pencil(startX + symW + 6 + bodyW + 34, 742, 30);

    rr(120, 802, 390, 66, 18);
    ctx.fillStyle = C.raised;
    ctx.fill();
    ctx.strokeStyle = s.nameChars > 0 && s.nameChars < EQUAL.splitName.length ? C.accent : C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    const name = EQUAL.splitName.slice(0, Math.round(s.nameChars));
    text(name || 'Enter Split Name', 315, 845, F(500, 23), name ? C.white : C.muted, 'center');

    rr(210, 890, 210, 66, 33);
    ctx.fillStyle = C.accent;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    text('Split', 315, 933, F(600, 25), C.white, 'center');
    text('How does it work  ⓘ', 315, 993, F(400, 19), C.muted, 'center');

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
      rr(x, 1128, 150, 148, 28);
      ctx.fillStyle = C.tile;
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      avatar(person.id, x + 75, 1185, 36);
      text(person.name, x + 75, 1252, F(500, 19), C.white, 'center');
    });

    tap(315, 923, s.tapSplit);
    tap(454, 580, s.tapMode);
  };

  // ---- Select Friends ----
  const drawFriends = () => {
    banner(263);
    chevron(314);
    text('Select Friends', 315, 325, F(600, 31), C.white, 'center');

    rr(39, 368, 551, 70, 35);
    ctx.fillStyle = C.raised;
    ctx.fill();
    rr(44, 373, 270, 60, 30);
    ctx.fillStyle = C.accent;
    ctx.fill();
    text('Friends', 179, 412, F(600, 24), C.white, 'center');
    text('Groups', 450, 412, F(500, 24), C.muted, 'center');

    rr(39, 469, 479, 64, 32);
    ctx.fillStyle = C.sheet;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(73, 497, 10, 0, Math.PI * 2);
    ctx.moveTo(80, 504);
    ctx.lineTo(88, 512);
    ctx.stroke();
    ctx.restore();
    text('Search for Friend', 106, 509, F(400, 23), C.muted);
    rr(527, 469, 63, 64, 22);
    ctx.fillStyle = C.accent;
    ctx.fill();
    text('+', 558, 516, F(400, 40), C.white, 'center');

    const picks = [s.pick1, s.pick2];
    FRIEND_LIST.forEach((friend, i) => {
      const y = 559 + i * 126;
      const picked = friend.pick >= 0 ? picks[friend.pick] : 0;
      rr(39, y, 551, 107, 24);
      ctx.fillStyle = picked > 0.01 ? '#1e1f2b' : C.tile;
      ctx.fill();
      if (picked > 0.01) {
        ctx.save();
        ctx.globalAlpha = clamp01(picked * 1.5);
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
      if (friend.letter) {
        ctx.beginPath();
        ctx.arc(85, y + 53, 32, 0, Math.PI * 2);
        ctx.fillStyle = '#8b7fe0';
        ctx.fill();
        text(friend.letter, 85, y + 63, F(600, 27), C.white, 'center');
      } else {
        avatar(friend.id, 85, y + 53, 32);
      }
      text(friend.name, 129, y + 63, F(500, 27), C.white);
      ctx.beginPath();
      ctx.arc(556, y + 53, 19, 0, Math.PI * 2);
      ctx.fillStyle = '#34353b';
      ctx.fill();
      checkDot(556, y + 53, 19, picked);
    });

    rr(39, 1199, 551, 80, 40);
    ctx.fillStyle = C.nextDim;
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = clamp01(s.pick1);
    ctx.fillStyle = C.accent;
    ctx.fill();
    ctx.restore();
    text('Next', 315, 1249, F(600, 27), C.white, 'center');

    tap(315, 559 + 53, s.tapPick1);
    tap(315, 559 + 2 * 126 + 53, s.tapPick2);
    tap(315, 1239, s.tapNext);
  };

  // ---- Who Paid? ----
  const drawPayer = () => {
    banner(263);
    chevron(314);
    text('Who Paid?', 315, 325, F(600, 31), C.white, 'center');

    PEOPLE.slice(0, EQUAL_MEMBERS).forEach((person, i) => {
      const y = 433 + i * 92;
      const picked = i === 0 ? s.payerPick : 0;
      if (picked > 0.01) {
        ctx.beginPath();
        ctx.arc(97, y, 32 + 5 * easeOut(picked), 0, Math.PI * 2);
        ctx.fillStyle = C.accent;
        ctx.fill();
      }
      avatar(person.id, 97, y, 32);
      text(person.fullName, 157, y + 10, F(picked > 0.5 ? 700 : 500, 27), C.white);
      ctx.beginPath();
      ctx.arc(532, y, 16, 0, Math.PI * 2);
      ctx.strokeStyle = '#8a8a90';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      checkDot(532, y, 17, picked);
    });

    rr(39, 692, 551, 80, 40);
    ctx.fillStyle = C.accent;
    ctx.fill();
    text('Submit', 315, 743, F(600, 27), C.white, 'center');

    tap(315, 433, s.tapPayer);
    tap(315, 732, s.tapSubmit);
  };

  // ---- Split bill receipt ----
  const drawReceipt = () => {
    ctx.fillStyle = C.page;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.lilac;
    ctx.fillRect(0, 0, W, 76);

    rr(30, 96, 570, 150, 30);
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    text('Insert image', 315, 166, F(400, 23), C.muted, 'center');
    text('of bill', 315, 196, F(400, 23), C.muted, 'center');

    rr(30, 272, 570, 170, 30);
    ctx.fillStyle = C.raised;
    ctx.fill();
    rr(287, 288, 56, 6, 3);
    ctx.fillStyle = '#4a4b51';
    ctx.fill();
    rr(58, 322, 24, 30, 4);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    text(EQUAL.splitName, 101, 347, F(600, 27), C.white);
    ctx.beginPath();
    ctx.arc(552, 337, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#34353b';
    ctx.fill();
    pencil(552, 337, 22);

    // The receipt itself, its purple top printing down first
    const print = easeOut(clamp01(s.receipt * 1.6 - 0.3));
    const top = 378;
    const headH = 198 * print;
    ctx.save();
    rr(55, top, 520, 652, 4);
    ctx.clip();
    ctx.fillStyle = '#1b1c21';
    ctx.fillRect(55, top, 520, 652);
    ctx.fillStyle = C.accent;
    ctx.fillRect(55, top, 520, headH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(55, top, 520, headH);
    ctx.clip();
    spaced('SPLIT BILL RECEIPT', 315, 424, F(600, 19), 'rgba(255,255,255,0.85)', 'center', 2);
    text(inr(EQUAL.amount), 315, 502, F(700, 54), C.white, 'center');
    text(`${EQUAL_MEMBERS} members sharing`, 315, 544, F(400, 22), 'rgba(255,255,255,0.85)', 'center');
    ctx.restore();

    spaced('MEMBERS SHARE', 88, 630, F(600, 18), C.muted, 'left', 1.5);
    PEOPLE.slice(0, EQUAL_MEMBERS).forEach((person, i) => {
      const t = clamp01(s.receiptRows - i);
      if (t <= 0) return;
      const y = 690 + i * 96;
      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate((1 - easeOut(t)) * 30, 0);
      text(i === 0 ? 'You' : person.fullName, 88, y, F(500, 25), C.white);
      text(inr(EQUAL.shares[i]), 543, y + 16, F(600, 24), C.white, 'right');
      // Paid / Unpaid stamped in, slightly late for each
      const stamp = clamp01((s.eqStatus - i * 0.15) * 2.4);
      if (stamp > 0) {
        const k = lerp(1.8, 1, easeOut(stamp));
        ctx.globalAlpha = t * stamp;
        ctx.save();
        ctx.translate(88, y + 32);
        ctx.scale(k, k);
        text(i === 0 ? 'Paid' : 'Unpaid', 0, 0, F(500, 20), i === 0 ? C.green : C.red);
        ctx.restore();
      }
      ctx.restore();
    });

    const footer = clamp01(s.receiptRows - EQUAL_MEMBERS + 0.5);
    ctx.globalAlpha = footer;
    ctx.fillStyle = C.line;
    ctx.fillRect(88, 950, 455, 2);
    text('You Pay', 88, 1006, F(600, 30), C.white);
    text(inr(0), 543, 1008, F(700, 34), '#7c7ff5', 'right');
    ctx.globalAlpha = 1;
    ctx.restore();

    rr(33, 1062, 564, 80, 24);
    ctx.fillStyle = C.raised;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(276, 1102, 13, 0, Math.PI * 2);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    tick(276, 1102, 13, C.muted, 2.5);
    text('Paid', 300, 1111, F(500, 26), C.muted);
    rr(33, 1160, 564, 80, 24);
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    text('Back to Home', 315, 1210, F(500, 27), C.white, 'center');

    tap(315, 1200, s.tapBack);
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

  // ---- Review: what the OCR entered, then each item tagged to whoever had it ----
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
      const tag = clamp01((s.tagged - i) * 1.6);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate((1 - easeOut(t)) * 44, 0);
      rr(36, y, W - 72, 88, 22);
      ctx.fillStyle = C.tile;
      ctx.fill();
      if (tag > 0) {
        ctx.save();
        ctx.globalAlpha = t * tag;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
      text(item.name, 64, y + 40, F(500, 28), C.white);
      text(`Qty ${item.qty}`, 64, y + 70, F(400, 20), C.muted);
      text(inr(item.amount, 0), W - 64, y + 54, F(600, 29), C.white, 'right');
      // Whose it is: their face pops onto the row
      if (tag > 0) {
        const k = easeBack(tag);
        const owner = PEOPLE[ITEM_OWNERS[i]];
        ctx.save();
        ctx.translate(W - 196, y + 44);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.arc(0, 0, 27, 0, Math.PI * 2);
        ctx.fillStyle = C.accent;
        ctx.fill();
        avatar(owner.id, 0, 0, 24);
        ctx.restore();
      }
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
    const allTagged = s.tagged >= BILL.items.length - 0.05;
    text(allTagged ? `Request ${inr(TO_COLLECT, 0)}` : 'Split by item', W / 2, 1128, F(600, 31), C.white, 'center');
    ctx.globalAlpha = 1;
    tap(W / 2, 1116, s.tapReview);
    tap(W / 2, 1116, s.tapSend);
    ctx.restore();
  };

  // ---- Sent ----
  const drawSent = () => {
    banner(351);
    const cx = W / 2;
    const cy = 590;
    ctx.save();
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
    ctx.restore();

    text('Split sent', cx, 738, F(600, 44), C.white, 'center');
    text(`${inr(TO_COLLECT)} to collect`, cx, 786, F(400, 26), C.muted, 'center');

    PEOPLE.slice(1).forEach((person, i) => {
      const y = 840 + i * 118;
      const rowT = clamp01((s.sent - 0.45 - i * 0.14) * 5);
      if (rowT <= 0) return;
      ctx.save();
      ctx.globalAlpha = rowT;
      ctx.translate(0, (1 - easeOut(rowT)) * 26);
      rr(36, y, 558, 104, 24);
      ctx.fillStyle = C.tile;
      ctx.fill();
      avatar(person.id, 92, y + 52, 34);
      text(person.fullName, 144, y + 46, F(500, 25), C.white);
      text('Request sent', 144, y + 78, F(400, 21), C.green);
      text(inr(person.dutch, 0), 568, y + 62, F(600, 29), C.white, 'right');
      ctx.restore();
    });
  };

  // ---- Transitions between screens ----
  const iris = (x: number, y: number, radius: number, draw: () => void) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    draw();
    ctx.restore();
  };
  // Pushed in from one side, the way the app navigates, dimming what it covers
  const slide = (t: number, from: 1 | -1, draw: () => void) => {
    const e = easeOut(t);
    ctx.fillStyle = `rgba(0,0,0,${0.45 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(from * (1 - e) * W, 0);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 50;
    ctx.fillStyle = C.sheet;
    ctx.fillRect(0, 0, W, H);
    ctx.shadowColor = 'transparent';
    draw();
    ctx.restore();
  };
  const rise = (t: number, draw: () => void) => {
    const e = easeOut(t);
    ctx.fillStyle = `rgba(0,0,0,${0.5 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, (1 - e) * H * 0.7);
    draw();
    ctx.restore();
  };

  const sentOpen = clamp01(s.sent * 2.5);
  const layers: [number, () => void][] = [
    [1, drawHero],
    [s.create, () => iris(W / 2, 760, s.create * H * 0.95, drawCreate)],
    [s.friends, () => slide(s.friends, 1, drawFriends)],
    [s.payer, () => slide(s.payer, 1, drawPayer)],
    [s.receipt, () => rise(s.receipt, drawReceipt)],
    [s.back, () => slide(s.back, -1, drawCreate)],
    [s.home, () => iris(454, 580, s.home * H * 1.25, drawHome)],
    [s.camera, () => iris(W / 2, 846, s.camera * H * 1.1, drawCamera)],
    [s.review, drawReview],
    [sentOpen, () => iris(W / 2, 1116, sentOpen * H * 1.1, drawSent)],
  ];

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Nothing under the topmost screen that's fully in is visible, so start drawing there
  let first = 0;
  layers.forEach(([t], i) => {
    if (t >= 1) first = i;
  });
  for (let i = first; i < layers.length; i++) {
    if (layers[i][0] > 0) layers[i][1]();
  }
  ctx.restore();
}
