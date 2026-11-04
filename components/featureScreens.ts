'use client';

export interface FeatureScreenDef {
  id: string;
  name: string;
  iconName: string;
  tagline: string;
  description: string;
  accentColor: string;
  badge: string;
  renderScreen: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

// Helper drawing utilities for high-end dark fintech mobile UI
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawPhoneFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Deep dark background with subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0a0a0f');
  bgGrad.addColorStop(0.5, '#0e0e17');
  bgGrad.addColorStop(1, '#08080c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Status Bar
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('9:41', 42, 48);

  // Dynamic Island / Top Camera Pill
  ctx.fillStyle = '#000000';
  roundRect(ctx, width / 2 - 65, 24, 130, 32, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Status Bar Icons (Battery, WiFi, Signal)
  // Signal Bars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    const barH = 6 + i * 4;
    ctx.fillRect(width - 120 + i * 6, 48 - barH, 4, barH);
  }
  // 5G Label
  ctx.font = '700 13px -apple-system, sans-serif';
  ctx.fillText('5G', width - 88, 48);

  // Battery
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  roundRect(ctx, width - 62, 33, 26, 14, 3);
  ctx.stroke();
  ctx.fillStyle = '#10b981'; // 90% green battery
  ctx.fillRect(width - 60, 35, 18, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(width - 36, 37, 2, 6);

  // Bottom Navigation Bar
  const navY = height - 90;
  ctx.fillStyle = 'rgba(18, 18, 24, 0.95)';
  roundRect(ctx, 24, navY, width - 48, 64, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bottom Home Bar Indicator
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  roundRect(ctx, width / 2 - 65, height - 16, 130, 4, 2);
  ctx.fill();
}

function drawBottomNavIcons(ctx: CanvasRenderingContext2D, width: number, height: number, activeIndex: number) {
  const navY = height - 90;
  const labels = ['Home', 'Budget', 'Vault', 'Split', 'Alerts'];
  const total = labels.length;
  const startX = 24;
  const stepX = (width - 48) / total;

  for (let i = 0; i < total; i++) {
    const cx = startX + stepX * i + stepX / 2;
    const cy = navY + 32;
    const isActive = i === activeIndex;

    ctx.fillStyle = isActive ? '#a855f7' : 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, isActive ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${isActive ? '600' : '400'} 11px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], cx, cy + 16);

    if (isActive) {
      // Small glowing indicator dot underneath
      ctx.fillStyle = '#6c63ff';
      ctx.beginPath();
      ctx.arc(cx, cy + 24, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 1. EXPENSE TRACKING SCREEN
function renderExpenses(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 0);

  // App Header
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('EXPENSE TRACKER', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('November 2026', 28, 124);

  // Total Balance Card
  const cardGrad = ctx.createLinearGradient(28, 145, w - 28, 290);
  cardGrad.addColorStop(0, '#2e1065');
  cardGrad.addColorStop(1, '#4c1d95');
  ctx.fillStyle = cardGrad;
  roundRect(ctx, 28, 145, w - 56, 145, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('Total Net Balance', 48, 178);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px -apple-system, sans-serif';
  ctx.fillText('₹42,850.00', 48, 222);

  ctx.fillStyle = '#34d399';
  ctx.font = '600 13px -apple-system, sans-serif';
  ctx.fillText('↑ ₹12,400 (saved this month)', 48, 256);

  // Income & Expenses Counters
  const pillW = (w - 68) / 2;
  // Income pill
  ctx.fillStyle = 'rgba(24, 24, 32, 0.9)';
  roundRect(ctx, 28, 305, pillW, 70, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
  ctx.stroke();
  ctx.fillStyle = '#10b981';
  ctx.font = '600 12px -apple-system, sans-serif';
  ctx.fillText('INCOME (NOV)', 42, 328);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('₹75,000', 42, 356);

  // Expense pill
  ctx.fillStyle = 'rgba(24, 24, 32, 0.9)';
  roundRect(ctx, 40 + pillW, 305, pillW, 70, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.font = '600 12px -apple-system, sans-serif';
  ctx.fillText('SPENT (NOV)', 54 + pillW, 328);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('₹32,150', 54 + pillW, 356);

  // Recent Transactions Header
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('Recent Transactions', 28, 412);

  // Transaction list items
  const transactions = [
    { name: 'Swiggy Food Delivery', cat: 'Dining Out • Today, 2:30 PM', amt: '-₹480', color: '#f97316' },
    { name: 'Amazon Prime Order', cat: 'Shopping • Yesterday', amt: '-₹2,199', color: '#a855f7' },
    { name: 'Tech Solutions Salary', cat: 'Income • 1 Nov, 10:00 AM', amt: '+₹75,000', color: '#10b981' },
    { name: 'Netflix Premium HD', cat: 'Subscriptions • 28 Oct', amt: '-₹649', color: '#ef4444' },
    { name: 'Uber Ride Airport', cat: 'Travel • 26 Oct', amt: '-₹890', color: '#3b82f6' },
    { name: 'Starbucks Coffee', cat: 'Dining Out • 25 Oct', amt: '-₹350', color: '#f59e0b' },
  ];

  transactions.forEach((tx, i) => {
    const y = 432 + i * 62;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, 28, y, w - 56, 52, 12);
    ctx.fill();

    // Circle icon
    ctx.fillStyle = tx.color;
    ctx.beginPath();
    ctx.arc(54, y + 26, 15, 0, Math.PI * 2);
    ctx.fill();

    // Name & category
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px -apple-system, sans-serif';
    ctx.fillText(tx.name, 80, y + 22);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.fillText(tx.cat, 80, y + 40);

    // Amount
    ctx.textAlign = 'right';
    ctx.fillStyle = tx.amt.startsWith('+') ? '#34d399' : '#ffffff';
    ctx.font = '700 15px -apple-system, sans-serif';
    ctx.fillText(tx.amt, w - 44, y + 32);
  });
}

// 2. SMART BUDGETING SCREEN
function renderBudgeting(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('SMART BUDGETS', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('Monthly Budget: ₹50,000', 28, 124);

  // Overall Budget Card
  ctx.fillStyle = 'rgba(24, 24, 34, 0.95)';
  roundRect(ctx, 28, 145, w - 56, 175, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(108, 99, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('₹31,200 spent of ₹50,000', 48, 176);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px -apple-system, sans-serif';
  ctx.fillText('₹18,800 Left', 48, 216);

  // Overall Progress Bar
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, 48, 236, w - 96, 12, 6);
  ctx.fill();

  const progGrad = ctx.createLinearGradient(48, 0, w - 48, 0);
  progGrad.addColorStop(0, '#6c63ff');
  progGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = progGrad;
  roundRect(ctx, 48, 236, (w - 96) * 0.624, 12, 6);
  ctx.fill();

  ctx.fillStyle = '#34d399';
  ctx.font = '500 12px -apple-system, sans-serif';
  ctx.fillText('18 days remaining • Pace is optimal (62.4%)', 48, 280);

  // Category Budgets Header
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('Category Allowances', 28, 355);

  const categories = [
    { name: 'Food & Dining', spent: '₹7,500', cap: '₹10,000', ratio: 0.75, color: '#f97316' },
    { name: 'Groceries & Staples', spent: '₹6,200', cap: '₹8,000', ratio: 0.77, color: '#a855f7' },
    { name: 'Shopping & Gear', spent: '₹9,800', cap: '₹15,000', ratio: 0.65, color: '#3b82f6' },
    { name: 'Entertainment', spent: '₹3,100', cap: '₹5,000', ratio: 0.62, color: '#06b6d4' },
    { name: 'Bills & Recharge', spent: '₹4,600', cap: '₹12,000', ratio: 0.38, color: '#10b981' },
  ];

  categories.forEach((cat, i) => {
    const y = 375 + i * 78;
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    roundRect(ctx, 28, y, w - 56, 68, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px -apple-system, sans-serif';
    ctx.fillText(cat.name, 44, y + 24);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 13px -apple-system, sans-serif';
    ctx.fillText(`${cat.spent} / ${cat.cap}`, w - 44, y + 24);

    // Mini progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, 44, y + 38, w - 88, 8, 4);
    ctx.fill();

    ctx.fillStyle = cat.color;
    roundRect(ctx, 44, y + 38, (w - 88) * cat.ratio, 8, 4);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.fillText(`${Math.round(cat.ratio * 100)}% utilized`, 44, y + 58);
  });
}

// 3. SAVINGS GOALS SCREEN
function renderSavings(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('SAVINGS VAULTS', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('Goals & Milestones', 28, 124);

  // Total Saved Card
  ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
  roundRect(ctx, 28, 145, w - 56, 110, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.font = '600 12px -apple-system, sans-serif';
  ctx.fillText('TOTAL SAVED ACCUMULATION', 48, 175);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px -apple-system, sans-serif';
  ctx.fillText('₹3,45,000', 48, 214);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 12px -apple-system, sans-serif';
  ctx.fillText('Across 3 active financial goals', 48, 238);

  // Goals List
  const goals = [
    { title: 'Emergency Fund', saved: '₹85,000', target: '₹1,00,000', pct: 0.85, emoji: '🛡️', color: '#10b981' },
    { title: 'Japan Vacation 2027', saved: '₹1,40,000', target: '₹2,00,000', pct: 0.70, emoji: '✈️', color: '#a855f7' },
    { title: 'MacBook Pro M4 Max', saved: '₹1,20,000', target: '₹1,50,000', pct: 0.80, emoji: '💻', color: '#06b6d4' },
    { title: 'Crypto Index Fund', saved: '₹45,000', target: '₹75,000', pct: 0.60, emoji: '⚡', color: '#f59e0b' },
  ];

  goals.forEach((g, i) => {
    const y = 275 + i * 115;
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    roundRect(ctx, 28, y, w - 56, 102, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.stroke();

    ctx.font = '24px -apple-system, sans-serif';
    ctx.fillText(g.emoji, 44, y + 36);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px -apple-system, sans-serif';
    ctx.fillText(g.title, 82, y + 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = g.color;
    ctx.font = '700 15px -apple-system, sans-serif';
    ctx.fillText(`${Math.round(g.pct * 100)}%`, w - 44, y + 30);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 13px -apple-system, sans-serif';
    ctx.fillText(`${g.saved} saved of ${g.target}`, 82, y + 50);

    // Progress Bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, 44, y + 66, w - 88, 10, 5);
    ctx.fill();

    ctx.fillStyle = g.color;
    roundRect(ctx, 44, y + 66, (w - 88) * g.pct, 10, 5);
    ctx.fill();

    ctx.fillStyle = '#34d399';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.fillText('Auto-save active (₹2,500 every Friday)', 44, y + 90);
  });
}

// 4. BILL SPLITTING SCREEN
function renderBillSplit(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 3);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('SPLIT & SETTLE', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('Goa Villa Trip 🌴', 28, 124);

  // Settlement Banner
  ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
  roundRect(ctx, 28, 145, w - 56, 85, 16);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.font = '600 13px -apple-system, sans-serif';
  ctx.fillText('OVERALL BALANCE', 44, 172);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px -apple-system, sans-serif';
  ctx.fillText('You are owed ₹4,250', 44, 206);

  // Members Card
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('Group Members (4)', 28, 260);

  const members = [
    { name: 'You (Host)', paid: 'Paid ₹18,000', status: 'Owed ₹4,250', color: '#10b981' },
    { name: 'Kushagra S.', paid: 'Paid ₹10,200', status: 'Owes you ₹1,850', color: '#f59e0b' },
    { name: 'Vruddhi P.', paid: 'Paid ₹8,000', status: 'Settled', color: '#6b7280' },
    { name: 'Rahul M.', paid: 'Paid ₹3,700', status: 'Owes you ₹2,400', color: '#ef4444' },
  ];

  members.forEach((m, i) => {
    const y = 280 + i * 62;
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    roundRect(ctx, 28, y, w - 56, 52, 12);
    ctx.fill();

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(52, y + 26, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px -apple-system, sans-serif';
    ctx.fillText(m.name, 76, y + 22);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.fillText(m.paid, 76, y + 40);

    ctx.textAlign = 'right';
    ctx.fillStyle = m.color;
    ctx.font = '600 13px -apple-system, sans-serif';
    ctx.fillText(m.status, w - 44, y + 32);
  });

  // Recent Splits Header
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('Shared Expenses', 28, 555);

  const expenses = [
    { item: 'Villa Booking (3 Nights)', payer: 'Paid by You', amt: '₹18,000' },
    { item: 'Seafood Beach Dinner', payer: 'Paid by Kushagra', amt: '₹6,400' },
    { item: 'Self-Drive Car Rental', payer: 'Paid by You', amt: '₹12,000' },
  ];

  expenses.forEach((ex, i) => {
    const y = 575 + i * 64;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, 28, y, w - 56, 54, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px -apple-system, sans-serif';
    ctx.fillText(ex.item, 44, y + 24);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.fillText(ex.payer, 44, y + 42);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px -apple-system, sans-serif';
    ctx.fillText(ex.amt, w - 44, y + 32);
    ctx.textAlign = 'left';
  });

  // Settle Button
  ctx.fillStyle = '#6c63ff';
  roundRect(ctx, 28, 790, w - 56, 50, 25);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Request Settle Up via UPI', w / 2, 822);
}

// 5. SUBSCRIPTION MANAGEMENT SCREEN
function renderSubscriptions(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 0);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('RECURRING CHARGES', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('Subscription Manager', 28, 124);

  // Summary Card
  const subGrad = ctx.createLinearGradient(28, 145, w - 28, 265);
  subGrad.addColorStop(0, '#1e1b4b');
  subGrad.addColorStop(1, '#312e81');
  ctx.fillStyle = subGrad;
  roundRect(ctx, 28, 145, w - 56, 120, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 12px -apple-system, sans-serif';
  ctx.fillText('MONTHLY RECURRING TOTAL', 48, 175);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 34px -apple-system, sans-serif';
  ctx.fillText('₹2,449/mo', 48, 216);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '500 12px -apple-system, sans-serif';
  ctx.fillText('⚡ 2 renewals scheduled this week (₹828)', 48, 244);

  // Active Subscriptions
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('Active Services (7)', 28, 295);

  const subs = [
    { name: 'Netflix 4K UHD', cycle: 'Renews in 3 days', cost: '₹649/mo', color: '#e50914', alert: true },
    { name: 'Spotify Premium Family', cycle: 'Renews in 12 days', cost: '₹179/mo', color: '#1db954', alert: false },
    { name: 'Amazon Prime Annual', cycle: 'Renews Dec 15', cost: '₹1,499/yr', color: '#00a8e1', alert: false },
    { name: 'Google One Cloud 2TB', cycle: 'Renews in 18 days', cost: '₹650/mo', color: '#4285f4', alert: false },
    { name: 'ChatGPT Plus Team', cycle: 'Renews in 21 days', cost: '₹1,999/mo', color: '#10a37f', alert: false },
    { name: 'Figma Professional', cycle: 'Renews in 24 days', cost: '₹1,200/mo', color: '#a259ff', alert: false },
  ];

  subs.forEach((sub, i) => {
    const y = 315 + i * 68;
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    roundRect(ctx, 28, y, w - 56, 58, 14);
    ctx.fill();
    ctx.strokeStyle = sub.alert ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.06)';
    ctx.stroke();

    ctx.fillStyle = sub.color;
    roundRect(ctx, 42, y + 15, 28, 28, 8);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px -apple-system, sans-serif';
    ctx.fillText(sub.name, 80, y + 26);

    ctx.fillStyle = sub.alert ? '#fbbf24' : 'rgba(255,255,255,0.45)';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.fillText(sub.cycle, 80, y + 44);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px -apple-system, sans-serif';
    ctx.fillText(sub.cost, w - 44, y + 34);
  });
}

// 6. GOLD INVESTMENT SCREEN
function renderGold(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('DIGITAL GOLD VAULT', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('24K 99.9% Pure Gold', 28, 124);

  // Live Price Card
  const goldGrad = ctx.createLinearGradient(28, 145, w - 28, 285);
  goldGrad.addColorStop(0, '#78350f');
  goldGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = goldGrad;
  roundRect(ctx, 28, 145, w - 56, 140, 20);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = '600 12px -apple-system, sans-serif';
  ctx.fillText('LIVE 24K BUY PRICE', 48, 175);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px -apple-system, sans-serif';
  ctx.fillText('₹7,845.50 / gm', 48, 218);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 13px -apple-system, sans-serif';
  ctx.fillText('▲ +1.42% (Today) • Insured by Brink\'s Vaults', 48, 252);

  // Your Holdings Card
  ctx.fillStyle = 'rgba(24, 24, 32, 0.95)';
  roundRect(ctx, 28, 305, w - 56, 115, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('Your Gold Portfolio', 48, 334);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '800 28px -apple-system, sans-serif';
  ctx.fillText('12.450 gm', 48, 372);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('₹97,676.47', w - 48, 365);
  ctx.fillStyle = '#10b981';
  ctx.font = '500 12px -apple-system, sans-serif';
  ctx.fillText('+₹8,240 profit', w - 48, 388);

  // Quick Buy Options
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('Quick Purchase', 28, 450);

  const chips = ['₹100', '₹500', '₹1,000', '₹5,000'];
  const chipW = (w - 56 - 36) / 4;
  chips.forEach((c, idx) => {
    const x = 28 + idx * (chipW + 12);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, x, 470, chipW, 46, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c, x + chipW / 2, 498);
  });

  // Features List
  ctx.textAlign = 'left';
  const features = [
    '• 100% 24K 99.9% Hallmarked Purity',
    '• Stored in secured IDBI / Brink\'s Vaults',
    '• Sell anytime 24/7 with instant UPI transfer',
    '• Convert to physical minted gold coins anytime',
  ];
  features.forEach((f, i) => {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '400 13px -apple-system, sans-serif';
    ctx.fillText(f, 32, 555 + i * 32);
  });

  // Buy CTA Button
  ctx.fillStyle = '#f59e0b';
  roundRect(ctx, 28, 780, w - 56, 52, 26);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = '800 16px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Invest in 24K Gold Now', w / 2, 812);
}

// 7. FINANCIAL CALCULATORS SCREEN
function renderCalculators(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('FINANCIAL TOOLS', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('SIP Wealth Calculator', 28, 124);

  // Tabs: SIP | Lumpsum | EMI | PPF
  const tabs = ['SIP', 'Lumpsum', 'EMI', 'PPF'];
  const tabW = (w - 56 - 36) / 4;
  tabs.forEach((t, i) => {
    const x = 28 + i * (tabW + 12);
    ctx.fillStyle = i === 0 ? '#6c63ff' : 'rgba(255,255,255,0.05)';
    roundRect(ctx, x, 145, tabW, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t, x + tabW / 2, 168);
  });

  // Inputs Card
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(24, 24, 34, 0.95)';
  roundRect(ctx, 28, 200, w - 56, 210, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();

  // Slider 1: Monthly Investment
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('Monthly Investment', 48, 230);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px -apple-system, sans-serif';
  ctx.fillText('₹10,000 / mo', w - 48, 230);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, 48, 245, w - 96, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#6c63ff';
  roundRect(ctx, 48, 245, (w - 96) * 0.4, 6, 3);
  ctx.fill();

  // Slider 2: Expected Return Rate
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('Expected Return Rate', 48, 290);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px -apple-system, sans-serif';
  ctx.fillText('14.0% p.a.', w - 48, 290);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, 48, 305, w - 96, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#a855f7';
  roundRect(ctx, 48, 305, (w - 96) * 0.6, 6, 3);
  ctx.fill();

  // Slider 3: Time Horizon
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('Time Horizon', 48, 350);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px -apple-system, sans-serif';
  ctx.fillText('10 Years', w - 48, 350);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, 48, 365, w - 96, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#06b6d4';
  roundRect(ctx, 48, 365, (w - 96) * 0.5, 6, 3);
  ctx.fill();

  // Result Card
  const resGrad = ctx.createLinearGradient(28, 430, w - 28, 620);
  resGrad.addColorStop(0, '#1e1b4b');
  resGrad.addColorStop(1, '#4338ca');
  ctx.fillStyle = resGrad;
  roundRect(ctx, 28, 430, w - 56, 190, 20);
  ctx.fill();
  ctx.strokeStyle = '#818cf8';
  ctx.stroke();

  ctx.fillStyle = '#c7d2fe';
  ctx.font = '600 12px -apple-system, sans-serif';
  ctx.fillText('TOTAL MATURITY WEALTH', 48, 462);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px -apple-system, sans-serif';
  ctx.fillText('₹26,20,175', 48, 506);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '500 14px -apple-system, sans-serif';
  ctx.fillText('Invested Amount: ₹12,00,000 (45.8%)', 48, 545);
  ctx.fillStyle = '#34d399';
  ctx.fillText('Estimated Returns: ₹14,20,175 (54.2%)', 48, 575);

  // Ratio Bar
  ctx.fillStyle = '#3b82f6';
  roundRect(ctx, 48, 595, (w - 96) * 0.458, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  roundRect(ctx, 48 + (w - 96) * 0.458 + 4, 595, (w - 96) * 0.542 - 4, 8, 4);
  ctx.fill();
}

// 8. FINANCIAL INSIGHTS SCREEN
function renderInsights(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('AI FINANCIAL HEALTH', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('Smart Analytics & Trends', 28, 124);

  // Health Score Card
  ctx.fillStyle = 'rgba(24, 24, 34, 0.95)';
  roundRect(ctx, 28, 145, w - 56, 150, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(108, 99, 255, 0.4)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 48px -apple-system, sans-serif';
  ctx.fillText('88', 52, 215);

  ctx.fillStyle = '#6c63ff';
  ctx.font = '700 20px -apple-system, sans-serif';
  ctx.fillText('/ 100', 114, 215);

  ctx.fillStyle = '#34d399';
  ctx.font = '700 16px -apple-system, sans-serif';
  ctx.fillText('Excellent Score', 52, 248);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 12px -apple-system, sans-serif';
  ctx.fillText('Top 5% among savvy savers in your city', 52, 272);

  // Cashflow Trend Wave Card
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  roundRect(ctx, 28, 315, w - 56, 170, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px -apple-system, sans-serif';
  ctx.fillText('Cash Flow Trajectory (6 Months)', 46, 345);

  // Draw smooth curve
  ctx.beginPath();
  const startY = 440;
  ctx.moveTo(46, startY);
  ctx.bezierCurveTo(120, 390, 200, 460, 280, 380);
  ctx.bezierCurveTo(340, 330, 400, 370, w - 46, 340);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Gradient fill under curve
  ctx.lineTo(w - 46, 460);
  ctx.lineTo(46, 460);
  ctx.closePath();
  const curveGrad = ctx.createLinearGradient(0, 340, 0, 460);
  curveGrad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
  curveGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = curveGrad;
  ctx.fill();

  // AI Insights Feed
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px -apple-system, sans-serif';
  ctx.fillText('Actionable AI Insights', 28, 518);

  const tips = [
    { title: '💡 Weekend Dining Drop', body: 'You spent 18% less on food delivery this week. Saved ₹2,400.', tag: 'SAVINGS' },
    { title: '📈 Milestone Accelerator', body: 'Investing ₹3,000 extra in mutual funds hits your Japan goal 2 months early.', tag: 'GROWTH' },
    { title: '⚠️ Idle Cash Detection', body: '₹35,000 sitting idle in zero-interest account. Earn 7.2% in liquid gold.', tag: 'ALERT' },
  ];

  tips.forEach((t, i) => {
    const y = 538 + i * 85;
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    roundRect(ctx, 28, y, w - 56, 74, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px -apple-system, sans-serif';
    ctx.fillText(t.title, 44, y + 26);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px -apple-system, sans-serif';
    ctx.fillText(t.body, 44, y + 46);
  });
}

// 9. SMART NOTIFICATIONS SCREEN
function renderNotifications(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawPhoneFrame(ctx, w, h);
  drawBottomNavIcons(ctx, w, h, 4);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 13px -apple-system, sans-serif';
  ctx.fillText('FINANCIAL RADAR', 28, 94);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px -apple-system, sans-serif';
  ctx.fillText('Notifications & Alerts', 28, 124);

  const notifs = [
    { title: 'Credit Card Bill Due', time: '10m ago', body: 'HDFC Bank bill of ₹14,200 is due in 24 hours. Tap to pay now.', icon: '💳', color: '#ef4444' },
    { title: 'Bill Settlement Received', time: '1h ago', body: 'Kushagra S. settled ₹1,850 via UPI for Goa Villa Trip.', icon: '✅', color: '#10b981' },
    { title: 'Upcoming Auto-Debit', time: '3h ago', body: 'Netflix Premium ₹649 will auto-renew in 3 days on Nov 7.', icon: '🔁', color: '#f59e0b' },
    { title: 'Goal Milestone Achieved', time: 'Yesterday', body: 'Emergency Fund hit 85% of target! Added ₹5,000.', icon: '🎯', color: '#6c63ff' },
    { title: 'Budget Limit Notice', time: '2 days ago', body: 'Dining Out budget reached 75%. ₹2,500 remaining for November.', icon: '⚠️', color: '#f97316' },
    { title: 'Gold Market Gain', time: '3 days ago', body: 'Gold price surged +1.4% today. Your portfolio increased by ₹1,350.', icon: '🪙', color: '#eab308' },
  ];

  notifs.forEach((n, i) => {
    const y = 145 + i * 92;
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    roundRect(ctx, 28, y, w - 56, 80, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.stroke();

    ctx.font = '22px -apple-system, sans-serif';
    ctx.fillText(n.icon, 44, y + 36);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px -apple-system, sans-serif';
    ctx.fillText(n.title, 80, y + 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.fillText(n.time, w - 44, y + 28);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '400 12px -apple-system, sans-serif';
    ctx.fillText(n.body.length > 44 ? n.body.slice(0, 44) + '...' : n.body, 80, y + 50);
  });
}

// BrokeNoMore floating features: Gold Savings, Split & Share, Stocks, Loan Planner, File ITR
export const BROKENOMORE_FEATURES: FeatureScreenDef[] = [
  {
    id: 'gold',
    name: 'Gold Savings',
    iconName: 'IconCoins',
    tagline: 'Invest in 24K 99.9% pure digital gold starting at just ₹10.',
    description: 'Start daily, weekly, or monthly digital gold SIPs with zero storage fee, insured vaults, and doorstep delivery.',
    accentColor: '#F59E0B',
    badge: '24K 99.9%',
    renderScreen: renderGold,
  },
  {
    id: 'split',
    name: 'Split & Share',
    iconName: 'IconUsers',
    tagline: 'Split expenses effortlessly and settle balances with friends.',
    description: 'Seamless group bill splitting with individual breakdown, net debt calculations, and 1-tap instant UPI settlements.',
    accentColor: '#00D4FF',
    badge: 'Instant UPI',
    renderScreen: renderBillSplit,
  },
  {
    id: 'stocks',
    name: 'Stocks',
    iconName: 'IconTrendingUp',
    tagline: 'Trade equities, track live markets, and build your wealth.',
    description: 'Real-time quotes, automated portfolio tracking, zero-brokerage equity plans, and intelligent stock alerts.',
    accentColor: '#10B981',
    badge: 'Real-time',
    renderScreen: renderInsights,
  },
  {
    id: 'loan',
    name: 'Loan Planner',
    iconName: 'IconCalculator',
    tagline: 'Plan EMIs, compare loans, and optimize prepayments.',
    description: 'Interactive EMI calculator with prepayment simulators, interest reduction strategies, and payoff timelines.',
    accentColor: '#8B5CF6',
    badge: 'Smart EMI',
    renderScreen: renderCalculators,
  },
  {
    id: 'itr',
    name: 'File ITR',
    iconName: 'IconReceiptTax',
    tagline: 'File income tax returns in minutes with maximum deductions.',
    description: 'Automated Form 16 & AIS/TIS import, capital gains computation, tax regime comparison, and instant e-filing.',
    accentColor: '#EC4899',
    badge: 'Max Refund',
    renderScreen: renderCalculators,
  },
];

