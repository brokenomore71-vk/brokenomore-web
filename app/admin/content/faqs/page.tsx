'use client';

// FAQs (faqs.json in the app backend): the website's FAQ section and the app's Help & Support page both read them.
// Each question is switched on separately for the website and the app. Categories are managed above the list:
// add one, or rename one (every question in it moves along).

import { useCallback, useEffect, useState } from 'react';
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import ContentManager, { type FormProps } from '@/components/admin/ContentManager';
import { useAdminSession } from '@/components/admin/AdminShell';
import { Button, ConfirmDialog, Field, IconButton, Section, Select, TextArea, TextInput, Toggle, useToast } from '@/components/admin/ui';
import { adminApi, refreshWebsite, type FaqCategory } from '@/lib/admin/api';

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

const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

function CategoriesPanel({ onRenamed, changes }: { onRenamed: () => void; changes: number }) {
  // onRenamed: the questions list must reload (after a rename or a delete)
  const session = useAdminSession();
  const writable = !!session?.writable;
  const toast = useToast();
  const [categories, setCategories] = useState<FaqCategory[] | null>(null);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ old: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<FaqCategory | null>(null);

  const load = useCallback(() => {
    adminApi.faqCategories().then((r) => setCategories(r.categories)).catch(() => setCategories([]));
  }, []);
  // Reloaded after questions change elsewhere on the page, so the counts stay right
  useEffect(load, [load, changes]);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      setCategories((await adminApi.addFaqCategory(name)).categories);
      setNewName('');
      toast('success', `Added the category "${name}". Add questions to it to show it on the website and app.`);
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const rename = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name || name === editing.old) return setEditing(null);
    setBusy(true);
    try {
      setCategories((await adminApi.renameFaqCategory(editing.old, name)).categories);
      setEditing(null);
      onRenamed();
      toast('success', `Renamed "${editing.old}" to "${name}".`);
    } catch (e) {
      toast('error', errorText(e));
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const r = await adminApi.deleteFaqCategory(toDelete.name);
      setCategories(r.categories);
      onRenamed();
      toast(
        'success',
        r.deleted_questions
          ? `Deleted "${toDelete.name}" and its ${r.deleted_questions} ${r.deleted_questions === 1 ? 'question' : 'questions'}.`
          : `Deleted "${toDelete.name}".`,
      );
      setToDelete(null);
    } catch (e) {
      toast('error', errorText(e));
      setToDelete(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[24px] bg-[#26262B] p-5 sm:p-6 flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold">Categories</p>
        <p className="text-xs text-[#8b8b94] mt-0.5">
          Questions are grouped under these on the website and in the app. A category with no questions isn&apos;t shown.
        </p>
      </div>

      {categories === null ? (
        <p className="text-xs text-[#8b8b94]">Loading…</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.05] rounded-2xl border border-white/[0.06]">
          {categories.map((c) => (
            <li key={c.name} className="flex items-center gap-3 px-3.5 py-2">
              {editing?.old === c.name ? (
                <>
                  <TextInput
                    autoFocus
                    value={editing.name}
                    maxLength={40}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') rename();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    disabled={busy}
                    className="h-9"
                  />
                  <IconButton label="Save name" onClick={rename} disabled={busy || !editing.name.trim()}>
                    <IconCheck size={16} />
                  </IconButton>
                  <IconButton label="Cancel" onClick={() => setEditing(null)} disabled={busy}>
                    <IconX size={16} />
                  </IconButton>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm break-words">{c.name}</span>
                  <span className="text-xs text-[#8b8b94] tabular-nums whitespace-nowrap">
                    {c.count} {c.count === 1 ? 'question' : 'questions'}
                  </span>
                  <IconButton label={`Rename ${c.name}`} onClick={() => setEditing({ old: c.name, name: c.name })} disabled={!writable || busy}>
                    <IconPencil size={16} />
                  </IconButton>
                  <IconButton label={`Delete ${c.name}`} onClick={() => setToDelete(c)} disabled={!writable || busy} className="hover:text-[#fca5a5]">
                    <IconTrash size={16} />
                  </IconButton>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <TextInput
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="New category name"
          maxLength={40}
          disabled={!writable || busy}
          className="sm:w-72"
        />
        <Button onClick={add} disabled={!writable || busy || !newName.trim()}>
          <IconPlus size={16} /> Add category
        </Button>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete category?"
        body={
          toDelete && toDelete.count > 0 ? (
            <>
              <strong className="text-white">{toDelete.name}</strong> and its{' '}
              <strong className="text-white">
                {toDelete.count} {toDelete.count === 1 ? 'question' : 'questions'}
              </strong>{' '}
              will be removed from the website and the app. This can&apos;t be undone.
            </>
          ) : (
            <>
              <strong className="text-white">{toDelete?.name}</strong> has no questions and will be removed.
            </>
          )
        }
        confirmLabel={toDelete && toDelete.count > 0 ? `Delete category and ${toDelete.count} ${toDelete.count === 1 ? 'question' : 'questions'}` : 'Delete category'}
        busy={busy}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function FaqForm({ value, onChange, errors, disabled }: FormProps<Faq>) {
  const set = <K extends keyof Faq>(k: K, v: Faq[K]) => onChange({ ...value, [k]: v });
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    adminApi
      .faqCategories()
      .then((r) => setCategories(r.categories.map((c) => c.name)))
      .catch(() => {});
  }, []);
  // Keep the question's current category selectable even before the list has loaded
  const names = value.category && !categories.includes(value.category) ? [value.category, ...categories] : categories;

  return (
    <div className="flex flex-col gap-6">
      <Section title="Question">
        <Field label="Category" required error={errors.category} hint="To add a new category or rename one, use Categories above the list.">
          <Select
            value={value.category}
            onChange={(e) => set('category', e.target.value)}
            invalid={!!errors.category}
            disabled={disabled}
            options={[{ value: '', label: 'Choose a category' }, ...names.map((c) => ({ value: c, label: c }))]}
          />
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
  // Bumped after a category rename, so the list below shows the new names
  const [reloadSignal, setReloadSignal] = useState(0);
  // Bumped after any question is saved, switched or deleted, so the category counts update
  const [changes, setChanges] = useState(0);
  return (
    <ContentManager<Faq>
      kind="faqs"
      title="FAQs"
      noun="FAQ"
      description="Questions on the website's FAQ section and in the app's Help & Support, grouped by category in the order shown here. Use the Web and App switches to choose where each one appears."
      blank={blank}
      Form={FaqForm}
      headerExtra={
        <CategoriesPanel
          changes={changes}
          onRenamed={() => {
            setReloadSignal((n) => n + 1);
            refreshWebsite();
          }}
        />
      }
      reloadSignal={reloadSignal}
      rowTitle={(f) => f.question}
      rowMeta={(f) => `${f.category} · ${where(f)}`}
      searchText={(f) => `${f.question} ${f.answer} ${f.category}`}
      toggles={[
        { field: 'show_on_web', label: 'Web', where: 'the website' },
        { field: 'show_on_app', label: 'App', where: 'the app' },
      ]}
      savedMessage="Saved. The website shows it on the next page load; the app the next time Help & Support is opened."
      onChanged={() => {
        setChanges((n) => n + 1);
        refreshWebsite();
      }}
      wrapRowText
    />
  );
}
