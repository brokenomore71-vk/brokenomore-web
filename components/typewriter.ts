// Types an element's text out, character by character, with a blinking caret at the cursor. Works
// on any markup inside it (a gradient word in a heading, say): every text node is emptied and
// refilled in order, so styling and layout stay exactly as written. The element keeps its full
// height while typing, so nothing below it jumps.
//
// Returns a handle: `done` resolves when it's typed out, `cancel()` puts the full text straight back.

export type Typing = { done: Promise<void>; cancel: () => void };

export function typeText(el: HTMLElement, { msPerChar = 35, delay = 0, keepCaret = false }: { msPerChar?: number; delay?: number; keepCaret?: boolean } = {}): Typing {
  // Re-typing an element that's already mid-way: start from its full text
  const previous = (el as HTMLElement & { __typing?: Typing }).__typing;
  previous?.cancel();

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; text: string }[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    if (node.parentElement?.classList.contains('tw-caret')) continue;
    nodes.push({ node, text: node.nodeValue ?? '' });
  }
  const total = nodes.reduce((t, n) => t + n.text.length, 0);

  const caret = document.createElement('span');
  caret.className = 'tw-caret';
  caret.setAttribute('aria-hidden', 'true');

  const minHeight = el.style.minHeight;
  el.style.minHeight = `${el.offsetHeight}px`;
  el.setAttribute('aria-label', nodes.map((n) => n.text).join(''));
  nodes.forEach((n) => (n.node.nodeValue = ''));

  let raf = 0;
  let finished = false;
  let resolve: () => void = () => undefined;
  const done = new Promise<void>((r) => (resolve = r));

  const finish = (removeCaret: boolean) => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    nodes.forEach((n) => (n.node.nodeValue = n.text));
    if (removeCaret) caret.remove();
    el.style.minHeight = minHeight;
    el.removeAttribute('aria-label');
    resolve();
  };

  const show = (count: number) => {
    let left = count;
    let at: Text | null = nodes[0]?.node ?? null;
    for (const n of nodes) {
      const take = Math.max(0, Math.min(n.text.length, left));
      n.node.nodeValue = n.text.slice(0, take);
      if (take > 0) at = n.node;
      left -= take;
    }
    // The caret sits just after the last character typed
    if (at?.parentNode) at.parentNode.insertBefore(caret, at.nextSibling);
  };

  const start = () => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const count = Math.floor((now - t0) / msPerChar);
      show(Math.min(total, count));
      if (count >= total) {
        finish(!keepCaret);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    show(0);
    raf = requestAnimationFrame(tick);
  };
  const timer = setTimeout(start, delay);

  const handle: Typing = { done, cancel: () => finish(true) };
  (el as HTMLElement & { __typing?: Typing }).__typing = handle;
  return handle;
}
