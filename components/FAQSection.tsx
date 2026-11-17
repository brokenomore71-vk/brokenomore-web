'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

import { FAQ_CATEGORIES, type FAQCategory } from '@/lib/faqData';
export { FAQ_CATEGORIES };
export type { FAQCategory, FAQItem } from '@/lib/faqData';

const PURPLE_TEXT = '#A890E6';
const EASE = [0.16, 1, 0.3, 1] as const;

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE, delay },
  }),
};

const wordContainer: Variants = {
  hidden: {},
  shown: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const wordRise: Variants = {
  hidden: { y: '120%', opacity: 0, rotate: 3 },
  shown: {
    y: '0%',
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

const TITLE_WORDS = [
  { text: "We've", isAccent: false },
  { text: 'got', isAccent: false },
  { text: 'answers.', isAccent: true },
];

export default function FAQSection({
  categories = FAQ_CATEGORIES,
  className,
}: {
  categories?: FAQCategory[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['acc-1']));

  const currentCategory = categories.find((cat) => cat.id === selectedCategory) || categories[0];
  const allItems = currentCategory?.items || [];

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className={cn('relative w-full overflow-hidden bg-black px-4 sm:px-6 py-24 sm:py-32 select-text', className)}
    >
      <motion.div
        initial={reduce ? undefined : 'hidden'}
        whileInView="shown"
        viewport={{ once: true, margin: '-60px' }}
        className="relative mx-auto max-w-6xl"
      >
        {/* ---- Header Section ---- */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.p
            variants={rise}
            custom={0}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-3"
          >
            Support &bull; Knowledge Base
          </motion.p>

          {/* Animated Headline with masked word reveals */}
          <motion.h2
            id="faq-heading"
            variants={wordContainer}
            className="text-[2.2rem] sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.08] tracking-tight text-white flex flex-wrap items-center justify-center"
          >
            {TITLE_WORDS.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 -mb-1 align-bottom mr-[0.28em] last:mr-0">
                <motion.span
                  variants={wordRise}
                  className="inline-block"
                  style={w.isAccent ? { color: PURPLE_TEXT } : undefined}
                >
                  {w.text}
                </motion.span>
              </span>
            ))}
          </motion.h2>

          <motion.p
            variants={rise}
            custom={0.32}
            className="mx-auto mt-4 sm:mt-5 max-w-xl text-[15px] sm:text-lg leading-relaxed tracking-tight text-neutral-400"
          >
            Find answers to common questions about BrokeNoMore and get the help you need.
          </motion.p>
        </div>

        {/* ---- Two Column Layout: Support Tabs on Left, Questions on Right ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-14 items-start">
          {/* Left Column: Navigation Pills */}
          <motion.div variants={rise} custom={0.22} className="w-full">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1F1F1F]">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                Support
              </span>
              <span className="font-mono text-[11px] text-neutral-600">
                {categories.length} topics
              </span>
            </div>

            <nav
              aria-label="FAQ Topics"
              className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none"
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setOpenItems(new Set());
                    }}
                    className={cn(
                      'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 shrink-0 whitespace-nowrap lg:whitespace-normal cursor-pointer text-left',
                      isSelected
                        ? 'bg-[#1b1924] text-white border border-[#6B46C1]/50 shadow-[0_0_24px_rgba(107,70,193,0.18)] font-medium'
                        : 'text-neutral-400 hover:text-white hover:bg-[#121214] border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-colors',
                          isSelected ? 'bg-[#A890E6]' : 'bg-neutral-600 group-hover:bg-neutral-400'
                        )}
                      />
                      <span>{category.name}</span>
                    </div>
                    <span
                      className={cn(
                        'hidden lg:inline-block font-mono text-[10px] tabular-nums transition-colors ml-2',
                        isSelected ? 'text-[#A890E6]' : 'text-neutral-600'
                      )}
                    >
                      {category.items.length}
                    </span>
                  </button>
                );
              })}
            </nav>
          </motion.div>

          {/* Right Column: Accordion Cards */}
          <motion.div variants={rise} custom={0.28} className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={reduce ? undefined : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="space-y-3.5"
              >
                {allItems.map((item, idx) => {
                  const isOpen = openItems.has(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      initial={reduce ? undefined : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: EASE, delay: idx * 0.05 }}
                      className={cn(
                        'group rounded-2xl border transition-all duration-300 overflow-hidden',
                        isOpen
                          ? 'border-[#6B46C1]/50 bg-[#121118] shadow-[0_4px_30px_rgba(107,70,193,0.12)]'
                          : 'border-[#242426] bg-[#101012] hover:border-[#38383c] hover:bg-[#141416]'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="w-full px-5 sm:px-7 py-4.5 sm:py-5 flex items-center justify-between text-left cursor-pointer transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span className="text-[15px] sm:text-[17px] font-medium text-white pr-4 leading-snug tracking-tight">
                          {item.question}
                        </span>

                        <span
                          className={cn(
                            'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shrink-0 transition-all duration-300',
                            isOpen
                              ? 'border-[#6B46C1] bg-[#6B46C1]/20 text-[#A890E6] rotate-180'
                              : 'border-white/10 bg-white/[0.04] text-neutral-400 group-hover:text-white group-hover:border-white/20'
                          )}
                        >
                          <svg
                            className="w-4 h-4 transition-transform duration-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: EASE }}
                            className="overflow-hidden border-t border-[#1F1F24]"
                          >
                            <div className="px-5 sm:px-7 pt-4 pb-6 sm:pb-7 text-neutral-300 text-[14px] sm:text-[15px] leading-relaxed tracking-tight">
                              <p>{item.answer}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
