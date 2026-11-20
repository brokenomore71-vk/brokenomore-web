'use client';

// List + editor used by all three content sections. Each section supplies how a record looks in the list and
// its form; this handles loading, search, on/off, reordering, deleting and saving.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowDown,
  IconArrowUp,
  IconGripVertical,
  IconLoader2,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { adminApi, ApiError, type Item, type Kind } from '@/lib/admin/api';
import { cn } from '@/lib/utils';
import { useAdminSession } from './AdminShell';
import { Button, ConfirmDialog, IconButton, MediaPreview, TextInput, Toggle, useToast } from './ui';

export type FormProps<T> = {
  value: T;
  onChange: (next: T) => void;
  errors: Record<string, string>;
  isNew: boolean;
  disabled: boolean;
};

type Props<T> = {
  kind: Kind;
  title: string;
  description: React.ReactNode;
  noun: string;
  blank: () => T;
  rowTitle: (d: T) => string;
  rowMeta: (d: T) => React.ReactNode;
  rowMedia: (d: T) => string;
  mediaClass?: string;
  searchText: (d: T) => string;
  Form: React.ComponentType<FormProps<T>>;
  /** Before saving: turn the form's working copy into the record sent to the server. */
  toRecord?: (d: T) => T;
  headerExtra?: React.ReactNode;
};

type Editor<T> = { item: Item<T> | null; draft: T; initial: string; errors: Record<string, string>; conflict: boolean };

