'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from 'motion/react';

// Get in Touch. The contact form is a support ticket being written: it gets a ticket number, a
// status that turns from Draft to Ready, and a thin line along its top that fills as each part is
// done. The fields' hints type themselves in when the section arrives, focus draws a purple line
// under a field, topic chips fill in what it's regarding, and the agreement's tick draws itself.
// There is no backend here, so sending opens the visitor's own mail app with everything filled in,
// and a stamp lands on the ticket to say so. Flat and dark like the partner section beside it.

const SUPPORT_EMAIL = 'support@brokenomore.in';
const PURPLE = '#6B46C1';
const PURPLE_TEXT = '#A890E6';
const EASE = [0.16, 1, 0.3, 1] as const;

const TOPICS = ['Account', 'Payments', 'SafeGold', 'File ITR', 'Split & Share', 'Something else'];

type FieldId = 'name' | 'email' | 'subject' | 'message';
const FIELDS: { id: FieldId; label: string; hint: string; type?: string; autoComplete?: string }[] = [
  { id: 'name', label: 'From', hint: 'Your full name', autoComplete: 'name' },
  { id: 'email', label: 'Reply to', hint: 'you@example.com', type: 'email', autoComplete: 'email' },
  { id: 'subject', label: 'Regarding', hint: 'What is this about?' },
  { id: 'message', label: 'Message', hint: 'Tell us how we can help…' },
];
const MESSAGE_LIMIT = 1000;

const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE, delay } }),
};

