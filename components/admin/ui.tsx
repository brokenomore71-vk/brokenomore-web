'use client';

// Small building blocks shared by the admin panel's pages and forms.

import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { IconAlertTriangle, IconCheck, IconLoader2, IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { adminApi, ApiError, isVideo, mediaUrl, type Kind, type UploadResult } from '@/lib/admin/api';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------------------------- toasts

type Toast = { id: number; tone: 'success' | 'error'; text: string };
const ToastContext = createContext<(tone: Toast['tone'], text: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast['tone'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[80] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded-2xl px-4 py-3 text-sm shadow-2xl shadow-black/40 border max-w-sm w-full sm:w-auto',
              t.tone === 'success' ? 'bg-[#26262B] border-[#22C55E]/30 text-[#e4e4e7]' : 'bg-[#26262B] border-[#EF4444]/40 text-[#fca5a5]',
            )}
          >
            {t.tone === 'success' ? <IconCheck size={18} className="shrink-0 mt-px text-[#86efac]" /> : <IconAlertTriangle size={18} className="shrink-0 mt-px" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ---------------------------------------------------------------------------------------------- buttons

// React 19: ref is a normal prop, passed through to the <button> with the rest
type ButtonProps = React.ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  busy?: boolean;
};

export function Button({ variant = 'secondary', busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-medium transition',
        'disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]',
        variant === 'primary' && 'bg-[#6E5BFF] font-semibold text-white hover:bg-[#5f4cf0]',
        variant === 'secondary' && 'border border-white/10 text-[#d4d4d8] hover:border-white/25 hover:text-white',
        variant === 'danger' && 'bg-[#EF4444] font-semibold text-white hover:bg-[#dc2626]',
        variant === 'ghost' && 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.04]',
        className,
      )}
    >
      {busy && <IconLoader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({ label, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-full text-[#8b8b94] hover:text-white hover:bg-white/[0.06] transition',
        'disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-[#6E5BFF]',
        className,
      )}
    />
  );
}

