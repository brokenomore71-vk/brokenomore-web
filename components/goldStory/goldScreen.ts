import { GOLD_DATA, inr } from './goldData';

// State of the phone screen across the Gold Savings chapter
export function initialGoldState() {
  return {
    // Act 1: Home vault & live price
    home: 0,
    ratePulse: 0,
    tapBuy: 0,
    // Act 2: Buying 24K pure gold
    buyScreen: 0,
    typedAmount: 0, // 0 to 1 as 2,500 is typed
    tapConfirmBuy: 0,
    buySuccess: 0, // gold added to vault
    // Act 3: Physical gold delivery
    deliveryScreen: 0,
    pinChecked: 0,
    coinSelected: 0, // which coin is highlighted
    // Act 4: Instant UPI Sell
    sellScreen: 0,
    sellSuccess: 0,
  };
}

export type GoldState = ReturnType<typeof initialGoldState>;

export interface GoldAssets {
  homeImg: HTMLImageElement | null;
  buyImg: HTMLImageElement | null;
  sellImg: HTMLImageElement | null;
  deliveryImg: HTMLImageElement | null;
  sans: string;
}

const C = {
  bg: '#0e0e11',
  card: '#16171b',
  gold: '#f59e0b',
  goldBright: '#fbbf24',
  goldSoft: '#fde68a',
  goldDark: '#78350f',
  white: '#ffffff',
  muted: '#9ca3af',
  green: '#10b981',
  line: '#27272a',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function drawGoldScreen(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: GoldState,
  a: GoldAssets
) {
  const F = (weight: number, size: number) => `${weight} ${size}px ${a.sans}`;

  // Dark background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Helper to draw an image stretched/fitted to full screen dimensions
  const drawScreenImage = (img: HTMLImageElement | null, opacity: number) => {
    if (!img || !img.complete || img.naturalWidth === 0 || opacity <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = clamp01(opacity);
    ctx.drawImage(img, 0, 0, W, H);
    ctx.restore();
  };

  // Determine current active screens and crossfades
  // Order of screens: Home -> Buy -> Delivery -> Sell
  const buyFade = clamp01(s.buyScreen);
  const deliveryFade = clamp01(s.deliveryScreen);
  const sellFade = clamp01(s.sellScreen);

  // Base: Home image
  drawScreenImage(a.homeImg, 1 - buyFade);

  // Buy screen transition
  if (buyFade > 0 && deliveryFade < 1) {
    drawScreenImage(a.buyImg, buyFade * (1 - deliveryFade));
  }

  // Delivery screen transition
  if (deliveryFade > 0 && sellFade < 1) {
    drawScreenImage(a.deliveryImg, deliveryFade * (1 - sellFade));
  }

  // Sell screen transition
  if (sellFade > 0) {
    drawScreenImage(a.sellImg, sellFade);
  }

  // ---- Dynamic Overlays and Micro-animations ----

  // 1. Home screen dynamic balance update after buying
  if (s.buySuccess > 0 && deliveryFade < 0.5) {
    // Overlay over the "Your gold" card to show updated balance
    const cardY = H * 0.36;
    const currentGrams = lerp(GOLD_DATA.startGrams, GOLD_DATA.afterBuyGrams, clamp01(s.buySuccess));
    const currentValue = currentGrams * (GOLD_DATA.sellRate / 1);

    ctx.save();
    ctx.fillStyle = '#18181b';
    ctx.fillRect(W * 0.08, cardY, W * 0.6, 60);

    ctx.font = F(700, 42);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'left';
    ctx.fillText(`${currentGrams.toFixed(4)} g`, W * 0.08, cardY + 44);

    // Value subtext
    ctx.fillStyle = '#18181b';
    ctx.fillRect(W * 0.08, cardY + 54, W * 0.6, 30);
    ctx.font = F(500, 22);
    ctx.fillStyle = C.muted;
    ctx.fillText(`₹${currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} at today's sell rate`, W * 0.08, cardY + 76);
    ctx.restore();
  }

  // 2. Buy Screen: typing ₹2,500
  if (buyFade > 0.5 && deliveryFade < 0.2) {
    const inputY = H * 0.536;
    const inputX = W * 0.15;
    const progress = clamp01(s.typedAmount);
    const amountVal = Math.round(progress * GOLD_DATA.buyAmount);
    const gramsVal = (progress * GOLD_DATA.buyGrams).toFixed(4);

    if (progress > 0.05) {
      ctx.save();
      // Mask original input
      ctx.fillStyle = '#16171a';
      ctx.fillRect(inputX, inputY - 36, W * 0.7, 50);

      // Amount
      ctx.font = F(700, 34);
      ctx.fillStyle = C.white;
      ctx.textAlign = 'left';
      ctx.fillText(`₹ ${amountVal.toLocaleString('en-IN')}`, inputX, inputY);

      // Equivalent grams
      ctx.font = F(500, 22);
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'right';
      ctx.fillText(`= ${gramsVal}g`, W * 0.85, inputY);
      ctx.restore();
    }
  }

  // 3. Tap ripples / button highlights
  const drawTap = (x: number, y: number, progress: number, color = 'rgba(245, 158, 11, 0.4)') => {
    if (progress <= 0 || progress >= 1) return;
    ctx.save();
    const r = progress * 70;
    const alpha = (1 - progress) * 0.7;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Tap on Buy button on Home screen
  if (s.tapBuy > 0 && s.tapBuy < 1) {
    drawTap(W * 0.24, H * 0.536, s.tapBuy, 'rgba(245, 158, 11, 0.5)');
  }

  // Tap on BUY GOLD button on Buy screen
  if (s.tapConfirmBuy > 0 && s.tapConfirmBuy < 1) {
    drawTap(W * 0.5, H * 0.825, s.tapConfirmBuy, 'rgba(255, 255, 255, 0.5)');
  }

  // 4. Buy Success notification badge banner
  if (s.buySuccess > 0 && s.buySuccess < 1) {
    const pop = Math.sin(s.buySuccess * Math.PI);
    ctx.save();
    ctx.globalAlpha = pop;
    const bannerY = H * 0.16 + (1 - pop) * 20;
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.roundRect(W * 0.08, bannerY, W * 0.84, 64, 18);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = F(700, 22);
    ctx.fillStyle = '#ecfdf5';
    ctx.textAlign = 'center';
    ctx.fillText(`✓ 0.2044g Pure 24K Gold added to your locker`, W * 0.5, bannerY + 39);
    ctx.restore();
  }

  // 5. Sell Success notification badge
  if (s.sellSuccess > 0) {
    const pop = Math.min(1, s.sellSuccess * 1.5);
    ctx.save();
    ctx.globalAlpha = pop;
    const bannerY = H * 0.72;
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(W * 0.08, bannerY, W * 0.84, 80, 20);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = F(700, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.fillText(`✓ Instant UPI Transfer Confirmed`, W * 0.14, bannerY + 36);

    ctx.font = F(500, 20);
    ctx.fillStyle = C.muted;
    ctx.fillText(`₹2,000 sent to ${GOLD_DATA.upiId}`, W * 0.14, bannerY + 64);
    ctx.restore();
  }

  // Top Status Bar (Seamless clean overlay to match device frame)
  ctx.save();
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, Math.round(H * (54 / 1400)));
  ctx.restore();
}
