'use client';

import './admin.css';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  IconLayoutDashboard,
  IconUsers,
  IconChartAreaLine,
  IconGift,
  IconSettings,
  IconLogout,
  IconMenu2,
  IconX,
  IconExternalLink,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Avatar } from './_components/ui';

const ADMIN_EMAIL = 'admin@brokenomore.in';

const NAV = [
  { label: 'Overview', href: '/admin', icon: IconLayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: IconUsers },
  { label: 'Analytics', href: '/admin/analytics', icon: IconChartAreaLine },
  { label: 'Offers', href: '/admin/offers', icon: IconGift },
];

const SECONDARY = [{ label: 'Settings', href: '/admin/settings', icon: IconSettings }];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const guard = (u: User | null | undefined) => {
      if (!active) return;
      if (!u) {
        router.replace(`/signin?next=${encodeURIComponent(pathname || '/admin')}`);
        return;
      }
      if (u.email?.toLowerCase() !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      setUser(u);
      setChecking(false);
    };

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) supabase.auth.signOut().catch(() => {});
        guard(error ? null : data.session?.user);
      })
      .catch(() => guard(null));

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') guard(null);
      else if (session?.user) guard(session.user);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setDrawerOpen(false), [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/signin');
  };

  if (checking) {
    return (
      <div className="admin-root grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Image src="/assets/images/main_logo.png" alt="BrokeNoMore" width={44} height={44} className="opacity-90" />
          <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10">
            <div className="admin-skeleton h-full w-full !rounded-none !bg-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const current = [...NAV, ...SECONDARY].find((n) =>
    n.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(n.href)
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <Image src="/assets/images/main_logo.png" alt="" width={30} height={30} />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-(--a-text)">BrokeNoMore</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-(--a-subtle)">Admin console</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-3" aria-label="Admin">
        <NavGroup items={NAV} current={current?.href} />
        <div>
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-(--a-subtle)">System</p>
          <NavGroup items={SECONDARY} current={current?.href} />
          <Link
            href="/"
            target="_blank"
            className="mt-0.5 flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-(--a-muted) transition-colors hover:bg-(--a-raised) hover:text-(--a-text)"
          >
            <IconExternalLink size={18} stroke={1.75} />
            View website
          </Link>
        </div>
      </nav>

      <div className="border-t border-(--a-border) p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name="Admin" size={34} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-(--a-text)">Admin</p>
            <p className="truncate text-xs text-(--a-subtle)">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid h-8 w-8 place-items-center rounded-lg text-(--a-subtle) transition-colors hover:bg-(--a-red-soft) hover:text-(--a-red)"
          >
            <IconLogout size={17} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-root min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-(--a-border) bg-(--a-surface)/60 backdrop-blur lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-(--a-border) bg-(--a-bg)/85 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg text-(--a-muted) hover:bg-(--a-raised)"
        >
          <IconMenu2 size={20} />
        </button>
        <p className="text-sm font-semibold">{current?.label ?? 'Admin'}</p>
        <Image src="/assets/images/main_logo.png" alt="" width={26} height={26} />
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[272px] border-r border-(--a-border) bg-(--a-surface) transition-transform duration-300 lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-(--a-subtle) hover:bg-(--a-raised)"
        >
          <IconX size={18} />
        </button>
        {sidebar}
      </aside>

      <main className="admin-glow min-h-screen lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}

function NavGroup({
  items,
  current,
}: {
  items: { label: string; href: string; icon: typeof IconUsers }[];
  current?: string;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ label, href, icon: Icon }) => {
        const active = current === href;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors',
                active
                  ? 'bg-(--a-accent-soft) font-medium text-(--a-text)'
                  : 'text-(--a-muted) hover:bg-(--a-raised) hover:text-(--a-text)'
              )}
            >
              {active && <span className="absolute left-0 top-2.5 h-5 w-[3px] rounded-r-full bg-(--a-accent)" />}
              <Icon size={18} stroke={1.75} className={active ? 'text-(--a-lavender)' : ''} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
