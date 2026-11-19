'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IconEye, IconEyeOff, IconLoader2, IconLock } from '@tabler/icons-react';
import { adminSupabase, isAdminSession } from '@/lib/admin/client';

// /admin: sign in only. Admin accounts are created in Supabase, never from this page.
export default function AdminSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  // Already signed in as admin: go straight to the dashboard.
  useEffect(() => {
    adminSupabase.auth.getSession().then(({ data }) => {
      if (isAdminSession(data.session)) router.replace('/admin/dashboard');
      else setChecking(false);
    });
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { data, error: authError } = await adminSupabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.session) {
      setBusy(false);
      setError(
        authError?.code === 'email_not_confirmed'
          ? 'This account has not been confirmed yet.'
          : 'Incorrect email or password.'
      );
      return;
    }

    if (!isAdminSession(data.session)) {
      await adminSupabase.auth.signOut();
      setBusy(false);
      setError('This account does not have admin access.');
      return;
    }

    router.replace('/admin/dashboard');
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <IconLoader2 className="h-6 w-6 animate-spin text-[#85868c]" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#6E5BFF]/20 blur-[120px]"
      />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/assets/images/main_logo.png" alt="BrokeNoMore" width={56} height={56} className="mb-4 h-14 w-14 rounded-2xl" priority />
          <h1 className="text-2xl font-semibold tracking-tight">Admin console</h1>
          <p className="mt-1.5 text-sm text-[#85868c]">Sign in with your admin account</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[24px] border border-white/[0.06] bg-[#26262B] p-6 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[#A3A3A3]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 h-11 w-full rounded-lg border border-white/10 bg-[#1C1C20] px-3.5 text-sm outline-none transition placeholder:text-[#5c5c63] focus:border-[#6E5BFF] focus:ring-2 focus:ring-[#6E5BFF]/30"
            placeholder="you@company.com"
          />

          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[#A3A3A3]">
            Password
          </label>
          <div className="relative mb-5">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-[#1C1C20] pl-3.5 pr-11 text-sm outline-none transition focus:border-[#6E5BFF] focus:ring-2 focus:ring-[#6E5BFF]/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#85868c] hover:text-white"
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-[#fca5a5]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6E5BFF] text-sm font-semibold text-white transition hover:bg-[#5f4cf0] disabled:opacity-60"
          >
            {busy ? <IconLoader2 size={18} className="animate-spin" /> : <IconLock size={16} />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#5c5c63]">Restricted area. Access is limited to authorised staff.</p>
      </div>
    </main>
  );
}
