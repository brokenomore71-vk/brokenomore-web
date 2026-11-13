"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { IconChevronDown } from "@tabler/icons-react";
import { FEATURE_PAGES } from "@/lib/featurePages";

// The navbar's Features menu: a small dropdown under the button listing each feature by name,
// each linking to its own page. Opens on hover or click; Escape, a click outside or going to
// another page closes it. On phones it's a list that folds open in the menu.

export function FeaturesMenu() {
  const pathname = usePathname();
  // Remembers the page it was opened on, so going to another page closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn !== null && openOn === pathname;
  const active = pathname?.startsWith("/features");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenOn(pathname);
  };
  const hide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenOn(null), 160);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <div ref={rootRef} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpenOn(open ? null : pathname)}
        className={`relative z-20 flex items-center gap-1 px-3 py-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-150 ${open || active ? "text-white" : "text-neutral-300 hover:text-white"}`}
      >
        Features
        <IconChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} stroke={2} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, x: "-50%", y: -6, scale: 0.97 }}
            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
            exit={{ opacity: 0, x: "-50%", y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-full z-50 mt-3 w-52 origin-top rounded-2xl border border-white/10 bg-[#0b0b0d]/95 p-1.5 shadow-[0_24px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            {FEATURE_PAGES.map((f) => {
              const here = pathname === f.href;
              return (
                <li key={f.slug}>
                  <Link
                    href={f.href}
                    onClick={() => setOpenOn(null)}
                    aria-current={here ? "page" : undefined}
                    className={`block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${here ? "bg-white/[0.08] text-white" : "text-neutral-300 hover:bg-white/[0.05] hover:text-white"}`}
                  >
                    {f.name}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// In the phone menu: Features folds open to the list of names
export function FeaturesMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1.5 text-base font-medium text-neutral-300 transition-colors hover:text-white"
      >
        Features
        <IconChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} stroke={2} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden pl-3"
          >
            {FEATURE_PAGES.map((f) => (
              <li key={f.slug}>
                <Link href={f.href} onClick={onNavigate} className="block py-2 text-[15px] text-neutral-400 transition-colors hover:text-white">
                  {f.name}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
