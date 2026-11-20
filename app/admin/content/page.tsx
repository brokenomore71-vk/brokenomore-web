'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { CONTENT_NAV, useAdminSession } from '@/components/admin/AdminShell';
import { adminApi, type Kind } from '@/lib/admin/api';

const SECTIONS: { kind: Kind; blurb: string }[] = [
  { kind: 'credit-cards', blurb: 'Card catalogue, fees, benefits and apply links' },
  { kind: 'festivals', blurb: 'Dashboard banners and the days they show' },
  { kind: 'feature-slides', blurb: 'Full-screen feature stories and their order' },
];

export default function ContentHome() {
  const session = useAdminSession();
  const [counts, setCounts] = useState<Partial<Record<Kind, { total: number; live: number } | null>>>({});

  useEffect(() => {
    SECTIONS.forEach(({ kind }) =>
      adminApi
        .list(kind)
        .then((r) => setCounts((c) => ({ ...c, [kind]: { total: r.total, live: r.items.filter((i) => i.is_active).length } })))
        .catch(() => setCounts((c) => ({ ...c, [kind]: null }))),
    );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">App content</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#a1a1aa]">
          What you publish here goes straight to the BrokeNoMore app, with no app update. The app picks up a change the next time it loads that
          content.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {SECTIONS.map(({ kind, blurb }) => {
          const nav = CONTENT_NAV.find((n) => n.href.endsWith(kind))!;
          const count = counts[kind];
          return (
            <Link key={kind} href={nav.href} className="group rounded-[24px] bg-[#26262B] p-6 transition hover:bg-[#2C2C32]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C1C20] text-[#A9A2FF]">
                <nav.icon size={20} stroke={1.8} />
              </span>
              <p className="mt-5 flex items-center gap-1.5 text-lg font-semibold">
                {nav.label}
                <IconArrowRight size={17} className="text-[#5c5c63] transition group-hover:translate-x-0.5 group-hover:text-white" />
              </p>
              <p className="mt-1 text-xs text-[#8b8b94]">{blurb}</p>
              <p className="mt-6 text-sm tabular-nums text-[#d4d4d8]">
                {count === undefined ? '…' : count === null ? 'Could not load' : `${count.live} live · ${count.total - count.live} hidden`}
              </p>
            </Link>
          );
        })}
      </div>
      {session && (
        <p className="text-xs text-[#5c5c63]">
          Saved to {session.storage === 'gcs' ? 'Cloud Storage (production)' : 'local JSON files (development)'}
        </p>
      )}
    </div>
  );
}
