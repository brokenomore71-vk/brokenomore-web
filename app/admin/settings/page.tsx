'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { IconCheck, IconMinus, IconPlus, IconAlertTriangle } from '@tabler/icons-react';
import { adminFetch } from '@/lib/admin/client';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, ErrorBanner, PageHeader, Skeleton, Toggle } from '../_components/ui';

type Settings = {
  allowSignups: boolean;
  maintenanceMode: boolean;
  minPasswordLength: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
};

export default function SettingsPage() {
  const [saved, setSaved] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [ready, setReady] = useState(true);

  const load = useCallback(async () => {
    try {
      const { storageReady, ...s } = await adminFetch<Settings & { storageReady: boolean }>('/api/admin/settings');
      setReady(storageReady);
      setSaved(s);
      setDraft(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(draft) });
      setSaved(draft);
      setError(null);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <PageHeader title="Settings" description="App-wide controls for BrokeNoMore" />

      {error && <ErrorBanner message={error} onRetry={saved ? undefined : load} />}

      {!ready && (
        <div className="admin-rise mb-6 rounded-xl border border-(--a-border-strong) bg-(--a-surface) px-4 py-3.5 text-sm">
          <p className="font-medium text-(--a-text)">Settings storage isn&apos;t set up yet</p>
          <p className="mt-1 text-[13px] text-(--a-muted)">
            The <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs">app_settings</code> table is missing from
            Supabase. Run <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs">supabase/app_settings.sql</code>{' '}
            in the Supabase SQL editor, then reload. Until then the defaults below are shown and can&apos;t be saved.
          </p>
        </div>
      )}

      {draft?.maintenanceMode && (
        <div className="admin-rise mb-6 flex items-start gap-3 rounded-xl border border-(--a-amber)/25 bg-(--a-amber-soft) px-4 py-3 text-sm text-(--a-amber)">
          <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>Maintenance mode is on. Users can&apos;t use the app until you turn it off.</span>
        </div>
      )}

      <div className="grid max-w-3xl gap-4">
        <Card className="admin-rise" title="Access" description="Who can get into the app" padded={false}>
          <div className="divide-y divide-(--a-border) px-5 pb-2 sm:px-6">
            {!draft ? (
              <SkeletonRows n={3} />
            ) : (
              <>
                <SettingRow title="Allow new signups" description="When off, new accounts can't be created. Existing users can still sign in.">
                  <Toggle label="Allow new signups" checked={draft.allowSignups} onChange={(v) => set('allowSignups', v)} />
                </SettingRow>
                <SettingRow
                  title={
                    <span className="inline-flex items-center gap-2">
                      Maintenance mode {draft.maintenanceMode && <Badge tone="amber">On</Badge>}
                    </span>
                  }
                  description="Shows a maintenance screen to every user. Use it during migrations and outages."
                >
                  <Toggle label="Maintenance mode" checked={draft.maintenanceMode} onChange={(v) => set('maintenanceMode', v)} />
                </SettingRow>
                <SettingRow title="Minimum password length" description="Applies to new passwords. Between 6 and 32 characters.">
                  <Stepper value={draft.minPasswordLength} min={6} max={32} onChange={(v) => set('minPasswordLength', v)} />
                </SettingRow>
              </>
            )}
          </div>
        </Card>

        <Card className="admin-rise" title="Notifications" description="How BrokeNoMore contacts users" padded={false}>
          <div className="divide-y divide-(--a-border) px-5 pb-2 sm:px-6">
            {!draft ? (
              <SkeletonRows n={2} />
            ) : (
              <>
                <SettingRow title="Email notifications" description="Account and product emails sent to users.">
                  <Toggle label="Email notifications" checked={draft.emailNotifications} onChange={(v) => set('emailNotifications', v)} />
                </SettingRow>
                <SettingRow title="Push notifications" description="Mobile push notifications from the app.">
                  <Toggle label="Push notifications" checked={draft.pushNotifications} onChange={(v) => set('pushNotifications', v)} />
                </SettingRow>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Save bar */}
      <div
        className={cn(
          'fixed bottom-5 left-1/2 z-30 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 transition-all duration-300 lg:left-[calc(50%+124px)]',
          dirty || justSaved ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-(--a-border-strong) bg-(--a-raised)/95 px-4 py-3 shadow-2xl backdrop-blur">
          {justSaved && !dirty ? (
            <span className="inline-flex items-center gap-2 text-sm text-(--a-green)">
              <IconCheck size={16} /> Settings saved
            </span>
          ) : (
            <>
              <span className="text-sm text-(--a-muted)">You have unsaved changes</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setDraft(saved)} disabled={saving}>
                  Discard
                </Button>
                <Button size="sm" variant="primary" onClick={save} disabled={saving || !ready}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ title, description, children }: { title: ReactNode; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-(--a-text)">{title}</p>
        <p className="mt-0.5 text-[13px] text-(--a-subtle)">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-xl border border-(--a-border-strong) bg-(--a-bg)">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="grid h-9 w-9 place-items-center text-(--a-muted) hover:text-(--a-text) disabled:opacity-30"
      >
        <IconMinus size={15} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="grid h-9 w-9 place-items-center text-(--a-muted) hover:text-(--a-text) disabled:opacity-30"
      >
        <IconPlus size={15} />
      </button>
    </div>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-6 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-6 w-11 !rounded-full" />
        </div>
      ))}
    </>
  );
}