// ---------------------------------------------------------------------------------------------- form fields

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-[#A3A3A3]">
        {label}
        {required && <span className="text-[#fca5a5] ml-0.5">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-[#fca5a5]">{error}</p> : hint ? <p className="text-xs text-[#7b7b84]">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg bg-[#1C1C20] border border-white/10 px-3.5 h-10 text-sm text-[#F5F5F5] placeholder:text-[#5c5c63] outline-none transition ' +
  'focus:border-[#6E5BFF] focus:ring-2 focus:ring-[#6E5BFF]/30 disabled:opacity-60';

export function TextInput({ invalid, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...rest} className={cn(inputClass, invalid && 'border-[#EF4444]/70', className)} />;
}

export function TextArea({ invalid, className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...rest} className={cn(inputClass, 'h-auto py-2 leading-relaxed resize-y', invalid && 'border-[#EF4444]/70', className)} />;
}

export function Select({
  invalid,
  className,
  options,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; options: { value: string; label: string }[] }) {
  return (
    <select {...rest} className={cn(inputClass, 'pr-8', invalid && 'border-[#EF4444]/70', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#26262B]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-[#6E5BFF]' : 'bg-[#3a3a42]',
      )}
    >
      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  );
}

export function ColorInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={valid ? value : '#000000'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-10 w-11 shrink-0 rounded-lg bg-[#1C1C20] border border-white/10 cursor-pointer p-1"
        aria-label="Pick colour"
      />
      <TextInput value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid} placeholder="#FFFFFF" />
    </div>
  );
}

/** Pick from known values (as chips) and add new ones. Stored as "A, B, C". */
export function ChipsInput({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
}) {
  const selected = value.split(',').map((s) => s.trim()).filter(Boolean);
  const [draft, setDraft] = useState('');
  const set = (list: string[]) => onChange(list.join(', '));
  const toggle = (s: string) =>
    selected.some((x) => x.toLowerCase() === s.toLowerCase())
      ? set(selected.filter((x) => x.toLowerCase() !== s.toLowerCase()))
      : set([...selected, s]);
  const extra = selected.filter((s) => !suggestions.some((x) => x.toLowerCase() === s.toLowerCase()));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {[...suggestions, ...extra].map((s) => {
          const on = selected.some((x) => x.toLowerCase() === s.toLowerCase());
          return (
            <button
              type="button"
              key={s}
              onClick={() => toggle(s)}
              aria-pressed={on}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs border transition-colors',
                on ? 'bg-[#6E5BFF] text-white border-[#6E5BFF]' : 'border-white/10 text-[#a1a1aa] hover:border-white/25 hover:text-white',
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add another…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              e.preventDefault();
              set([...selected, draft.trim()]);
              setDraft('');
            }
          }}
        />
        <Button
          type="button"
          onClick={() => {
            if (draft.trim()) set([...selected, draft.trim()]);
            setDraft('');
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- media

export function MediaPreview({ value, className, alt = '' }: { value: string; className?: string; alt?: string }) {
  const url = mediaUrl(value);
  // Remembers which URL failed, so a new value gets a fresh try
  const [failedUrl, setFailedUrl] = useState('');
  const setFailed = () => setFailedUrl(url);
  if (!url || failedUrl === url) {
    // assets/... files shipped inside the app have no copy online to preview
    const bundled = value.trim().startsWith('assets/') && !value.includes('/cms/');
    return (
      <div
        className={cn('flex items-center justify-center bg-[#1C1C20] text-[#5c5c63] text-center', className)}
        title={bundled ? 'This file ships inside the app, so it can\'t be previewed here' : undefined}
      >
        {bundled ? <span className="px-1 text-[10px] leading-tight">In app bundle</span> : <IconPhoto size={20} />}
      </div>
    );
  }
  if (isVideo(url)) {
    return <video src={url} className={cn('object-cover bg-black', className)} muted loop autoPlay playsInline onError={setFailed} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={cn('object-contain bg-[#1C1C20]', className)} onError={setFailed} loading="lazy" />;
}

/**
 * Upload control for one image/video field. `pick` chooses which reference to store: the full URL or the bucket
 * asset path, depending on how the app loads that field (see chatbot_backend/app/services/content_media.py).
 */
export function MediaField({
  kind,
  value,
  onChange,
  onUploaded,
  pick = (r) => r.url,
  previewValue,
  allowVideo = false,
  previewClass = 'h-24 w-40',
  invalid,
  disabled,
}: {
  kind: Kind;
  value: string;
  onChange: (v: string) => void;
  onUploaded?: (r: UploadResult) => void;
  pick?: (r: UploadResult) => string;
  /** What to preview when it differs from the stored value (e.g. a festival's server_image_url) */
  previewValue?: string;
  allowVideo?: boolean;
  previewClass?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const upload = async (file: File) => {
    setError('');
    const video = file.type.startsWith('video/');
    if (!file.type.startsWith('image/') && !(allowVideo && video)) {
      setError(allowVideo ? 'Choose a PNG, JPEG, WebP image or an MP4/WebM video.' : 'Choose a PNG, JPEG or WebP image.');
      return;
    }
    const limit = video ? 30 : 5;
    if (file.size > limit * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${limit} MB.`);
      return;
    }
    setBusy(true);
    try {
      const result = await adminApi.upload(kind, file, video ? 'video' : 'image');
      onChange(pick(result));
      onUploaded?.(result);
      toast('success', 'Uploaded');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload failed. Try again.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 items-start">
        <MediaPreview value={previewValue || value} className={cn('rounded-lg border border-white/[0.06] shrink-0', previewClass)} />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            className="sr-only"
            accept={allowVideo ? 'image/png,image/jpeg,image/webp,video/mp4,video/webm' : 'image/png,image/jpeg,image/webp'}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            disabled={disabled || busy}
          />
          <div className="flex gap-2 flex-wrap">
            <Button type="button" onClick={() => fileRef.current?.click()} busy={busy} disabled={disabled}>
              {!busy && <IconUpload size={16} />}
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value && !disabled && (
              <Button type="button" variant="ghost" onClick={() => onChange('')}>
                <IconX size={16} /> Remove
              </Button>
            )}
          </div>
          <TextInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste a URL / assets/ path"
            invalid={invalid}
            disabled={disabled}
            className="text-xs h-8"
          />
        </div>
      </div>
      {error && <p className="text-xs text-[#fca5a5]">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- dialogs

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70" onClick={() => !busy && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-[24px] bg-[#26262B] border border-white/[0.06] p-6 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-base font-semibold text-white">
          {title}
        </h2>
        <div className="mt-2 text-sm text-[#a1a1aa]">{body}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-white/[0.06] pt-5 first:border-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && <p className="text-xs text-[#8b8b94] mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return <div className={cn('grid grid-cols-1 gap-4', cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>{children}</div>;
}
