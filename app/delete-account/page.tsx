import type { Metadata } from 'next';
import LegalLayout, { A, B, Callout, List, Section } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: "Delete Account",
  description: "How to request deletion of your BNM (Broke No More) account and associated personal data.",
  alternates: { canonical: "/delete-account" },
  openGraph: { url: "/delete-account", title: "Delete Account | BrokeNoMore", description: "How to request deletion of your BNM (Broke No More) account and associated personal data." },
};

const SUPPORT_EMAIL = 'support@brokenomore.in';

const TOC = [
  { id: 'how-to', title: 'How to Request Deletion' },
  { id: 'what-is-deleted', title: 'What Will Be Deleted' },
  { id: 'retention', title: 'Data Retention' },
  { id: 'contact', title: 'Contact' },
];

export default function DeleteAccountPage() {
  return (
    <LegalLayout
      eyebrow="Your data"
      title="Account Deletion – BNM (Broke No More)"
      current="/delete-account"
      toc={TOC}
      intro={
        <>
          <p>
            <B>BNM (Broke No More)</B> is a personal finance management application published by <B>Kushagra &amp; Vruddhi</B>.
          </p>
          <p>Users can request deletion of their BNM account and associated personal data at any time.</p>
        </>
      }
    >
      <Section id="how-to" title="How to Request Account Deletion">
        <p>To delete your BNM account, you can use one of the following methods:</p>
        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A890E6]">Method 1</p>
            <h3 className="mt-2 text-lg font-medium text-white">From the App</h3>
            <ol className="mt-4 space-y-3">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6B46C1]/25 text-xs font-semibold text-[#C9B8F0]">1</span>
                <span>Log in to the BNM app</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6B46C1]/25 text-xs font-semibold text-[#C9B8F0]">2</span>
                <span>
                  Go to <B>Profile → Settings → Delete Account</B>
                </span>
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A890E6]">Method 2</p>
            <h3 className="mt-2 text-lg font-medium text-white">Via Email</h3>
            <p className="mt-4">
              Email us at{' '}
              <A href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Account Deletion Request – BNM')}`}>{SUPPORT_EMAIL}</A> from your
              registered email address with the subject <B>&quot;Account Deletion Request – BNM&quot;</B>.
            </p>
          </div>
        </div>
      </Section>

      <Section id="what-is-deleted" title="What Will Be Deleted">
        <p>Once verified, we will permanently delete:</p>
        <List items={['User account information', 'Stored personal data', 'App-related records']} />
      </Section>

      <Section id="retention" title="Data Retention">
        <p>Some data may be retained for legal or compliance purposes, if required by law.</p>
        <Callout>
          <p className="font-semibold">
            We do <strong className="text-white">not</strong> retain or sell any user data for marketing or advertising purposes.
          </p>
        </Callout>
      </Section>

      <Section id="contact" title="Contact">
        <Callout>
          <p>
            <B>Email:</B> <A href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</A>
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            For account deletion requests or any questions regarding your data, please contact us at the email above.
          </p>
        </Callout>
      </Section>
    </LegalLayout>
  );
}
