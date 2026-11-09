import { GOLD, GOLD_SERIES, SUMMARY, inr } from './goldData';

// Everything the phone's screen shows during the gold story. The scroll timeline tweens these
// numbers; drawGoldScreen turns them into a frame of the app.
export function initialGoldState() {
  return {
    grams: GOLD.startGrams, // what the Savings screen says you hold
    tapBuy: 0,
    buy: 0, // the Buy screen sliding in
    typed: 0, // digits of the amount keyed in
    tapBuyGold: 0,
    summary: 0, // the purchase summary sheet coming up
    tapPay: 0,
    tapWithdraw: 0,
    delivery: 0, // Gold Delivery sliding in
    tapGet: 0,
    success: 0, // the certicard screen opening out
    check: 0,
  };
}
export type GoldState = ReturnType<typeof initialGoldState>;

export interface GoldAssets {
  hero: HTMLImageElement | null;
  sans: string;
}

const C = {
  bg: '#121214',
  card: '#1c1c1f',
  line: '#2b2b30',
  muted: '#8b8b92',
  white: '#ffffff',
  gold: '#e2ae4c',
  goldText: '#e6b95f',
  goldDeep: '#c99a43',
  ink: '#1a1407',
  purple: '#6c63ff',
  green: '#34d399',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeBack = (t: number) => {
  const x = clamp01(t) - 1;
  return 1 + 2.4 * x * x * x + 1.4 * x * x;
};

export function drawGoldScreen(ctx: CanvasRenderingContext2D, W: number, H: number, s: GoldState, a: GoldAssets) {
  const F = (weight: number, size: number) => `${weight} ${size}px ${a.sans}`;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const box = (x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string, lw = 2) => {
    rr(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  };
  const text = (str: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(str, x, y);
  };
  const spaced = (str: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign) => {
    // Saved and restored, so the spacing can't carry on into whatever is drawn next
    ctx.save();
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '2px';
    text(str, x, y, font, color, align);
    ctx.restore();
  };
  const line = (color: string, width: number, draw: () => void) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    draw();
    ctx.stroke();
    ctx.restore();
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
  const goldFill = (y0: number, y1: number) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#e9c070');
    g.addColorStop(1, '#b98a35');
    return g;
  };
  const back = (y: number, color = C.white) =>
    line(color, 4, () => {
      ctx.moveTo(52, y - 14);
      ctx.lineTo(38, y);
      ctx.lineTo(52, y + 14);
    });
  const receiptButton = () => {
    ctx.beginPath();
    ctx.arc(572, 126, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#26262b';
    ctx.fill();
    box(560, 110, 24, 32, 3, '#26262b', C.goldText, 2.5);
    line(C.goldText, 2.5, () => {
      ctx.moveTo(566, 120);
      ctx.lineTo(578, 120);
      ctx.moveTo(566, 128);
      ctx.lineTo(578, 128);
    });
  };
  const safegold = (x: number, y: number, size: number, align: CanvasTextAlign) => spaced('SAFEGOLD', x, y, F(700, size), C.goldText, align);
  const coin = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = goldFill(cy - r, cy + r);
    ctx.fill();
    ctx.strokeStyle = '#a77a2c';
    ctx.lineWidth = r * 0.06;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(140,100,30,0.5)';
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
    text('G', cx, cy + r * 0.25, F(800, r * 0.75), '#9a6f24', 'center');
  };
  const footer = () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 1255, W, H - 1255);
    ctx.fillStyle = C.line;
    ctx.fillRect(0, 1255, W, 2);
    text('In partnership with', 280, 1290, F(400, 19), C.muted, 'right');
    safegold(296, 1290, 19, 'left');
  };

  // ---- Savings: what you hold, and today's price ----
  const drawHome = () => {
    ctx.fillStyle = '#e9a838';
    ctx.fillRect(0, 0, W, 420);
    if (a.hero?.complete && a.hero.naturalWidth > 0) ctx.drawImage(a.hero, 0, 0, W, 400, 0, 0, W, 400);
    box(0, 360, W, H - 300, 46, C.bg);
    back(409);
    text('Savings', W / 2, 420, F(700, 31), C.white, 'center');
    line(C.white, 3.5, () => {
      ctx.arc(582, 409, 15, -Math.PI * 0.75, Math.PI * 0.9);
      ctx.moveTo(582, 400);
      ctx.lineTo(582, 410);
      ctx.lineTo(589, 414);
    });

    box(25, 457, 580, 315, 28, C.card, C.line);
    text('Your gold', 56, 507, F(500, 22), C.muted);
    safegold(575, 507, 23, 'right');
    const grams = s.grams.toFixed(4);
    text(grams, 56, 588, F(700, 56), C.white);
    ctx.font = F(700, 56);
    text('g', 56 + ctx.measureText(grams).width + 12, 588, F(500, 28), C.muted);
    const worth = inr(s.grams * GOLD.sellRate);
    text(worth, 56, 640, F(700, 22), C.white);
    ctx.font = F(700, 22);
    text("at today's sell rate", 56 + ctx.measureText(worth).width + 12, 640, F(400, 21), C.muted);
    box(56, 674, 162, 68, 18, C.gold);
    text('Buy', 137, 718, F(600, 23), C.ink, 'center');
    box(234, 674, 162, 68, 18, '#2a2a2e');
    text('Sell', 315, 718, F(600, 23), C.white, 'center');
    box(412, 674, 162, 68, 18, '#2a2a2e');
    text('Withdraw', 493, 718, F(600, 23), C.white, 'center');
    tap(137, 708, s.tapBuy);
    tap(493, 708, s.tapWithdraw);

    text('24K gold · 99.5% pure', 31, 845, F(500, 21), C.muted);
    text(inr(GOLD.buyRate), 31, 922, F(700, 54), C.white);
    text('/g, excl. GST', 300, 918, F(400, 22), C.muted);
    text('+₹2,795.00 (+87.21%)', 31, 965, F(500, 21), C.green);
    text('past 5 years', 268, 965, F(400, 21), C.muted);
    ctx.save();
    ctx.setLineDash([8, 8]);
    line('#3a3a40', 2, () => {
      ctx.moveTo(31, 1336);
      ctx.lineTo(600, 1336);
    });
    ctx.restore();
    line(C.gold, 3, () => {
      GOLD_SERIES.forEach((v, i) => {
        const x = 31 + (i / (GOLD_SERIES.length - 1)) * 569;
        const y = 1336 - v * 290;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
    });
  };

  // ---- Buy: a rupee amount, and the grams it gets ----
  const drawBuy = () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    back(126);
    text('Savings', W / 2, 137, F(700, 32), C.goldText, 'center');
    receiptButton();

    box(27, 183, 576, 410, 32, '#2a2722', '#34312a');
    ctx.save();
    rr(27, 183, 576, 410, 32);
    ctx.clip();
    if (a.hero?.complete && a.hero.naturalWidth > 0) ctx.drawImage(a.hero, 20, 150, 270, 210, 40, 400, 270, 210);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(64, 241, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    text('Live price', 86, 250, F(600, 27), C.goldText);
    text(`${inr(GOLD.buyRate)}/g`, 577, 322, F(800, 46), C.goldText, 'right');
    ['Live rate excludes 3% GST.', 'Includes locker charges and', 'insurance'].forEach((l, i) =>
      text(l, 577, 368 + i * 26, F(400, 18), '#c9a96a', 'right')
    );
    box(426, 440, 151, 40, 20, C.goldDeep);
    text('24K · 99.5%', 501, 467, F(700, 18), C.ink, 'center');

    box(27, 622, 576, 440, 32, '#1d1d20', C.line);
    text('Buy 24K gold, 99.5% pure', 57, 680, F(700, 23), C.white);
    ctx.beginPath();
    ctx.arc(71, 724, 13, 0, Math.PI * 2);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(71, 724, 6, 0, Math.PI * 2);
    ctx.fillStyle = C.gold;
    ctx.fill();
    text('In Rupees', 99, 732, F(600, 22), C.goldText);
    ctx.beginPath();
    ctx.arc(262, 724, 13, 0, Math.PI * 2);
    ctx.strokeStyle = '#55555c';
    ctx.stroke();
    text('In Grams', 290, 732, F(400, 22), C.muted);

    const digits = GOLD.typed.slice(0, Math.round(s.typed));
    const amount = digits ? Number(digits) : 0;
    box(57, 766, 516, 98, 22, C.bg, digits ? '#b58a3c' : '#3a3a40');
    text('₹', 82, 828, F(500, 30), C.muted);
    text(digits ? amount.toLocaleString('en-IN') : '0', 110, 829, F(700, 32), digits ? C.white : C.muted);
    const grams = amount / (1 + GOLD.gst) / GOLD.buyRate;
    text(`= ${(Math.floor(grams * 10000) / 10000).toFixed(4)}g`, 548, 826, F(400, 22), C.muted, 'right');
    text('(Includes 3% GST)', 57, 897, F(400, 19), C.muted);
    ['+₹1000.00', '+₹3000.00', '+₹5000.00'].forEach((l, i) => {
      box(57 + i * 177, 926, 163, 58, 20, goldFill(926, 984));
      text(l, 138 + i * 177, 963, F(700, 19), C.ink, 'center');
    });
    text('24K gold of 99.5% purity, guaranteed by SafeGold', W / 2, 1022, F(400, 18), C.muted, 'center');

    box(27, 1098, 576, 84, 30, goldFill(1098, 1182));
    text('BUY GOLD', W / 2, 1150, F(700, 26), C.white, 'center');
    tap(W / 2, 1140, s.tapBuyGold);
    footer();
  };

  // ---- Purchase summary sheet ----
  const drawSummary = () => {
    const e = easeOut(s.summary);
    ctx.fillStyle = `rgba(0,0,0,${0.6 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, (1 - e) * 820);
    box(0, 602, W, 900, 40, C.card);
    box(W / 2 - 30, 620, 60, 6, 3, '#4a4a50');
    text('Purchase summary', 33, 690, F(700, 31), C.white);
    safegold(597, 688, 21, 'right');
    SUMMARY.forEach(([label, value], i) => {
      text(label, 33, 757 + i * 53, F(400, 22), '#b0b0b6');
      text(value, 597, 757 + i * 53, F(500, 22), C.white, 'right');
    });
    ctx.fillStyle = '#34343a';
    ctx.fillRect(33, 943, 564, 2);
    text('Total amount', 33, 993, F(700, 24), C.white);
    text(inr(Number(GOLD.typed)), 597, 995, F(800, 28), C.goldText, 'right');
    text('24K gold, 99.5% pure, sold by Digital Gold India Pvt. Ltd.', 33, 1052, F(400, 17), C.muted);
    text('(SafeGold).', 33, 1078, F(400, 17), C.muted);
    box(37, 1118, 30, 30, 6, C.gold);
    line(C.ink, 3.5, () => {
      ctx.moveTo(44, 1133);
      ctx.lineTo(50, 1140);
      ctx.lineTo(61, 1126);
    });
    text("I agree to SafeGold's", 85, 1132, F(400, 19), '#cfcfd4');
    text('Terms of Use', 270, 1132, F(600, 19), C.goldText);
    text('for this transaction.', 85, 1160, F(400, 19), '#cfcfd4');
    box(33, 1205, 564, 80, 40, C.gold);
    text(`Pay ${inr(Number(GOLD.typed))}`, W / 2, 1256, F(700, 25), C.ink, 'center');
    tap(W / 2, 1245, s.tapPay);
    ctx.restore();
  };

  // ---- Gold Delivery: a coin to choose ----
  const drawDelivery = () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    back(126);
    text('Gold Delivery', W / 2, 137, F(700, 32), C.goldText, 'center');
    receiptButton();

    box(27, 183, 576, 142, 22, C.card, C.line);
    box(46, 203, 26, 18, 3, '#f5c84a');
    text('Check Doorstep Delivery', 84, 222, F(700, 23), C.white);
    box(40, 241, 420, 68, 16, C.bg);
    text('Enter 6-digit PIN code', 64, 284, F(400, 20), C.muted);
    box(471, 241, 120, 68, 18, C.purple);
    text('Check', 531, 284, F(600, 22), C.white, 'center');

    let x = 27;
    ['All', '0.5g', '1g', '2g', '5g', '10g', '20g'].forEach((l, i) => {
      const w = i === 0 ? 74 : Math.max(68, l.length * 16 + 34);
      box(x, 347, w, 54, 27, i === 0 ? C.purple : C.bg, i === 0 ? undefined : '#33333a');
      text(l, x + w / 2, 381, F(500, 20), i === 0 ? C.white : '#bdbdc3', 'center');
      x += w + 10;
    });
    x = 27;
    ['All', 'Coins', 'Bars', 'Ganesha', 'Laxmi'].forEach((l, i) => {
      const w = l.length * 15 + 40;
      box(x, 418, w, 54, 14, i === 0 ? '#2e2716' : C.bg, i === 0 ? C.gold : '#2c2c31');
      text(l, x + w / 2, 452, F(500, 19), i === 0 ? C.goldText : '#a8a8ae', 'center');
      x += w + 10;
    });
    text('Available Products (23)', 27, 520, F(700, 24), C.white);
    text('100% Insured Delivery', 603, 520, F(500, 19), '#f5c84a', 'right');

    [
      { name: ['0.5 gram Ganesh Coin', '(99.99%)'], g: '0.5g' },
      { name: ['0.5 Gram SafeGold Coin', '(99.99%)'], g: '0.5g' },
    ].forEach((p, i) => {
      const cx = 27 + i * 298;
      box(cx, 547, 278, 424, 26, C.card, '#6e5a2c');
      box(cx + 16, 563, 246, 180, 14, '#1a1a1c');
      box(cx + 49, 563, 180, 180, 0, C.white);
      coin(cx + 139, 653, 62);
      box(cx + 24, 572, 104, 30, 8, C.bg, '#c9a14d');
      text('24K 99.99%', cx + 76, 593, F(700, 15), '#f5c84a', 'center');
      box(cx + 206, 572, 50, 30, 8, C.purple);
      text(p.g, cx + 231, 593, F(700, 15), C.white, 'center');
      p.name.forEach((l, j) => text(l, cx + 16, 790 + j * 28, F(700, 21), C.white));
      text('Making: ₹479.57', cx + 16, 885, F(400, 19), C.muted);
      box(cx + 16, 900, 246, 56, 14, C.purple);
      text('Get it delivered', cx + 139, 936, F(600, 20), C.white, 'center');
    });
    box(27, 991, 278, 260, 26, C.card, '#6e5a2c');
    box(325, 991, 278, 260, 26, C.card, '#6e5a2c');
    box(76, 1007, 180, 180, 0, C.white);
    coin(166, 1097, 62);
    box(374, 1007, 180, 180, 0, C.white);
    coin(464, 1097, 62);
    tap(464, 928, s.tapGet);
    footer();
  };

  // ---- Payment successful: the coin, sealed in its certicard ----
  const drawSuccess = () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    box(41, 108, 548, 522, 36, '#19191b', C.goldDeep, 3);
    ctx.beginPath();
    ctx.arc(82, 152, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#f5c84a';
    ctx.fill();
    spaced('ASSAY CERTICARD', 106, 160, F(700, 18), '#f5c84a', 'left');
    box(446, 136, 118, 34, 8, '#2b2a4a');
    text('99.99% 24K', 505, 159, F(600, 16), '#9c97ff', 'center');
    box(89, 190, 452, 338, 4, C.white);
    // The certicard: a blue sleeve with the coin set in the middle
    box(181, 226, 268, 268, 22, '#64b9d6');
    ctx.save();
    ctx.translate(315, 360);
    ctx.rotate(Math.PI / 4);
    box(-118, -118, 236, 236, 4, '#3a8fb8');
    box(-82, -82, 164, 164, 4, '#2b7aa6');
    ctx.restore();
    coin(315, 352, 52);
    text('0.5 GM 24K GOLD', 315, 432, F(600, 12), '#d8b45a', 'center');
    text('0.5 Gram SafeGold Coin (99.99%)', 315, 568, F(700, 22), C.white, 'center');
    text('SKU: SG00035 • Tamper-Proof Certicard Sealed', 315, 598, F(400, 17), C.muted, 'center');

    const k = easeBack(s.check);
    ctx.beginPath();
    ctx.arc(315, 728, 54, 0, Math.PI * 2);
    ctx.fillStyle = '#1d3524';
    ctx.fill();
    ctx.strokeStyle = '#2f6b3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (k > 0.02) {
      ctx.beginPath();
      ctx.arc(315, 728, 30 * k, 0, Math.PI * 2);
      ctx.fillStyle = '#34c759';
      ctx.fill();
      line('#0f2a17', 6, () => {
        ctx.moveTo(301, 728);
        ctx.lineTo(311, 739);
        ctx.lineTo(330, 717);
      });
    }
    text('Payment Successful', 315, 826, F(700, 34), C.white, 'center');
    text('0.5g 24K pure digital gold debited from your vault', 315, 872, F(400, 20), '#f5c84a', 'center');

    box(16, 925, 598, 290, 20, '#161618', C.line);
    text('Invoice ID', 38, 972, F(700, 21), C.white);
    text(GOLD.invoice, 592, 972, F(700, 21), C.white, 'right');
    [
      ['Gold Deducted', '0.5 g (24K 99.99%)', '#f5c84a'],
      ['Minting & delivery paid', inr(GOLD.making), C.white],
      ['Recipient', 'You', C.white],
      ['Delivery Pincode', GOLD.pincode, C.white],
      ['Estimated Dispatch', GOLD.dispatch, C.white],
    ].forEach(([l, v, c], i) => {
      text(l, 38, 1024 + i * 38, F(400, 19), C.muted);
      text(v, 592, 1024 + i * 38, F(500, 19), c, 'right');
    });
    footer();
  };

  // ---- Transitions ----
  const slide = (t: number, draw: () => void) => {
    const e = easeOut(t);
    ctx.fillStyle = `rgba(0,0,0,${0.45 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate((1 - e) * W, 0);
    draw();
    ctx.restore();
  };
  const iris = (x: number, y: number, radius: number, draw: () => void) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    draw();
    ctx.restore();
  };

  const layers: [number, () => void][] = [
    [1, drawHome],
    [s.buy, () => slide(s.buy, drawBuy)],
    [Math.min(s.summary, 0.999), drawSummary],
    [s.delivery, () => slide(s.delivery, drawDelivery)],
    [s.success, () => iris(464, 928, s.success * H * 1.2, drawSuccess)],
  ];

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  let first = 0;
  layers.forEach(([t], i) => {
    if (t >= 1) first = i;
  });
  for (let i = first; i < layers.length; i++) {
    if (layers[i][0] > 0) layers[i][1]();
  }
  ctx.restore();
}

