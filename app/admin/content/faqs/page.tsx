'use client';

// FAQs (faqs.json in the app backend): the website's FAQ section and the app's Help & Support page both read them.
// Each question is switched on separately for the website and the app.

import { useEffect, useState } from 'react';
import ContentManager, { type FormProps } from '@/components/admin/ContentManager';
import { Field, Section, TextArea, TextInput, Toggle } from '@/components/admin/ui';
import { adminApi, refreshWebsite } from '@/lib/admin/api';

type Faq = {
  id?: string;
  category: string;
  question: string;
  answer: string;
  show_on_web: boolean;
  show_on_app: boolean;
  [key: string]: unknown;
};

const blank = (): Faq => ({ category: '', question: '', answer: '', show_on_web: true, show_on_app: true });

function where(f: Faq) {
  if (f.show_on_web && f.show_on_app) return 'Website and app';
  if (f.show_on_web) return 'Website only';
  if (f.show_on_app) return 'App only';
  return 'Hidden everywhere';
}

function FaqForm({ value, onChange, errors, isNew, disabled }: FormProps<Faq>) {
  const set = <K extends keyof Faq>(k: K, v: Faq[K]) => onChange({ ...value, [k]: v });
  // Existing categories to pick from; typing a new name starts a new category
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    adminApi
      .list<Faq>('faqs')
      .then((r) => setCategories(Array.from(new Set(r.items.map((i) => i.data.category).filter(Boolean)))))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Section title="Question">
        <Field label="Category" required error={errors.category} hint="Pick one, or type a new name to start a new category.">
          <TextInput
            value={value.category}
            onChange={(e) => set('category', e.target.value)}
            list="faq-categories"
            placeholder="Account & Support"
            invalid={!!errors.category}
            disabled={disabled}
            maxLength={40}
          />
          <datalist id="faq-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Question" required error={errors.question}>
          <TextInput
            value={value.question}
            onChange={(e) => set('question', e.target.value)}
            placeholder="How do I reset my password?"
            invalid={!!errors.question}
            disabled={disabled}
            maxLength={200}
          />
        </Field>
        <Field label="Answer" required error={errors.answer}>
          <TextArea
            rows={6}
            value={value.answer}
            onChange={(e) => set('answer', e.target.value)}
            invalid={!!errors.answer}
            disabled={disabled}
            maxLength={3000}
          />
        </Field>
        {isNew && (
          <Field label="ID" error={errors.id} hint="Optional. Generated from the question if empty; can't be changed later.">
            <TextInput value={value.id || ''} onChange={(e) => set('id', e.target.value)} placeholder="reset-password" disabled={disabled} />
          </Field>
        )}
      </Section>

      <Section title="Where it shows" description="Switch the question on for the website, the app, or both. Off on both keeps it saved but hidden.">
        {(
          [
            ['show_on_web', 'Website', 'The FAQ section on brokenomore.in'],
            ['show_on_app', 'App', 'Help & Support in the app'],
          ] as const
        ).map(([field, label, hint]) => (
          <div key={field} className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-[#8b8b94]">{hint}</p>
            </div>
            <Toggle checked={value[field]} onChange={(v) => set(field, v)} label={`Show on ${label.toLowerCase()}`} disabled={disabled} />
          </div>
        ))}
      </Section>
    </div>
  );
}

export default function FaqsPage() {
  return (
    <ContentManager<Faq>
      kind="faqs"
      title="FAQs"
      noun="FAQ"
      description="Questions on the website's FAQ section and in the app's Help & Support, grouped by category in the order shown here. Use the Web and App switches to choose where each one appears."
      blank={blank}
      Form={FaqForm}
      rowTitle={(f) => f.question}
      rowMeta={(f) => `${f.category} · ${where(f)}`}
      searchText={(f) => `${f.question} ${f.answer} ${f.category}`}
      toggles={[
        { field: 'show_on_web', label: 'Web', where: 'the website' },
        { field: 'show_on_app', label: 'App', where: 'the app' },
      ]}
      savedMessage="Saved. The website shows it on the next page load; the app the next time Help & Support is opened."
      onChanged={refreshWebsite}
    />
  );
}