// A random starting number for this visit's tickets. Read on the client only, so the server's
// render (which shows the placeholder) never disagrees with the first paint.
const TICKET_BASE = Math.floor(Math.random() * 9000);
const noSubscribe = () => () => {};
const ticketNumber = (base: number, n: number) => `BNM-${1000 + ((base + n * 1373) % 9000)}`;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export default function ContactSection() {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(cardRef, { once: true, amount: 0.35 });

  const [values, setValues] = useState<Record<FieldId, string>>({ name: '', email: '', subject: '', message: '' });
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldId, boolean>>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  const ticketBase = useSyncExternalStore(noSubscribe, () => TICKET_BASE, () => -1);
  const ticket = ticketBase < 0 ? 'BNM-····' : ticketNumber(ticketBase, ticketCount);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // The hints type themselves in, one field after another, once the ticket is on screen
  const hintsTotal = useMemo(() => FIELDS.reduce((n, f) => n + f.hint.length, 0), []);
  const [typedSoFar, setTyped] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => setTyped((t) => (t >= hintsTotal ? t : t + 1)), 26);
    return () => clearInterval(id);
  }, [inView, reduce, hintsTotal]);
  const typed = reduce ? hintsTotal : typedSoFar;
  const hintFor = (index: number) => {
    const before = FIELDS.slice(0, index).reduce((n, f) => n + f.hint.length, 0);
    return FIELDS[index].hint.slice(0, Math.max(0, typed - before));
  };
  const typingIndex = FIELDS.findIndex((_, i) => hintFor(i).length < FIELDS[i].hint.length);

  const errors: Partial<Record<FieldId, string>> = {
    name: values.name.trim() ? undefined : 'Tell us your name',
    email: isEmail(values.email) ? undefined : 'Enter an email we can reply to',
    subject: values.subject.trim() ? undefined : 'Pick a topic or write one',
    message: values.message.trim().length >= 10 ? undefined : 'A few more words, please',
  };
  const done = (Object.keys(errors) as FieldId[]).filter((k) => !errors[k]).length + (agreed ? 1 : 0);
  const ready = done === 5;
  const show = (id: FieldId) => (tried || touched[id]) && errors[id];

  const set = (id: FieldId, v: string) => setValues((s) => ({ ...s, [id]: id === 'message' ? v.slice(0, MESSAGE_LIMIT) : v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!ready) return;
    const subject = `[${ticket}] ${values.subject.trim()}`;
    const body = `${values.message.trim()}\n\n— ${values.name.trim()}\n${values.email.trim()}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const reset = () => {
    setValues({ name: '', email: '', subject: '', message: '' });
    setAgreed(false);
    setTouched({});
    setTried(false);
    setSent(false);
    setTicketCount((n) => n + 1);
  };

  const addRipple = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((list) => [...list, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((list) => list.filter((p) => p.id !== id)), 700);
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="relative w-full overflow-hidden bg-black px-4 sm:px-6 py-24 sm:py-32">
      <motion.div
        initial={reduce ? false : 'hidden'}
        whileInView="shown"
        viewport={{ once: true, amount: 0.15 }}
        className="relative mx-auto grid max-w-6xl gap-y-10 lg:gap-y-0 lg:gap-x-20 lg:grid-cols-[1fr_1.15fr] lg:grid-rows-[auto_auto] lg:content-center"
      >
        {/* ---- Headline (first on phones, top left on desktop) ---- */}
        <div className="order-1 lg:order-none text-center lg:text-left lg:self-end">
          <motion.h2
            id="contact-heading"
            variants={rise}
            custom={0}
            className="text-[2.2rem] sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.05] tracking-tight text-white"
          >
            Got a question? <span style={{ color: PURPLE_TEXT }}>We&apos;re all ears.</span>
          </motion.h2>
          <motion.p
            variants={rise}
            custom={0.1}
            className="mx-auto lg:mx-0 mt-4 sm:mt-5 max-w-md text-[15px] sm:text-lg leading-relaxed tracking-tight text-neutral-400"
          >
            Need help with your account, a payment or anything in the app? Write to us and a real person will get
            back to you.
          </motion.p>
        </div>

        {/* ---- How to reach us (after the ticket on phones, bottom left on desktop) ---- */}
        <motion.dl
          variants={rise}
          custom={0.2}
          className="order-3 lg:order-none lg:col-start-1 lg:row-start-2 lg:self-start lg:mt-10 grid grid-cols-1 sm:grid-cols-2 border-y border-[#1F1F1F]"
        >
          <div className="py-5 sm:pr-4 border-b sm:border-b-0 sm:border-r border-[#1F1F1F]">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">Email us</dt>
            <dd className="mt-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-sm sm:text-[15px] text-white underline decoration-[#6B46C1] decoration-2 underline-offset-4 hover:text-[#C9B8F0]"
              >
                {SUPPORT_EMAIL}
              </a>
            </dd>
          </div>
          <div className="py-5 sm:pl-6">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">Response time</dt>
            <dd className="mt-2 text-sm sm:text-[15px] text-white">
              Within <span className="font-semibold">24–48 hours</span>
            </dd>
          </div>
        </motion.dl>

        {/* ---- The ticket (right on desktop, spanning both rows) ---- */}
        <motion.div
          ref={cardRef}
          variants={rise}
          custom={0.15}
          className="order-2 lg:order-none relative w-full lg:col-start-2 lg:row-start-1 lg:row-span-2"
        >
          <form
            onSubmit={submit}
            noValidate
            className="relative overflow-hidden rounded-2xl border border-[#262626] bg-[#121212]"
            aria-describedby="ticket-status"
          >
            {/* Fills as each part of the ticket is done */}
            <div className="h-[2px] w-full bg-[#1F1F1F]" aria-hidden="true">
              <motion.div
                className="h-full origin-left"
                style={{ backgroundColor: PURPLE }}
                animate={{ scaleX: done / 5 }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>

            <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-6 sm:pb-8">
              {/* Ticket header */}
              <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                <span>
                  Support ticket <span className="text-neutral-300">#{ticket}</span>
                </span>
                <span
                  id="ticket-status"
                  aria-live="polite"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 normal-case tracking-normal font-sans text-xs transition-colors ${
                    ready ? 'border-[#6B46C1] text-white' : 'border-[#2A2A2A] text-neutral-400'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ready ? PURPLE_TEXT : '#525252' }} />
                  {sent ? 'Sent to mail app' : ready ? 'Ready to send' : `Draft · ${done}/5`}
                </span>
              </div>

              <div className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-2">
                {FIELDS.map((f, i) => {
                  const error = show(f.id);
                  const common = {
                    id: `contact-${f.id}`,
                    name: f.id,
                    value: values[f.id],
                    placeholder: hintFor(i),
                    'aria-invalid': !!error || undefined,
                    'aria-describedby': error ? `contact-${f.id}-error` : undefined,
                    onBlur: () => setTouched((t) => ({ ...t, [f.id]: true })),
                    className:
                      'peer w-full bg-transparent text-[15px] text-white placeholder:text-neutral-600 outline-none caret-[#A890E6]',
                  };
                  const wide = f.id === 'subject' || f.id === 'message';
                  return (
                    <div key={f.id} className={wide ? 'sm:col-span-2' : undefined}>
                      <div className="flex items-baseline justify-between">
                        <label htmlFor={common.id} className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                          {f.label}
                        </label>
                        {f.id === 'message' && (
                          <span className="font-mono text-[11px] text-neutral-600 tabular-nums">
                            {values.message.length}/{MESSAGE_LIMIT}
                          </span>
                        )}
                      </div>

                      <div className="relative mt-2">
                        {f.id === 'message' ? (
                          <textarea
                            {...common}
                            rows={5}
                            onChange={(e) => set(f.id, e.target.value)}
                            className={`${common.className} resize-none leading-7 pb-1`}
                            style={{
                              // Ruled lines, like a notepad
                              backgroundImage: 'linear-gradient(to bottom, transparent 27px, #1F1F1F 27px, #1F1F1F 28px)',
                              backgroundSize: '100% 28px',
                            }}
                          />
                        ) : (
                          <input
                            {...common}
                            type={f.type ?? 'text'}
                            autoComplete={f.autoComplete}
                            inputMode={f.type === 'email' ? 'email' : undefined}
                            onChange={(e) => set(f.id, e.target.value)}
                            className={`${common.className} h-10`}
                          />
                        )}
                        {/* The underline: grey at rest, drawn in purple from the left on focus */}
                        <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-px ${error ? 'bg-[#7f2d2d]' : 'bg-[#2A2A2A]'}`} />
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:scale-x-100"
                          style={{ backgroundColor: PURPLE }}
                        />
                        {/* A blinking cursor while this field's hint is typing in */}
                        {typingIndex === i && !values[f.id] && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute top-2.5 h-5 w-px animate-pulse bg-[#A890E6]"
                            style={{ left: `calc(${hintFor(i).length}ch * 0.92)` }}
                          />
                        )}
                      </div>

                      {f.id === 'subject' && (
                        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Common topics">
                          {TOPICS.map((t) => {
                            const on = values.subject === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => set('subject', on ? '' : t)}
                                aria-pressed={on}
                                className={`rounded-full border px-3 py-1 text-xs tracking-tight transition-colors ${
                                  on
                                    ? 'border-white bg-white text-black'
                                    : 'border-[#2A2A2A] text-neutral-400 hover:border-[#3a3a3a] hover:text-white'
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <AnimatePresence>
                        {error && (
                          <motion.p
                            id={`contact-${f.id}-error`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-1.5 text-xs text-[#e08585]"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Agreement, with a tick that draws itself */}
              <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm text-neutral-400">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="peer sr-only" />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#A890E6] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#121212] ${
                    agreed ? 'border-white bg-white' : tried ? 'border-[#7f2d2d]' : 'border-[#3a3a3a]'
                  }`}
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                    <motion.path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="#000"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: agreed ? 1 : 0 }}
                      transition={{ duration: reduce ? 0 : 0.35, ease: 'easeOut' }}
                    />
                  </svg>
                </span>
                <span>
                  I agree to the{' '}
                  <Link href="/privacy" className="text-white underline decoration-[#6B46C1] underline-offset-4 hover:text-[#C9B8F0]">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" className="text-white underline decoration-[#6B46C1] underline-offset-4 hover:text-[#C9B8F0]">
                    Terms of Service
                  </Link>
                </span>
              </label>

              {/* Send */}
              <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between">
                <p className="text-xs text-neutral-500">Opens your mail app with this ticket filled in.</p>
                <motion.button
                  type="submit"
                  onPointerDown={addRipple}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3 text-sm font-medium text-black shadow-[0_8px_24px_-12px_rgba(255,255,255,0.35)] transition-[box-shadow,background-color] hover:bg-neutral-100 hover:shadow-[0_14px_30px_-12px_rgba(255,255,255,0.45)]"
                >
                  {ripples.map((r) => (
                    <motion.span
                      key={r.id}
                      aria-hidden="true"
                      className="pointer-events-none absolute h-8 w-8 rounded-full bg-black/15"
                      style={{ left: r.x - 16, top: r.y - 16 }}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 9, opacity: 0 }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                    />
                  ))}
                  <span className="relative">Send message</span>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="relative h-4 w-4 fill-current transition-transform group-hover:translate-x-0.5">
                    <path d="M2.9 3.1a.8.8 0 0 1 .87-.12l13.5 6.3a.8.8 0 0 1 0 1.45l-13.5 6.3a.8.8 0 0 1-1.1-.94L4.3 10 2.67 3.91a.8.8 0 0 1 .23-.81ZM5.7 10.8l-1.04 3.9L14.8 10 4.66 5.3l1.04 3.9H10a.8.8 0 0 1 0 1.6H5.7Z" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Once sent: the ticket is stamped */}
            <AnimatePresence>
              {sent && (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#121212]/85 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-white text-center uppercase text-white"
                    initial={reduce ? false : { opacity: 0, scale: 1.8, rotate: -24 }}
                    animate={{ opacity: 1, scale: 1, rotate: -10 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                  >
                    <span className="absolute inset-1.5 rounded-full border border-dashed border-white/60" />
                    <span className="text-[9px] tracking-[0.2em] opacity-80">#{ticket}</span>
                    <span className="text-base font-bold leading-tight tracking-tight">Opened</span>
                    <span className="text-[9px] tracking-[0.2em] opacity-80">In mail app</span>
                  </motion.div>
                  <p className="max-w-xs px-6 text-center text-sm text-neutral-300">
                    Hit send in your mail app and we&apos;ll reply within 24–48 hours.
                  </p>
                  <button type="button" onClick={reset} className="text-sm text-[#A890E6] underline underline-offset-4 hover:text-white">
                    Write another message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </motion.div>
    </section>
  );
}
