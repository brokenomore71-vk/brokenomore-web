import {
  FUNDAMENTALS,
  HOLDING,
  MARKET,
  PILLARS,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_SERIES,
  QUARTERS,
  SCORE,
  SEARCH,
  STOCK,
  inr,
  num,
} from './stockData';

// Everything the phone's screen shows during the stock story. The scroll timeline tweens these
// numbers; drawStockScreen turns them into a frame of the app.
export function initialStockState() {
  return {
    // Explore
    explore: 0, // the page's sections rising in
    live: 0, // ticker prices flickering
    bullish: 0, // the Top Gainers line drawing itself
    // Search
    tapSearch: 0,
    search: 0, // results and keyboard coming up
    typed: 0, // characters of the query
    results: 0,
    tapResult: 0,
    // Stock page
    detail: 0,
    chart: 0,
    scroll: 0, // 0 to 1 down the page
    bars: 0,
    donut: 0,
    tapRun: 0,
    // Analysis and report
    report: 0,
    dial: 0,
    pillars: 0,
  };
}
export type StockState = ReturnType<typeof initialStockState>;

export interface StockAssets {
  logo: HTMLImageElement | null;
  sans: string;
}

const C = {
  bg: '#121214',
  card: '#1b1b1e',
  cardLine: '#2a2a2f',
  pill: '#24252b',
  muted: '#8b8b92',
  dim: '#5d5d63',
  white: '#ffffff',
  accent: '#6c63ff',
  green: '#1fc690',
  greenSoft: '#34d399',
  red: '#f05252',
  orange: '#f5a524',
  blue: '#38bdf8',
  nav: '#0d0d0f',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// How far the stock page scrolls, in screen pixels, when `scroll` reaches 1.
const DETAIL_SCROLL = 2120;
// The day's line runs the full width of the screen, so it meets the line that carries on outside.
const CHART_W = 564;

export function drawStockScreen(ctx: CanvasRenderingContext2D, W: number, H: number, s: StockState, a: StockAssets) {
  const F = (weight: number, size: number) => `${weight} ${size}px ${a.sans}`;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const fillRR = (x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string, lw = 2) => {
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
  const width = (str: string, font: string) => {
    ctx.font = font;
    return ctx.measureText(str).width;
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
  const stroke = (color: string, lw: number, draw: () => void) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    draw();
    ctx.stroke();
    ctx.restore();
  };
  const chevron = (x: number, y: number, size = 14) =>
    stroke(C.white, 4, () => {
      ctx.moveTo(x + size * 0.5, y - size);
      ctx.lineTo(x - size * 0.5, y);
      ctx.lineTo(x + size * 0.5, y + size);
    });
  const hulLogo = (x: number, y: number, size: number) => {
    fillRR(x, y, size, size, size * 0.18, C.white);
    fillRR(x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84, size * 0.08, '#1d3a9a');
    text('U', x + size / 2, y + size * 0.72, F(800, size * 0.6), C.white, 'center');
  };
  const logo = (kind: string, x: number, y: number, size: number) => {
    if (kind === 'hul') return hulLogo(x, y, size);
    fillRR(x, y, size, size, size * 0.18, C.white);
    if (kind === 'agri') {
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = '#6fbf4a';
      ctx.fill();
    } else if (kind === 'hal') {
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#f08a24';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#2f6fd6';
      ctx.fill();
    } else if (kind === 'tcs') {
      text('tcs', x + size / 2, y + size * 0.64, F(700, size * 0.42), '#111', 'center');
    }
  };
  const searchIcon = (x: number, y: number, color: string) =>
    stroke(color, 3, () => {
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.moveTo(x + 7, y + 7);
      ctx.lineTo(x + 15, y + 15);
    });

  // ---- Shared pieces of the app ----
  const header = (title: string) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    chevron(48, 121);
    text(title, 92, 133, F(700, 34), C.white);
  };
  const tabs = (active: number) => {
    ['Explore', 'Analysis', 'Watchlist'].forEach((label, i) => {
      text(label, 105 + i * 210, 211, F(600, 22), i === active ? C.white : C.dim, 'center');
    });
    ctx.fillStyle = '#26262a';
    ctx.fillRect(0, 239, W, 2);
    fillRR(18 + active * 210, 235, 176, 5, 3, C.accent);
  };
  const nav = () => {
    ctx.fillStyle = C.nav;
    ctx.fillRect(0, 1165, W, H - 1165);
    ctx.fillStyle = '#26262a';
    ctx.fillRect(0, 1165, W, 2);
    const icon = C.muted;
    // Home
    stroke(icon, 3, () => {
      ctx.moveTo(42, 1232);
      ctx.lineTo(42, 1212);
      ctx.lineTo(62, 1195);
      ctx.lineTo(82, 1212);
      ctx.lineTo(82, 1232);
      ctx.closePath();
    });
    // Track
    stroke(icon, 3, () => ctx.roundRect(167, 1203, 44, 32, 6));
    stroke(icon, 3, () => ctx.roundRect(196, 1213, 15, 12, 3));
    // Gifts
    stroke(icon, 3, () => {
      ctx.roundRect(419, 1209, 42, 28, 4);
      ctx.moveTo(440, 1199);
      ctx.lineTo(440, 1237);
      ctx.moveTo(415, 1209);
      ctx.lineTo(465, 1209);
    });
    // Settings
    [0, 1].forEach((r) =>
      [0, 1].forEach((c) => stroke(icon, 3, () => ctx.roundRect(546 + c * 22, 1194 + r * 22, 18, 18, 5)))
    );
    ['Home', 'Track', '', 'Gifts', 'Settings'].forEach((label, i) => {
      if (label) text(label, 62 + i * 126, 1281, F(500, 19), icon, 'center');
    });
    // The AI button
    ctx.beginPath();
    ctx.arc(315, 1229, 46, 0, Math.PI * 2);
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.save();
    ctx.setLineDash([3, 4]);
    stroke(C.nav, 4, () => ctx.arc(315, 1229, 41, 0, Math.PI * 2));
    ctx.restore();
    ctx.beginPath();
    ctx.arc(315, 1229, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#1b1b2e';
    ctx.fill();
    if (a.logo?.complete && a.logo.naturalWidth > 0) ctx.drawImage(a.logo, 293, 1207, 44, 44);
    text('AI', 315, 1298, F(700, 19), C.white, 'center');
  };
  const sparkline = (points: number[], x: number, y: number, w: number, h: number, t: number, color: string, lw = 4) => {
    const n = Math.max(2, Math.floor(points.length * clamp01(t)));
    const lo = Math.min(...points);
    const hi = Math.max(...points);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = x + (i / (points.length - 1)) * w;
      const py = y + h - ((points[i] - lo) / (hi - lo || 1)) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    return { x: x + ((n - 1) / (points.length - 1)) * w, y: y + h - ((points[n - 1] - lo) / (hi - lo || 1)) * h };
  };

  // ---- Explore ----
  const drawExplore = () => {
    header('Stock Analysis Planner');
    tabs(0);

    // Search box, which lights up once it's tapped
    const focus = clamp01(s.search * 3);
    fillRR(33, 259, 564, 78, 22, '#19191c', focus > 0 ? `rgba(108,99,255,${0.4 + 0.6 * focus})` : C.cardLine, focus > 0 ? 3 : 2);
    searchIcon(68, 296, C.muted);
    const query = SEARCH.query.slice(0, Math.round(s.typed));
    if (query) {
      text(query, 108, 306, F(500, 23), C.white);
      stroke(C.white, 3, () => {
        ctx.moveTo(549, 289);
        ctx.lineTo(565, 305);
        ctx.moveTo(565, 289);
        ctx.lineTo(549, 305);
      });
      if (s.typed < SEARCH.query.length - 0.1) fillRR(110 + width(query, F(500, 23)), 283, 3, 30, 2, C.accent);
    } else {
      text('Search 6,000+ stocks (e.g. Reliance, BEL,…', 108, 306, F(400, 21), C.dim);
      if (focus > 0) fillRR(108, 283, 3, 30, 2, C.accent);
    }
    tap(315, 298, s.tapSearch);

    let x = 33;
    ['NIFTY 50', 'Banking', 'IT & Tech', 'Auto & EV', 'Energy'].forEach((chip) => {
      const w = width(chip, F(500, 19)) + 40;
      fillRR(x, 357, w, 46, 23, C.bg, '#34343a');
      text(chip, x + w / 2, 387, F(500, 19), '#c9c9ce', 'center');
      x += w + 12;
    });

    const section = (i: number, draw: () => void) => {
      const t = clamp01(s.explore * 1.6 - i * 0.2);
      if (t <= 0) return;
      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate(0, (1 - easeOut(t)) * 40);
      draw();
      ctx.restore();
    };

    section(0, () => {
      text('Market Pulse', 33, 462, F(700, 26), C.white);
      fillRR(463, 437, 134, 34, 8, 'rgba(52,211,153,0.14)');
      ctx.beginPath();
      ctx.arc(482, 454, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.greenSoft;
      ctx.fill();
      text('LIVE NSE/BSE', 494, 460, F(700, 15), C.greenSoft);
      MARKET.forEach((m, i) => {
        const cx = 33 + i * 206;
        fillRR(cx, 484, 188, 118, 20, C.card, C.cardLine);
        text(m.name, cx + 24, 524, F(500, 18), C.muted);
        const flicker = Math.sin(s.live * 40 + i * 2.1) * (i === 2 ? 3.2 : 1.4) * clamp01(s.live * 8);
        text(num(m.value + flicker), cx + 24, 561, F(700, 25), C.white);
        text(`${m.up ? '↑' : '↓'} ${m.change}`, cx + 24, 590, F(600, 17), m.up ? C.greenSoft : C.red);
      });
    });

    section(1, () => {
      text('Recently Viewed & Trending', 33, 667, F(700, 26), C.white);
      fillRR(33, 693, 338, 94, 20, C.card, C.cardLine);
      fillRR(57, 716, 48, 48, 10, C.white);
      logo('tcs', 57, 716, 48);
      text('Tata Consultancy Serv…', 122, 734, F(600, 20), C.white);
      text('TCS', 122, 765, F(500, 16), C.muted);
      text('-0.9%', 165, 765, F(700, 16), C.red);
      fillRR(392, 693, 338, 94, 20, C.card, C.cardLine);
      fillRR(416, 716, 48, 48, 10, '#000');
      text('TEMPSENS', 440, 744, F(700, 9), '#e33', 'center');
      text('Tempsens Ins…', 481, 734, F(600, 20), C.white);
      text('TEMPSENS', 481, 765, F(500, 16), C.muted);
    });

    section(2, () => {
      text('Market Movers & Collections', 33, 852, F(700, 26), C.white);
      // Top gainers: a line climbing over green bars
      fillRR(33, 877, 272, 288, 24, C.card, C.cardLine);
      fillRR(57, 901, 84, 34, 8, 'rgba(31,198,144,0.16)');
      text('Bullish', 99, 924, F(600, 17), C.green, 'center');
      [44, 30, 34, 44, 62, 58].forEach((h, i) => fillRR(76 + i * 38, 1072 - h, 12, h, 3, '#1b4a3a'));
      ctx.save();
      ctx.setLineDash([6, 6]);
      stroke('#55555b', 2, () => {
        ctx.moveTo(57, 1003);
        ctx.lineTo(281, 1003);
      });
      ctx.restore();
      const curve = [60, 52, 40, 34, 36, 42, 50, 70, 88, 96];
      const end = sparkline(curve, 57, 998, 194, 70, Math.max(0.15, s.bullish), C.green, 5);
      if (s.bullish > 0.95) {
        ctx.beginPath();
        ctx.arc(end.x, end.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = C.green;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = C.white;
        ctx.fill();
      }
      text('Top Gainers Today', 57, 1138, F(500, 22), C.white);

      // Dividend kings: one tall glowing bar under an arc
      fillRR(325, 877, 272, 288, 24, C.card, C.cardLine);
      fillRR(349, 901, 104, 34, 8, 'rgba(245,165,36,0.16)');
      text('High Yield', 401, 924, F(600, 17), C.orange, 'center');
      [30, 44, 0, 44, 30].forEach((h, i) => {
        if (h) fillRR(376 + i * 42, 1060 - h, 13, h, 4, '#4a3517');
      });
      ctx.save();
      ctx.shadowColor = C.orange;
      ctx.shadowBlur = 22;
      fillRR(453, 974 + (1 - easeOut(s.bullish)) * 70, 16, 86 - (1 - easeOut(s.bullish)) * 70, 8, C.orange);
      ctx.restore();
      ctx.save();
      ctx.setLineDash([8, 7]);
      stroke('#a77818', 2.5, () => {
        ctx.moveTo(366, 1050);
        ctx.quadraticCurveTo(461, 970, 556, 1050);
      });
      ctx.restore();
      text('Bluechip Dividend', 349, 1110, F(500, 22), C.white);
      text('Kings', 349, 1138, F(500, 22), C.white);
    });
    nav();
  };

  // ---- Search: results replace the page below the chips, and the keyboard comes up ----
  const drawSearch = () => {
    const open = easeOut(s.search);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 418, W, (H - 418) * open);
    ctx.clip();
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 418, W, H - 418);
    if (s.results > 0) {
      ctx.globalAlpha = clamp01(s.results * 3);
      text(`${SEARCH.count} results`, 33, 450, F(600, 19), C.dim);
      ctx.globalAlpha = 1;
    }
    SEARCH.results.forEach((r, i) => {
      const t = clamp01(s.results * 3 - i);
      if (t <= 0) return;
      const y = 482 + i * 117;
      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate(0, (1 - easeOut(t)) * 24);
      const picked = i === SEARCH.picked ? clamp01(s.tapResult * 2) : 0;
      fillRR(33, y, 564, 99, 20, picked > 0 ? '#1f1e2c' : C.card, picked > 0 ? C.accent : C.cardLine);
      logo(r.logo, 53, y + 20, 58);
      const hit = r.name.slice(0, 5);
      text(hit, 131, y + 44, F(700, 22), '#7c74ff');
      text(r.name.slice(5), 131 + width(hit, F(700, 22)), y + 44, F(600, 22), C.white);
      text(r.sub, 131, y + 74, F(400, 18), C.muted);
      const tw = width(r.tag, F(700, 16));
      fillRR(W - 56 - tw - 24, y + 32, tw + 24, 34, 8, C.pill);
      text(r.tag, W - 56 - tw / 2 - 12, y + 55, F(700, 16), '#a7a7ae', 'center');
      ctx.restore();
    });
    ctx.restore();
    tap(315, 482 + SEARCH.picked * 117 + 50, s.tapResult);

    // Keyboard, with each key lighting up as it's typed
    const kbY = 838 + (1 - open) * 600 + clamp01(s.tapResult * 2) * 600;
    if (kbY < H) {
      ctx.save();
      ctx.translate(0, kbY);
      fillRR(0, 0, W, 620, 40, '#2a2a2d');
      ['"hindu"', 'hindi', 'hindutva'].forEach((word, i) => text(word, 105 + i * 210, 50, F(400, 27), '#d6d6da', 'center'));
      const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
      const typing = s.typed % 1;
      const pressed = s.typed > 0 && s.typed < SEARCH.query.length && typing > 0.05 && typing < 0.6 ? SEARCH.query[Math.floor(s.typed)] : '';
      rows.forEach((row, r) => {
        const keyW = 54;
        const gap = 9.5;
        const start = (W - row.length * keyW - (row.length - 1) * gap) / 2;
        row.split('').forEach((k, i) => {
          const kx = start + i * (keyW + gap);
          const ky = 88 + r * 104;
          const down = k === pressed;
          fillRR(kx, ky, keyW, 70, 10, down ? '#8b8b92' : '#4b4b50');
          text(k, kx + keyW / 2, ky + 47, F(400, 31), C.white, 'center');
          if (down) {
            fillRR(kx - 12, ky - 92, keyW + 24, 90, 14, '#6b6b72');
            text(k, kx + keyW / 2, ky - 30, F(500, 44), C.white, 'center');
          }
        });
      });
      fillRR(12, 400, 82, 70, 10, '#4b4b50');
      text('123', 53, 446, F(400, 26), C.white, 'center');
      fillRR(108, 400, 300, 70, 10, '#4b4b50');
      fillRR(422, 400, 196, 70, 10, '#0a84ff');
      stroke(C.white, 4, () => {
        ctx.moveTo(500, 436);
        ctx.lineTo(514, 450);
        ctx.lineTo(540, 422);
      });
      ctx.restore();
    }
  };

  // ---- The stock's page, which scrolls down through everything about it ----
  const drawDetail = () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    const off = s.scroll * DETAIL_SCROLL;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 150, W, 1040);
    ctx.clip();
    ctx.translate(0, -off);
    const visible = (top: number, bottom: number) => bottom - off > 150 && top - off < 1190;

    // Name and price
    hulLogo(33, 183, 74);
    text('Hindustan Unilever …', 128, 215, F(700, 29), C.white);
    fillRR(128, 234, 150, 36, 8, C.pill);
    text(STOCK.symbol, 203, 258, F(700, 17), '#9ea3b0', 'center');
    text(STOCK.sector, 290, 259, F(400, 20), C.dim);
    fillRR(446, 177, 151, 48, 14, C.card, '#3a3a40');
    text('Watchlist', 540, 208, F(500, 19), C.white, 'center');
    stroke(C.white, 2.5, () => {
      ctx.moveTo(466, 190);
      ctx.lineTo(466, 212);
      ctx.lineTo(474, 205);
      ctx.lineTo(482, 212);
      ctx.lineTo(482, 190);
      ctx.closePath();
    });

    const shown = Math.max(1, Math.round(PRICE_SERIES.length * clamp01(s.chart)));
    const live = s.chart >= 1 ? STOCK.price : PRICE_SERIES[shown - 1];
    text(inr(live), 33, 375, F(800, 60), C.white);
    text(STOCK.change, 33, 418, F(500, 21), C.green);

    // Today's chart
    const cy = (v: number) => 880 - ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 400;
    ctx.save();
    ctx.setLineDash([12, 9]);
    stroke('#4a4a50', 2, () => {
      ctx.moveTo(33, cy(STOCK.prevClose));
      ctx.lineTo(597, cy(STOCK.prevClose));
    });
    ctx.restore();
    if (s.chart > 0) {
      ctx.save();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < shown; i++) {
        const x = 33 + (i / (PRICE_SERIES.length - 1)) * CHART_W;
        const y = cy(PRICE_SERIES[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const lx = 33 + ((shown - 1) / (PRICE_SERIES.length - 1)) * CHART_W;
      const ly = cy(PRICE_SERIES[shown - 1]);
      ctx.shadowColor = C.green;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(lx, ly, 7, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.restore();
    }

    // Time ranges
    ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'].forEach((r, i) => {
      const x = 72 + i * 81;
      if (i === 0) fillRR(36, 925, 74, 52, 26, C.bg, C.white, 2.5);
      text(r, x, 958, F(500, 20), i === 0 ? C.white : C.muted, 'center');
    });

    // Performance ranges
    const range = (y: number, loLabel: string, hiLabel: string, lo: number, hi: number) => {
      text(loLabel, 33, y, F(400, 19), C.dim);
      text(hiLabel, 597, y, F(400, 19), C.dim, 'right');
      text(num(lo), 33, y + 33, F(600, 22), C.white);
      text(num(hi), 597, y + 33, F(600, 22), C.white, 'right');
      fillRR(33, y + 54, 564, 6, 3, '#2a2a2f');
      const mx = 33 + ((STOCK.price - lo) / (hi - lo)) * 564;
      ctx.beginPath();
      ctx.moveTo(mx, y + 66);
      ctx.lineTo(mx - 9, y + 80);
      ctx.lineTo(mx + 9, y + 80);
      ctx.closePath();
      ctx.fillStyle = C.white;
      ctx.fill();
    };
    text('Performance', 33, 1040, F(700, 26), C.white);
    range(1080, "Today's Low", "Today's High", STOCK.low, STOCK.high);
    range(1196, '52 Week Low', '52 Week High', STOCK.weekLow, STOCK.weekHigh);
    if (visible(1300, 1460)) {
      [
        ['Open', num(STOCK.open)],
        ['Prev. Close', num(STOCK.prevClose)],
        ['Volume', STOCK.volume],
        ['Lower circuit', STOCK.lowerCircuit],
        ['Upper circuit', STOCK.upperCircuit],
      ].forEach(([label, value], i) => {
        const x = 33 + (i % 3) * 190;
        const y = 1320 + Math.floor(i / 3) * 86;
        text(label, x, y, F(400, 19), C.dim);
        text(value, x, y + 33, F(600, 22), C.white);
      });
    }
    ctx.fillStyle = '#26262a';
    ctx.fillRect(33, 1480, 564, 2);

    // Fundamentals
    if (visible(1500, 1880)) {
      text('Fundamentals', 33, 1545, F(700, 26), C.white);
      FUNDAMENTALS.forEach(([label, value], i) => {
        const col = i % 2;
        const y = 1606 + Math.floor(i / 2) * 52;
        text(label, 33 + col * 302, y, F(400, 20), C.muted);
        text(value, 290 + col * 307, y, F(600, 21), C.white, 'right');
      });
    }
    ctx.fillStyle = '#26262a';
    ctx.fillRect(33, 1880, 564, 2);

    // Quarterly results
    if (visible(1900, 2500)) {
      text('Financial performance', 33, 1950, F(700, 26), C.white);
      fillRR(33, 1975, 150, 52, 26, '#24252b', '#4a4a50');
      text('Quarterly', 108, 2009, F(500, 20), C.white, 'center');
      fillRR(197, 1975, 116, 52, 26, C.bg, '#2f2f34');
      text('Yearly', 255, 2009, F(500, 20), C.dim, 'center');
      text("DEC '25", 33, 2075, F(600, 17), C.dim);
      fillRR(33, 2097, 14, 14, 3, '#6d7a8c');
      text('REVENUE', 57, 2110, F(600, 17), C.muted);
      fillRR(326, 2097, 14, 14, 3, C.green);
      text('PROFIT', 350, 2110, F(600, 17), C.muted);
      text('₹16,580', 33, 2160, F(800, 32), C.white);
      text('Cr  +3.20%', 168, 2160, F(500, 19), C.greenSoft);
      text('₹6,603', 326, 2160, F(800, 32), C.white);
      text('Cr  +145.10%', 446, 2160, F(500, 19), C.greenSoft);
      const base = 2440;
      const unit = 230 / 20;
      ctx.save();
      ctx.setLineDash([6, 8]);
      [0, 10, 20].forEach((v) =>
        stroke('#2f2f34', 1.5, () => {
          ctx.moveTo(33, base - v * unit);
          ctx.lineTo(530, base - v * unit);
        })
      );
      ctx.restore();
      ['0', '10K', '20K'].forEach((l, i) => text(l, 575, base - i * 10 * unit + 6, F(500, 17), C.dim, 'right'));
      QUARTERS.forEach((q, i) => {
        const x = 58 + i * 103;
        const grow = easeOut(clamp01(s.bars * 1.6 - i * 0.15));
        const rh = q.revenue * unit * grow;
        const ph = q.profit * unit * grow;
        fillRR(x, base - rh, 26, rh, 4, q.selected ? '#9fb3d1' : '#3a4655');
        fillRR(x + 32, base - ph, 22, ph, 4, q.selected ? C.green : '#1f5c45');
        text(q.label, x + 27, base + 40, F(q.selected ? 700 : 500, 18), q.selected ? C.white : C.dim, 'center');
      });
    }

    // Who owns it
    if (visible(2560, 3300)) {
      text('Shareholding pattern', 33, 2600, F(700, 26), C.white);
      ["Sep '25", "Dec '25", "Mar '26", "Jun '26"].forEach((l, i) => text(l, 98 + i * 145, 2660, F(500, 20), C.dim, 'center'));
      const cx = 315;
      const cyD = 2860;
      let angle = -Math.PI / 2;
      const total = Math.PI * 2 * easeOut(s.donut);
      HOLDING.forEach((h) => {
        const sweep = (h.share / 100) * Math.PI * 2;
        const draw = Math.max(0, Math.min(sweep, total - (angle + Math.PI / 2)));
        if (draw > 0.01) {
          stroke(h.color, 56, () => ctx.arc(cx, cyD, 156, angle + 0.02, angle + draw - 0.02));
        }
        angle += sweep;
      });
      text(STOCK.symbol, cx, cyD - 4, F(700, 25), C.white, 'center');
      text('Shareholding Pattern', cx, cyD + 28, F(400, 18), C.muted, 'center');
      HOLDING.forEach((h, i) => {
        const y = 3088 + i * 56;
        fillRR(33, y - 20, 22, 22, 4, h.color);
        text(h.name, 75, y, F(400, 21), '#d8d8dc');
        text(`${h.share.toFixed(2)}%`, 597, y, F(700, 21), C.white, 'right');
      });
    }
    ctx.restore();

    // Fixed: back arrow on top and the report button at the bottom
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, 150);
    chevron(44, 113);
    const fade = ctx.createLinearGradient(0, 1130, 0, 1200);
    fade.addColorStop(0, 'rgba(18,18,20,0)');
    fade.addColorStop(1, C.bg);
    ctx.fillStyle = fade;
    ctx.fillRect(0, 1130, W, 70);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 1195, W, H - 1195);
    ctx.save();
    ctx.shadowColor = 'rgba(108,99,255,0.6)';
    ctx.shadowBlur = 30;
    fillRR(33, 1206, 564, 80, 40, C.accent);
    ctx.restore();
    text('✦ Run Full AI Analysis Report', 315, 1257, F(600, 23), C.white, 'center');
    tap(315, 1246, s.tapRun);
  };

  // ---- The report ----
  const drawReport = () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    chevron(32, 134);
    text('Hindustan Unilever Ltd. Report', 68, 145, F(700, 28), C.white);
    stroke('#8a8a90', 3.5, () => ctx.arc(580, 134, 14, -Math.PI * 0.3, Math.PI * 1.5));
    ['Overview', 'Volatility', 'Consistency', 'Downside R'].forEach((t, i) =>
      text(t, [76, 223, 385, 560][i], 252, F(600, 22), i === 0 ? C.white : C.dim, 'center')
    );
    ctx.fillStyle = '#26262a';
    ctx.fillRect(0, 277, W, 2);
    fillRR(20, 272, 112, 5, 3, C.accent);

    fillRR(16, 305, 598, 700, 26, C.card, C.cardLine);
    text('Investment Snapshot', 43, 356, F(700, 23), C.white);
    stroke(C.muted, 2, () => ctx.arc(326, 349, 10, 0, Math.PI * 2));

    // Score dial: the ticks light up to the score
    const ticks = 60;
    const lit = easeOut(s.dial) * (SCORE / 10) * ticks;
    for (let i = 0; i < ticks; i++) {
      const ang = -Math.PI / 2 + (i / ticks) * Math.PI * 2;
      const on = i < lit;
      stroke(on ? '#e5b85c' : '#3a3a3f', 4, () => {
        ctx.moveTo(315 + Math.cos(ang) * 92, 500 + Math.sin(ang) * 92);
        ctx.lineTo(315 + Math.cos(ang) * 112, 500 + Math.sin(ang) * 112);
      });
    }
    text(String(Math.round(easeOut(s.dial) * SCORE)), 315, 530, F(800, 86), C.white, 'center');

    ctx.globalAlpha = clamp01(s.dial * 2);
    text('Mixed fundamentals', 43, 668, F(700, 23), C.white);
    text('2 of 4 pillars positive', 43, 700, F(400, 19), C.muted);
    ctx.globalAlpha = 1;
    PILLARS.forEach((p, i) => {
      const t = clamp01(s.pillars * 1.4 - i * 0.12);
      const x = i % 2 ? 333 : 49;
      const y = 750 + Math.floor(i / 2) * 135;
      ctx.globalAlpha = clamp01(t * 3);
      text(p.name, x, y, F(400, 19), '#c9c9ce');
      text(String(Math.round(p.score * easeOut(t))), x, y + 44, F(800, 32), C.white);
      text(p.verdict, x, y + 76, F(600, 18), p.color);
      ctx.globalAlpha = 1;
    });

    fillRR(16, 1040, 598, 220, 26, C.card, C.cardLine);
    text('Your Goal Fit', 43, 1092, F(700, 23), C.white);
    stroke(C.muted, 2, () => ctx.arc(203, 1085, 10, 0, Math.PI * 2));
    nav();
  };

  // ---- Transitions ----
  // Pushed in from one side: the stock's page comes from the left, where its ticker went in
  const slide = (t: number, draw: () => void, from: 1 | -1 = 1) => {
    const e = easeOut(t);
    ctx.fillStyle = `rgba(0,0,0,${0.45 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(from * (1 - e) * W, 0);
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
    [1, drawExplore],
    [Math.min(s.search, 0.999), drawSearch],
    [s.detail, () => slide(s.detail, drawDetail, -1)],
    [s.report, () => iris(315, 1246, s.report * H * 1.2, drawReport)],
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
