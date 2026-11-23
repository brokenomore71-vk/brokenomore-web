'use client';

// Frame for the admin panel's Content pages (/admin/content/*): the same sign-in and look as /admin/dashboard.
// Sign-in happens at /admin; without an admin session these pages send you there.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconCalendarEvent,
  IconCreditCard,
  IconHelpCircle,
  IconLayoutDashboard,
  IconLoader2,
  IconLogout,
  IconMenu2,
  IconPresentation,
  IconX,
} from '@tabler/icons-react';
import type { Session } from '@supabase/supabase-js';
import { adminSupabase, isAdminSession } from '@/lib/admin/client';
import { adminApi, API_BASE, ApiError, type SessionInfo } from '@/lib/admin/api';
import { cn } from '@/lib/utils';
import { Button, ToastProvider } from './ui';

const AdminContext = createContext<SessionInfo | null>(null);
export const useAdminSession = () => useContext(AdminContext);

export const CONTENT_NAV = [
  { href: '/admin/content/credit-cards', label: 'Credit Cards', icon: IconCreditCard },
  { href: '/admin/content/festivals', label: 'Festivals', icon: IconCalendarEvent },
  { href: '/admin/content/feature-slides', label: 'Feature Slides', icon: IconPresentation },
  { href: '/admin/content/faqs', label: 'FAQs', icon: IconHelpCircle },
];

type State = { stage: 'loading' } | { stage: 'error'; message: string } | { stage: 'ready'; info: SessionInfo };

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ stage: 'loading' });
  // Supabase may report the session again (e.g. on tab focus). Re-checking would remount the page and throw
  // away an open, unsaved form, so a repeat for the user already checked is ignored.
  const checkedUser = useRef<string | null>(null);

  const signOut = useCallback(async () => {
    await adminSupabase.auth.signOut();
    router.replace('/admin');
  }, [router]);

  // Admin session (same rule as /admin/dashboard), then the content backend's own check
  const verify = useCallback(
    async (session: Session | null) => {
      if (!isAdminSession(session)) return router.replace('/admin');
      if (checkedUser.current === session!.user.id) return;
      checkedUser.current = session!.user.id;
      setState({ stage: 'loading' });
      try {
        setState({ stage: 'ready', info: await adminApi.session() });
      } catch (e) {
        checkedUser.current = null;
        // The admin session itself is fine (it passed the check above); only the content server refused it.
        // Never sign out here: that would bounce the admin back to the sign-in page in a loop.
        const message =
          e instanceof ApiError && e.status === 401
            ? `The content server didn't accept this sign-in (${e.message}). It must check sign-ins against the same Supabase project as this website.`
            : e instanceof ApiError && e.status === 403
              ? `The content server says this account has no admin access (${e.message}).`
              : e instanceof Error
                ? e.message
                : 'Something went wrong';
        setState({ stage: 'error', message });
      }
    },
    [router],
  );
  const check = useCallback(() => adminSupabase.auth.getSession().then(({ data }) => verify(data.session)), [verify]);

  useEffect(() => {
    adminSupabase.auth.getSession().then(({ data }) => verify(data.session));
    const { data } = adminSupabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (session && !isAdminSession(session))) router.replace('/admin');
    });
    return () => data.subscription.unsubscribe();
  }, [verify, router]);

  return (
    <ToastProvider>
      {state.stage === 'loading' && (
        <main className="flex min-h-screen items-center justify-center">
          <IconLoader2 className="h-6 w-6 animate-spin text-[#85868c]" aria-label="Loading" />
        </main>
      )}
      {state.stage === 'error' && (
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-[400px] rounded-[24px] border border-white/[0.06] bg-[#26262B] p-6">
            <h1 className="text-lg font-semibold">Can&apos;t reach the content service</h1>
            <p className="mt-2 text-sm text-[#a1a1aa]">{state.message}</p>
            <p className="mt-2 break-all text-xs text-[#5c5c63]">Backend: {API_BASE || 'not configured'}</p>
            <div className="mt-5 flex gap-2">
              <Button variant="primary" className="flex-1" onClick={check}>
                Try again
              </Button>
              <Button onClick={() => router.push('/admin/dashboard')}>Dashboard</Button>
            </div>
          </div>
        </main>
      )}
      {state.stage === 'ready' && (
        <AdminContext.Provider value={state.info}>
          <Frame info={state.info} onSignOut={signOut}>
            {children}
          </Frame>
        </AdminContext.Provider>
      )}
    </ToastProvider>
  );
}

function Frame({ info, onSignOut, children }: { info: SessionInfo; onSignOut: () => void; children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);

  const link = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition',
      active ? 'bg-[#2C2C32] font-medium text-white' : 'text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white',
    );

  return (
    <div className="flex min-h-screen bg-[#1C1C20]">
      {navOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setNavOpen(false)} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/[0.06] bg-[#1C1C20] px-4 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 px-2">
          <Image src="/assets/images/main_logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-lg" />
          <span className="text-[15px] font-semibold tracking-[0.06em]">BROKENOMORE</span>
          <button className="ml-auto text-[#85868c] lg:hidden" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <IconX size={20} />
          </button>
        </div>

        <nav className="mt-10 space-y-1.5">
          <Link href="/admin/dashboard" className={link(false)} onClick={closeNav}>
            <IconLayoutDashboard size={19} stroke={1.6} />
            Dashboard
          </Link>
          <p className="px-3.5 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wider text-[#5c5c63]">App content</p>
          {CONTENT_NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={closeNav} className={link(!!pathname?.startsWith(href))}>
              <Icon size={19} stroke={1.6} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <p className="truncate px-3.5 pb-2 text-xs text-[#5c5c63]" title={info.email}>
            {info.email}
          </p>
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[#a1a1aa] transition hover:bg-white/[0.04] hover:text-white"
          >
            <IconLogout size={19} stroke={1.6} />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 px-4 pt-5 sm:px-8 lg:hidden">
          <button className="text-[#a1a1aa]" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <IconMenu2 size={22} />
          </button>
        </div>
        {!info.writable && (
          <div role="status" className="mx-4 mt-5 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3 text-sm text-[#fcd34d] sm:mx-8 lg:mx-10">
            Read-only: {info.read_only_reason}
          </div>
        )}
        <div className="max-w-6xl px-4 pb-10 pt-5 sm:px-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
