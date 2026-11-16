'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from './LegalLayout';

// The contents list beside a legal page, marking the section being read
export default function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const onScroll = () => {
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top < 160) current = item.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">On this page</p>
      <ul className="max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto border-l border-[#232323] no-scrollbar">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-colors ${
                active === item.id ? 'border-[#A890E6] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-200'
              }`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
