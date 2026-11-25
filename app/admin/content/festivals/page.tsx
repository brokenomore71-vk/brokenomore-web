'use client';

// Festival banners (festivals.json), shown on the app's dashboard on the festival's dates.

import { useEffect, useState } from 'react';
import { IconPlus, IconX } from '@tabler/icons-react';
import ContentManager, { type FormProps } from '@/components/admin/ContentManager';
import { useAdminSession } from '@/components/admin/AdminShell';
import { Button, Field, Grid, IconButton, MediaField, Section, Select, SizeNote, TextInput, useToast } from '@/components/admin/ui';
import { adminApi } from '@/lib/admin/api';

type Festival = {
  id?: string;
  name: string;
  image: string;
  server_image_url: string;
  date: string;
  start_date?: string;
  end_date?: string;
  dates: string[];
  start_time: string;
  end_time: string;
  time: string;
  greeting: string;
  is_active: boolean;
  is_birthday?: boolean;
  [key: string]: unknown;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const blank = (): Festival => ({
  name: '',
  image: '',
  server_image_url: '',
  date: '',
  dates: [],
  start_time: '00:00',
  end_time: '23:59',
  time: '12:00 AM - 12:00 AM (24 Hours)',
  greeting: '',
  is_active: true,
});

const fmt = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function schedule(f: Festival): string {
  if (f.is_birthday) return "On each user's birthday";
  const parts: string[] = [];
  if (f.start_date && f.end_date) parts.push(`${fmt(f.start_date)} – ${fmt(f.end_date)}`);
  if (f.dates?.length) parts.push(f.dates.length > 3 ? `${f.dates.length} dates from ${fmt(f.dates[0])}` : f.dates.map(fmt).join(', '));
  if (f.date && /^\d{2}-\d{2}$/.test(f.date)) parts.push(`every ${Number(f.date.slice(3))} ${MONTHS[Number(f.date.slice(0, 2)) - 1]?.slice(0, 3)}`);
  return parts.join(' · ') || 'No dates';
}

function FestivalForm({ value, onChange, errors, disabled }: FormProps<Festival>) {
  const set = <K extends keyof Festival>(k: K, v: Festival[K]) => onChange({ ...value, [k]: v });
  const [newDate, setNewDate] = useState('');
  const yearly = /^\d{2}-\d{2}$/.test(value.date) ? value.date : '';
  const month = yearly ? Number(yearly.slice(0, 2)) : 0;
  const day = yearly ? Number(yearly.slice(3)) : 0;
  const setYearly = (m: number, d: number) =>
    set('date', m ? `${String(m).padStart(2, '0')}-${String(Math.min(d || 1, DAYS_IN_MONTH[m - 1])).padStart(2, '0')}` : '');
  const addDate = () => {
    if (!newDate) return;
    set('dates', Array.from(new Set([...(value.dates || []), newDate])).sort());
    setNewDate('');
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title="Banner">
        <SizeNote size="2048 × 768 px">
          wide landscape, the same size as the current banners. Any other size is refused. PNG, JPEG or WebP, under 5 MB.
        </SizeNote>
        <Field label="Banner image" required error={errors.image || errors.server_image_url}>
          <MediaField
            kind="festivals"
            value={value.image}
            previewValue={value.server_image_url || value.image}
            // The app loads "image" through its asset loader (bucket path) and falls back to "server_image_url" (full URL)
            pick={(r) => r.asset_path}
            requiredSize={{ width: 2048, height: 768 }}
            onChange={(v) => onChange({ ...value, image: v, server_image_url: v ? value.server_image_url : '' })}
            onUploaded={(r) => onChange({ ...value, image: r.asset_path, server_image_url: r.url })}
            invalid={!!errors.image}
            disabled={disabled}
            previewClass="h-[68px] w-[181px]"
          />
        </Field>
        <Grid>
          <Field label="Festival name" required error={errors.name}>
            <TextInput value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Diwali" invalid={!!errors.name} disabled={disabled} />
          </Field>
          <Field label="Greeting" error={errors.greeting}>
            <TextInput value={value.greeting} onChange={(e) => set('greeting', e.target.value)} placeholder="Happy Diwali!" disabled={disabled} />
          </Field>
        </Grid>
      </Section>

      {value.is_birthday ? (
        <Section title="When it shows">
          <p className="text-sm text-[#a1a1aa]">This is the birthday banner: the app shows it on each user&apos;s own birthday, so it has no dates.</p>
        </Section>
      ) : (
        <Section title="When it shows" description="The banner shows on any day matching one of these. Use at least one.">
          <Field label="Specific dates" error={errors.dates} hint="For festivals whose date changes each year. Add next year's date when you know it.">
            <div className="flex flex-col gap-2">
              {(value.dates || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {value.dates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] border border-white/10 pl-2.5 pr-1 py-0.5 text-xs">
                      {fmt(d)}
                      <IconButton label={`Remove ${d}`} className="h-5 w-5" onClick={() => set('dates', value.dates.filter((x) => x !== d))} disabled={disabled}>
                        <IconX size={12} />
                      </IconButton>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <TextInput type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} disabled={disabled} className="sm:w-48 [color-scheme:dark]" />
                <Button type="button" onClick={addDate} disabled={disabled || !newDate}>
                  <IconPlus size={16} /> Add date
                </Button>
              </div>
            </div>
          </Field>
          <Grid>
            <Field label="Date range: from" error={errors.start_date}>
              <TextInput type="date" value={value.start_date || ''} onChange={(e) => set('start_date', e.target.value)} disabled={disabled} className="[color-scheme:dark]" />
            </Field>
            <Field label="to" error={errors.end_date} hint="For multi-day festivals like Navratri.">
              <TextInput type="date" value={value.end_date || ''} onChange={(e) => set('end_date', e.target.value)} disabled={disabled} className="[color-scheme:dark]" />
            </Field>
          </Grid>
          <Field label="Every year on" error={errors.date} hint="For fixed-date festivals (New Year, Christmas). Shows on this day every year.">
            <div className="flex gap-2">
              <Select
                value={String(month)}
                onChange={(e) => setYearly(Number(e.target.value), day)}
                disabled={disabled}
                className="sm:w-44"
                options={[{ value: '0', label: 'Not yearly' }, ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))]}
              />
              {month > 0 && (
                <Select
                  value={String(day)}
                  onChange={(e) => setYearly(month, Number(e.target.value))}
                  disabled={disabled}
                  className="w-24"
                  options={Array.from({ length: DAYS_IN_MONTH[month - 1] }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                />
              )}
            </div>
            {value.date && !yearly && <p className="text-xs text-[#7b7b84]">Currently set to {value.date}.</p>}
          </Field>
        </Section>
      )}

      <Section title="Time of day" description="Most banners run all day.">
        <Grid cols={3}>
          <Field label="Starts" error={errors.start_time}>
            <TextInput type="time" value={value.start_time} onChange={(e) => set('start_time', e.target.value)} disabled={disabled} className="[color-scheme:dark]" />
          </Field>
          <Field label="Ends" error={errors.end_time}>
            <TextInput type="time" value={value.end_time} onChange={(e) => set('end_time', e.target.value)} disabled={disabled} className="[color-scheme:dark]" />
          </Field>
          <Field label="Label" error={errors.time}>
            <TextInput value={value.time} onChange={(e) => set('time', e.target.value)} disabled={disabled} />
          </Field>
        </Grid>
      </Section>
    </div>
  );
}

function DisplaySettings() {
  const session = useAdminSession();
  const toast = useToast();
  const [seconds, setSeconds] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    adminApi.festivalSettings().then((s) => {
      setSeconds(s.display_duration_seconds);
      setSaved(s.display_duration_seconds);
    }).catch(() => {});
  }, []);
  if (seconds === null) return null;
  return (
    <div className="rounded-[24px] bg-[#26262B] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end gap-3">
      <Field label="Seconds each banner shows" hint="When several banners are live on the same day, the app rotates through them." className="sm:w-72">
        <TextInput type="number" min={1} max={30} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} disabled={!session?.writable} />
      </Field>
      <Button
        disabled={!session?.writable || seconds === saved || seconds < 1 || seconds > 30}
        busy={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await adminApi.saveFestivalSettings(seconds);
            setSaved(r.display_duration_seconds);
            toast('success', 'Saved.');
          } catch (e) {
            toast('error', e instanceof Error ? e.message : 'Could not save');
          } finally {
            setBusy(false);
          }
        }}
      >
        Save
      </Button>
    </div>
  );
}

export default function FestivalsPage() {
  return (
    <ContentManager<Festival>
      kind="festivals"
      title="Festivals"
      noun="festival"
      description="Festival banners on the app's dashboard. A banner appears on the days you set; hidden festivals never appear. Banner images must be exactly 2048 × 768 px."
      blank={blank}
      Form={FestivalForm}
      headerExtra={<DisplaySettings />}
      rowTitle={(f) => f.name}
      rowMeta={(f) => schedule(f)}
      rowMedia={(f) => f.server_image_url || f.image}
      mediaClass="h-11 w-20"
      searchText={(f) => `${f.name} ${f.greeting}`}
    />
  );
}