export default function ContentManager<T extends Record<string, unknown>>(props: Props<T>) {
  const { kind, title, description, noun, blank, rowTitle, rowMeta, rowMedia, searchText, Form, toRecord, headerExtra } = props;
  const router = useRouter();
  const session = useAdminSession();
  const writable = !!session?.writable;
  const toast = useToast();

  const [items, setItems] = useState<Item<T>[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor<T> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [toDelete, setToDelete] = useState<Item<T> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const editorBody = useRef<HTMLDivElement>(null);
  // The error message sits at the top of the editor: bring it into view whatever was scrolled
  const showErrors = () => requestAnimationFrame(() => editorBody.current?.scrollTo({ top: 0, behavior: 'smooth' }));
  const [dragOver, setDragOver] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setItems((await adminApi.list<T>(kind)).items);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load');
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!editor && JSON.stringify(editor.draft) !== editor.initial;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const visible = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => searchText(i.data).toLowerCase().includes(q) || i.id.toLowerCase().includes(q)) : items;
  }, [items, query, searchText]);
  const canReorder = writable && !query.trim();

  const replaceItem = (next: Item<T>) => setItems((list) => (list ? list.map((i) => (i.id === next.id ? next : i)) : list));

  const openEditor = (item: Item<T> | null) => {
    const draft = item ? (structuredClone(item.data) as T) : blank();
    setEditor({ item, draft, initial: JSON.stringify(draft), errors: {}, conflict: false });
  };
  const closeEditor = (force = false) => {
    if (!force && dirty) return setConfirmDiscard(true);
    setEditor(null);
    setConfirmDiscard(false);
  };

  const save = async () => {
    if (!editor) return;
    setSaving(true);
    const record = toRecord ? toRecord(editor.draft) : editor.draft;
    try {
      if (editor.item) {
        const saved = await adminApi.update<T>(kind, editor.item.id, record, editor.item.rev);
        replaceItem(saved);
      } else {
        const saved = await adminApi.create<T>(kind, record);
        setItems((list) => [...(list || []), saved]);
      }
      toast('success', `${editor.item ? 'Saved' : 'Added'}. The app picks it up the next time it loads this content.`);
      setEditor(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setEditor({ ...editor, errors: e.fieldErrors });
        showErrors();
        toast('error', 'Some fields need fixing. Nothing was saved.');
      } else if (e instanceof ApiError && e.status === 409) {
        setEditor({ ...editor, conflict: true });
        showErrors();
      } else {
        toast('error', e instanceof Error ? e.message : 'Saving failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Item<T>) => {
    setBusyId(item.id);
    try {
      const saved = await adminApi.setActive<T>(kind, item.id, !item.is_active, item.rev);
      replaceItem(saved);
      toast('success', `${rowTitle(item.data)} is now ${saved.is_active ? 'live in the app' : 'hidden from the app'}.`);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Could not change status');
      if (e instanceof ApiError && e.status === 409) load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminApi.remove(kind, toDelete.id, toDelete.rev);
      setItems((list) => (list ? list.filter((i) => i.id !== toDelete.id) : list));
      toast('success', `Deleted ${rowTitle(toDelete.data)}.`);
      setToDelete(null);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Could not delete');
      if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
        setToDelete(null);
        load();
      }
    } finally {
      setDeleting(false);
    }
  };

  const move = async (from: number, to: number) => {
    if (!items || from === to || to < 0 || to >= items.length) return;
    const previous = items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    try {
      const res = await adminApi.reorder<T>(kind, next.map((i) => i.id));
      setItems(res.items);
    } catch (e) {
      setItems(previous);
      toast('error', e instanceof Error ? e.message : 'Could not reorder');
      if (e instanceof ApiError && e.status === 409) load();
    }
  };

  const activeCount = items?.filter((i) => i.is_active).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push('/admin/dashboard'))}
        className="-mb-2 inline-flex items-center gap-1.5 self-start rounded-lg py-1 pr-2 text-sm text-[#a1a1aa] transition hover:text-white"
      >
        <IconArrowLeft size={17} />
        Back
      </button>
      <header className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
          <p className="text-sm text-[#a1a1aa] mt-1 max-w-2xl">{description}</p>
        </div>
        <Button variant="primary" onClick={() => openEditor(null)} disabled={!writable || !items}>
          <IconPlus size={16} /> Add {noun}
        </Button>
      </header>

      {headerExtra}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative sm:w-80">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b8b94]" />
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="pl-10" />
        </div>
        {items && (
          <p className="text-xs text-[#8b8b94] tabular-nums">
            {items.length} total · {activeCount} live · {items.length - activeCount} hidden
            {!canReorder && writable && query && ' · clear search to reorder'}
          </p>
        )}
      </div>

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-5 text-sm text-[#fca5a5] flex flex-col items-start gap-3">
          <span className="flex items-center gap-2">
            <IconAlertTriangle size={18} /> {loadError}
          </span>
          <Button onClick={load}>Try again</Button>
        </div>
      ) : !items ? (
        <div className="flex justify-center py-16">
          <IconLoader2 className="animate-spin text-[#85868c]" size={24} aria-label="Loading" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[24px] bg-[#26262B] py-14 text-center text-sm text-[#8b8b94]">
          {query ? `Nothing matches "${query}".` : `No ${title.toLowerCase()} yet. Add the first ${noun}.`}
        </div>
      ) : (
        <ul className="rounded-[24px] bg-[#26262B] divide-y divide-white/[0.05] overflow-hidden py-1">
          {visible.map((item) => {
            const index = items.indexOf(item);
            return (
              <li
                key={item.id}
                draggable={canReorder}
                onDragStart={(e) => {
                  dragFrom.current = index;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (dragFrom.current === null) return;
                  e.preventDefault();
                  setDragOver(index);
                }}
                onDragLeave={() => setDragOver((d) => (d === index ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current !== null) move(dragFrom.current, index);
                  dragFrom.current = null;
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  dragFrom.current = null;
                  setDragOver(null);
                }}
                className={cn(
                  'flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 px-3 sm:px-4 py-3 transition hover:bg-white/[0.025]',
                  dragOver === index && 'bg-[#6E5BFF]/10',
                  !item.is_active && 'opacity-60',
                )}
              >
                <div className="hidden sm:flex flex-col items-center w-8 shrink-0 text-[#5c5c63]">
                  {canReorder ? <IconGripVertical size={16} className="cursor-grab" aria-hidden /> : null}
                  <span className="text-[11px] tabular-nums">{index + 1}</span>
                </div>
                <MediaPreview value={rowMedia(item.data)} className={cn('rounded-md shrink-0', props.mediaClass || 'h-12 w-20')} />
                <button className="flex-1 min-w-0 text-left" onClick={() => openEditor(item)}>
                  <p className="text-[13px] font-medium text-[#f4f4f5] truncate">{rowTitle(item.data) || item.id}</p>
                  <div className="text-xs text-[#8b8b94] truncate mt-0.5">{rowMeta(item.data)}</div>
                </button>
                <span
                  className={cn(
                    'hidden md:inline-flex whitespace-nowrap text-[11px] font-medium rounded-full px-2.5 py-1',
                    item.is_active ? 'bg-[#22C55E]/15 text-[#86efac]' : 'bg-white/[0.06] text-[#a1a1aa]',
                  )}
                >
                  {item.is_active ? 'Live' : 'Hidden'}
                </span>
                {/* On a phone these wrap onto their own line under the title */}
                <div className="flex items-center gap-1 sm:gap-3 w-full sm:w-auto justify-end">
                  <Toggle
                    checked={item.is_active}
                    onChange={() => toggleActive(item)}
                    label={item.is_active ? 'Hide from app' : 'Show in app'}
                    disabled={!writable || busyId === item.id}
                  />
                  <div className="flex items-center">
                    <IconButton label="Move up" onClick={() => move(index, index - 1)} disabled={!canReorder || index === 0}>
                      <IconArrowUp size={16} />
                    </IconButton>
                    <IconButton label="Move down" onClick={() => move(index, index + 1)} disabled={!canReorder || index === items.length - 1}>
                      <IconArrowDown size={16} />
                    </IconButton>
                    <IconButton label="Edit" onClick={() => openEditor(item)}>
                      <IconPencil size={16} />
                    </IconButton>
                    <IconButton label="Delete" onClick={() => setToDelete(item)} disabled={!writable} className="hover:text-[#fca5a5]">
                      <IconTrash size={16} />
                    </IconButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editor && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/60" onMouseDown={(e) => e.target === e.currentTarget && closeEditor()}>
          <div role="dialog" aria-modal="true" aria-label={editor.item ? `Edit ${noun}` : `Add ${noun}`} className="h-full w-full max-w-2xl bg-[#1C1C20] border-l border-white/[0.06] flex flex-col shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 h-16 border-b border-white/[0.06] shrink-0">
              <div className="min-w-0">
                <p className="text-base font-semibold truncate">{editor.item ? `Edit ${rowTitle(editor.item.data) || noun}` : `New ${noun}`}</p>
                {editor.item && <p className="text-[11px] text-[#7b7b84]">ID: {editor.item.id}</p>}
              </div>
              <IconButton label="Close" onClick={() => closeEditor()}>
                <IconX size={18} />
              </IconButton>
            </div>
            {editor.conflict && (
              <div role="alert" className="mx-5 sm:mx-6 mt-4 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm text-[#fcd34d] flex flex-col gap-3">
                <p>Someone else changed or removed this {noun} after you opened it, so your changes weren&apos;t saved.</p>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await load();
                      setEditor(null);
                      toast('success', 'Reloaded the latest version. Open it again to edit.');
                    }}
                  >
                    Reload latest
                  </Button>
                </div>
              </div>
            )}
            {Object.keys(editor.errors).length > 0 && (
              <div role="alert" className="mx-5 sm:mx-6 mt-4 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#fca5a5]">
                <p className="font-medium">Fix these before saving:</p>
                <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
                  {Object.entries(editor.errors).map(([k, v]) => (
                    <li key={k}>
                      {k}: {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div ref={editorBody} className="flex-1 overflow-y-auto px-5 sm:px-6 py-6">
              <Form
                value={editor.draft}
                onChange={(draft) => setEditor((ed) => (ed ? { ...ed, draft } : ed))}
                errors={editor.errors}
                isNew={!editor.item}
                disabled={!writable || saving}
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-white/[0.06] shrink-0">
              <p className="text-xs text-[#8b8b94]">{dirty ? 'Unsaved changes' : editor.item ? 'No changes' : ''}</p>
              <div className="flex gap-2">
                <Button onClick={() => closeEditor()}>Cancel</Button>
                <Button variant="primary" onClick={save} busy={saving} disabled={!writable || (!!editor.item && !dirty)}>
                  {editor.item ? 'Save & publish' : `Publish ${noun}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        body="Your edits haven't been saved."
        confirmLabel="Discard"
        onConfirm={() => closeEditor(true)}
        onCancel={() => setConfirmDiscard(false)}
      />
      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${noun}?`}
        body={
          <>
            <strong className="text-white">{toDelete ? rowTitle(toDelete.data) : ''}</strong> will be removed from the app and can&apos;t be restored
            from here. To take it down temporarily, switch it off instead.
          </>
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
