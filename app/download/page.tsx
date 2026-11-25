import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ANDROID_INVITE_DOWNLOAD_URL, IOS_INVITE_DOWNLOAD_URL } from '@/lib/site';

// /download: the smart link sent in the app's friend / split invites over WhatsApp
// (https://brokenomore.in/download?ref=<invite code>).
// Phones are redirected on the server, so it works in WhatsApp's in-app browser without
// JavaScript: Android -> Google Play, iPhone/iPad -> App Store. Anything else sees both buttons.
// `ref` is informational only: the app matches invites by phone number at signup.

export const metadata: Metadata = {
  title: 'Download the App',
  description: 'Download BrokeNoMore on Android or iPhone. Sign up with the number your friend invited and you will be friends automatically.',
  alternates: { canonical: '/download' },
  robots: { index: false, follow: true },
};

export default async function DownloadPage() {
  const ua = (await headers()).get('user-agent') ?? '';

  if (/android/i.test(ua)) redirect(ANDROID_INVITE_DOWNLOAD_URL);
  if (/iPhone|iPad|iPod/i.test(ua)) redirect(IOS_INVITE_DOWNLOAD_URL);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0f0f0f] px-4 text-center text-white">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A890E6]">You&apos;ve been invited</p>
      <h1 className="text-3xl font-semibold sm:text-4xl">Get BrokeNoMore</h1>
      <p className="max-w-md text-[#bdbdbd]">
        Download the app on your phone and sign up with the same phone number your friend invited.
        You&apos;ll become friends automatically, and any split they added you to will be waiting.
      </p>
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <a
          href={ANDROID_INVITE_DOWNLOAD_URL}
          className="flex-1 rounded-xl bg-[#6B46C1] px-5 py-3 font-semibold text-white transition hover:bg-[#7c5ad1]"
        >
          Download for Android
        </a>
        <a
          href={IOS_INVITE_DOWNLOAD_URL}
          className="flex-1 rounded-xl border border-[#6B46C1] px-5 py-3 font-semibold text-[#C9B8F0] transition hover:bg-[#6B46C1]/15"
        >
          Download for iPhone
        </a>
      </div>
    </main>
  );
}
