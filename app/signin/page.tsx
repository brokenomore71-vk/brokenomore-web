'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconEye, IconEyeOff, IconArrowLeft, IconLoader2 } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'admin@brokenomore.in';

/** Only allow same-site relative redirects. */
function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destinationFor = (userEmail?: string | null) =>
    userEmail?.toLowerCase() === ADMIN_EMAIL ? next ?? '/admin' : next && !next.startsWith('/admin') ? next : '/';

  // Already signed in? Skip the form.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) router.replace(destinationFor(data.session.user.email));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace(destinationFor(data.user?.email));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(/invalid login/i.test(msg) ? 'Incorrect email or password.' : msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-neutral-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-[#6C4BFF]/70 focus:bg-white/[0.05]"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-neutral-300">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-3.5 pr-11 text-sm text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-[#6C4BFF]/70 focus:bg-white/[0.05]"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-neutral-500 hover:text-white"
          >
            {show ? <IconEyeOff size={17} /> : <IconEye size={17} />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-[#FF6B6B]/10 px-3 py-2 text-[13px] text-[#FF8A8A]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !email || !password}
        className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6C4BFF] text-sm font-semibold text-white transition-colors hover:bg-[#7D60FF] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting && <IconLoader2 size={16} className="animate-spin" />}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b0b0e] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(108,75,255,0.28), transparent)' }}
      />

      <Link
        href="/"
        className="absolute left-4 top-5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-neutral-400 transition-colors hover:text-white sm:left-8 sm:top-8"
      >
        <IconArrowLeft size={15} /> Back to site
      </Link>

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/assets/images/main_logo.png" alt="BrokeNoMore" width={52} height={52} priority />
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-neutral-400">Sign in to your BrokeNoMore account</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#131317]/80 p-6 shadow-2xl backdrop-blur sm:p-7">
          <Suspense fallback={<div className="h-[260px]" />}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
