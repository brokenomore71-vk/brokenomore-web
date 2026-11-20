'use client';

// Feature story slides (feature_slides.json): the full-screen feature highlights in the app.

import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import ContentManager, { type FormProps } from '@/components/admin/ContentManager';
import { ColorInput, Field, Grid, MediaField, Section, Select, SizeNote, TextArea, TextInput } from '@/components/admin/ui';
import { isVideo } from '@/lib/admin/api';
import { cn } from '@/lib/utils';

type Slide = {
  id?: string;
  order?: number;
  is_active: boolean;
  duration_seconds: number;
  template_type: string;
  background_color: string;
  mat_color?: string;
  header: {
    title: string;
    partner_badge?: { logo_image: string; name: string; font_size: number };
    subtitle: string;
    title_size: number;
    subtitle_size: number;
    title_color: string;
    subtitle_color: string;
  };
  catchphrase: { text: string; font_size: number; color: string } | null;
  main_illustration: { source: string; alignment: string };
  bottom_element: {
    type: string;
    phone_image?: string;
    logo_image?: string;
    branding_text: string;
    font_size: number;
    corner_image?: string;
    button_text?: string;
  };
  action: { type: string; target: string } | null;
  [key: string]: unknown;
};

// What each template draws in the app (lib/pages/features_pages/feature_slides_page.dart)
const TEMPLATES = [
  { value: 'loan_planner', label: 'Feature video + corner image (Loan Planner style)', corner: true },
  { value: 'bills_subscription', label: 'Feature video + corner image (Bills style)', corner: true },
  { value: 'stocks_analysis', label: 'Feature video + corner image (Stocks style)', corner: true },
  { value: 'partner_feature', label: 'Partner logo beside the title (Quicko style)', corner: true, partner: true },
  { value: 'pedestal_mat', label: 'Phone on a mat with catchphrase (Split Sharing style)', mat: true, catchphrase: true },
  { value: 'standard_banner', label: 'Simple: title, catchphrase and a button', catchphrase: true, button: true },
];

const TARGETS = [
  { value: 'loans', label: 'Loan Planner' },
  { value: 'stocks', label: 'Stocks & Mutual Funds' },
  { value: 'tax', label: 'Income Tax Filing' },
  { value: 'bills', label: 'Bills & Subscriptions' },
];

const blank = (): Slide => ({
  is_active: true,
  duration_seconds: 6,
  template_type: 'loan_planner',
  background_color: '#000000',
  header: { title: '', subtitle: '', title_size: 52, subtitle_size: 24, title_color: '#FFFFFF', subtitle_color: '#8E8E93' },
  catchphrase: null,
  main_illustration: { source: '', alignment: 'center' },
  bottom_element: { type: 'logo_with_action', logo_image: 'assets/images/Features/white_logo.webp', branding_text: 'BrokeNoMore', font_size: 15 },
  action: { type: 'navigate', target: '' },
});

function SlideForm({ value, onChange, errors, isNew, disabled }: FormProps<Slide>) {
  const [advanced, setAdvanced] = useState(false);
  const t = TEMPLATES.find((x) => x.value === value.template_type) || TEMPLATES[TEMPLATES.length - 1];
  const header = (patch: Partial<Slide['header']>) => onChange({ ...value, header: { ...value.header, ...patch } });
  const bottom = (patch: Partial<Slide['bottom_element']>) => onChange({ ...value, bottom_element: { ...value.bottom_element, ...patch } });
  const catchphrase = value.catchphrase || { text: '', font_size: 32, color: '#FFFFFF' };
  const badge = value.header.partner_badge || { logo_image: '', name: '', font_size: 20 };
  const action = value.action || { type: 'navigate', target: '' };
  const e = (k: string) => errors[k];

  return (
    <div className="flex flex-col gap-6">
      {/* No template picker: slides are pre-made videos. New slides use the standard video layout
          (loan_planner); existing slides keep the layout they already have. */}
      <Section title="Layout">
        <Grid>
          <Field label="Seconds on screen" error={e('duration_seconds')}>
            <TextInput type="number" min={1} max={60} value={value.duration_seconds} onChange={(ev) => onChange({ ...value, duration_seconds: Number(ev.target.value) })} disabled={disabled} />
          </Field>
          <Field label="Background colour" error={e('background_color')}>
            <ColorInput value={value.background_color} onChange={(background_color) => onChange({ ...value, background_color })} invalid={!!e('background_color')} />
          </Field>
        </Grid>
        {isNew && (
          <Field label="ID" error={e('id')} hint="Optional. Generated from the title if empty; can't be changed later.">
            <TextInput value={value.id || ''} onChange={(ev) => onChange({ ...value, id: ev.target.value })} placeholder="gold_savings" disabled={disabled} />
          </Field>
        )}
      </Section>

      <Section title="Text">
        <Field label="Title" error={e('header.title')} hint="Optional. Leave empty if the video already shows the title. Press Enter for a line break.">
          <TextArea rows={3} value={value.header.title} onChange={(ev) => header({ title: ev.target.value })} invalid={!!e('header.title')} disabled={disabled} placeholder={'Loan\nPlanner'} />
        </Field>
        <Field label="Subtitle" error={e('header.subtitle')}>
          <TextInput value={value.header.subtitle} onChange={(ev) => header({ subtitle: ev.target.value })} disabled={disabled} placeholder="Map your way to zero debt" />
        </Field>
        {t.catchphrase && (
          <Field label="Catchphrase" error={e('catchphrase.text')} hint="Optional large line on the slide.">
            <TextArea
              rows={2}
              value={catchphrase.text}
              onChange={(ev) => onChange({ ...value, catchphrase: ev.target.value ? { ...catchphrase, text: ev.target.value } : null })}
              disabled={disabled}
              placeholder={'Split the bill,\nnot the vibe.'}
            />
          </Field>
        )}
      </Section>

      {t.partner && (
        <Section title="Partner badge" description="Logo and name shown beside the title.">
          <SizeNote size="square, e.g. 96 × 96 px" required={false}>
            shown small beside the title (the current Quicko logo is 37 × 37). Transparent PNG or WebP works best.
          </SizeNote>
          <Field label="Partner logo" error={e('header.partner_badge.logo_image')}>
            <MediaField
              kind="feature-slides"
              value={badge.logo_image}
              onChange={(logo_image) => header({ partner_badge: { ...badge, logo_image } })}
              disabled={disabled}
              previewClass="h-16 w-16"
            />
          </Field>
          <Field label="Partner name" error={e('header.partner_badge.name')}>
            <TextInput value={badge.name} onChange={(ev) => header({ partner_badge: { ...badge, name: ev.target.value } })} disabled={disabled} placeholder="Quicko" />
          </Field>
        </Section>
      )}

      <Section title="Media">
        <SizeNote size="720 × 1280 px (portrait, 9:16)">
          the size of all current slide videos. Any other size is refused. MP4/WebM video under 30 MB (the current ones run
          10 s), or a PNG/JPEG/WebP image under 5 MB.
        </SizeNote>
        <Field label={t.mat ? 'Animation (bottom right)' : 'Main video or image'} required error={e('main_illustration.source')}>
          <MediaField
            kind="feature-slides"
            allowVideo
            // The app streams slide videos through its asset loader (bucket path) and loads images by URL
            pick={(r) => (isVideo(r.url) ? r.asset_path : r.url)}
            value={value.main_illustration.source}
            onChange={(source) => onChange({ ...value, main_illustration: { ...value.main_illustration, source } })}
            requiredSize={{ width: 720, height: 1280 }}
            invalid={!!e('main_illustration.source')}
            disabled={disabled}
            previewClass="h-[160px] w-[90px]"
          />
        </Field>
        {t.corner && (
          <>
            <SizeNote size="about 240 × 170 px, landscape" required={false}>
              optional illustration in the bottom-right corner (current ones are 150–240 px wide). Transparent PNG or WebP.
            </SizeNote>
            <Field label="Corner image" error={e('bottom_element.corner_image')}>
              <MediaField kind="feature-slides" value={value.bottom_element.corner_image || ''} onChange={(corner_image) => bottom({ corner_image })} disabled={disabled} previewClass="h-[85px] w-[120px]" />
            </Field>
          </>
        )}
        {t.mat && (
          <>
            <SizeNote size="square, e.g. 256 × 256 px" required={false}>
              the phone standing on the mat (the current one is 85 × 85). Transparent PNG or WebP.
            </SizeNote>
            <Field label="Phone image" error={e('bottom_element.phone_image')}>
              <MediaField kind="feature-slides" value={value.bottom_element.phone_image || ''} onChange={(phone_image) => bottom({ phone_image })} disabled={disabled} previewClass="h-24 w-24" />
            </Field>
            <Field label="Mat colour" error={e('mat_color')}>
              <ColorInput value={value.mat_color || '#3D3D3D'} onChange={(mat_color) => onChange({ ...value, mat_color })} />
            </Field>
          </>
        )}
      </Section>

      <Section title="Opens" description="The part of the app this slide is about.">
        <Grid>
          <Field label="Destination" error={e('action.target')}>
            <Select
              value={TARGETS.some((x) => x.value === action.target) ? action.target : action.target ? '__custom' : ''}
              onChange={(ev) => {
                const v = ev.target.value;
                onChange({ ...value, action: v === '' ? null : { type: 'navigate', target: v === '__custom' ? action.target || '' : v } });
              }}
              disabled={disabled}
              options={[{ value: '', label: 'Nothing' }, ...TARGETS, { value: '__custom', label: 'Other…' }]}
            />
          </Field>
          {value.action && !TARGETS.some((x) => x.value === action.target) && (
            <Field label="Other destination" hint="An app route name, deep link, or https:// URL.">
              <div className="flex gap-2">
                <Select
                  value={action.type}
                  onChange={(ev) => onChange({ ...value, action: { ...action, type: ev.target.value } })}
                  className="w-32"
                  disabled={disabled}
                  options={[{ value: 'navigate', label: 'Route' }, { value: 'deep_link', label: 'Deep link' }, { value: 'url', label: 'URL' }]}
                />
                <TextInput value={action.target} onChange={(ev) => onChange({ ...value, action: { ...action, target: ev.target.value } })} disabled={disabled} />
              </div>
            </Field>
          )}
        </Grid>
        {t.button && (
          <Field label="Button text" error={e('bottom_element.button_text')}>
            <TextInput value={value.bottom_element.button_text || ''} onChange={(ev) => bottom({ button_text: ev.target.value })} placeholder="Explore" disabled={disabled} />
          </Field>
        )}
      </Section>

      <div className="border-t border-white/[0.06] pt-4">
        <button type="button" onClick={() => setAdvanced((a) => !a)} className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white" aria-expanded={advanced}>
          <IconChevronDown size={16} className={cn('transition-transform', advanced && 'rotate-180')} />
          Text sizes, colours and branding
        </button>
        {advanced && (
          <div className="flex flex-col gap-4 mt-4">
            <Grid>
              <Field label="Title size" error={e('header.title_size')}>
                <TextInput type="number" value={value.header.title_size} onChange={(ev) => header({ title_size: Number(ev.target.value) })} disabled={disabled} />
              </Field>
              <Field label="Subtitle size" error={e('header.subtitle_size')}>
                <TextInput type="number" value={value.header.subtitle_size} onChange={(ev) => header({ subtitle_size: Number(ev.target.value) })} disabled={disabled} />
              </Field>
              <Field label="Title colour" error={e('header.title_color')}>
                <ColorInput value={value.header.title_color} onChange={(title_color) => header({ title_color })} />
              </Field>
              <Field label="Subtitle colour" error={e('header.subtitle_color')}>
                <ColorInput value={value.header.subtitle_color} onChange={(subtitle_color) => header({ subtitle_color })} />
              </Field>
              {value.catchphrase && (
                <>
                  <Field label="Catchphrase size">
                    <TextInput type="number" value={catchphrase.font_size} onChange={(ev) => onChange({ ...value, catchphrase: { ...catchphrase, font_size: Number(ev.target.value) } })} disabled={disabled} />
                  </Field>
                  <Field label="Catchphrase colour">
                    <ColorInput value={catchphrase.color} onChange={(color) => onChange({ ...value, catchphrase: { ...catchphrase, color } })} />
                  </Field>
                </>
              )}
              {t.partner && (
                <Field label="Partner name size">
                  <TextInput type="number" value={badge.font_size} onChange={(ev) => header({ partner_badge: { ...badge, font_size: Number(ev.target.value) } })} disabled={disabled} />
                </Field>
              )}
              <Field label="Video/image position" error={e('main_illustration.alignment')}>
                <Select
                  value={value.main_illustration.alignment}
                  onChange={(ev) => onChange({ ...value, main_illustration: { ...value.main_illustration, alignment: ev.target.value } })}
                  disabled={disabled}
                  options={['center', 'bottom_right', 'bottom_left', 'bottom_center', 'top_center'].map((v) => ({ value: v, label: v.replace('_', ' ') }))}
                />
              </Field>
              <Field label="Branding text">
                <TextInput value={value.bottom_element.branding_text} onChange={(ev) => bottom({ branding_text: ev.target.value })} disabled={disabled} />
              </Field>
              <Field label="Branding text size">
                <TextInput type="number" value={value.bottom_element.font_size} onChange={(ev) => bottom({ font_size: Number(ev.target.value) })} disabled={disabled} />
              </Field>
            </Grid>
            {!t.mat && (
              <Field label="Logo (bottom left)" error={e('bottom_element.logo_image')} hint="Square, like the current 84 × 84 px white logo. Transparent PNG or WebP.">
                <MediaField kind="feature-slides" value={value.bottom_element.logo_image || ''} onChange={(logo_image) => bottom({ logo_image })} disabled={disabled} previewClass="h-14 w-14" />
              </Field>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Unused optional parts are dropped before saving, so the stored slide matches the existing ones.
function toRecord(s: Slide): Slide {
  const t = TEMPLATES.find((x) => x.value === s.template_type);
  const header = { ...s.header };
  if (!t?.partner || !header.partner_badge?.logo_image) delete header.partner_badge;
  const bottom = { ...s.bottom_element };
  if (!t?.corner) delete bottom.corner_image;
  if (!t?.mat) delete bottom.phone_image;
  if (t?.mat) delete bottom.logo_image; // the mat layout has no logo
  if (!t?.button) delete bottom.button_text;
  const out: Slide = {
    ...s,
    header,
    bottom_element: bottom,
    catchphrase: t?.catchphrase && s.catchphrase?.text.trim() ? s.catchphrase : null,
    action: s.action?.target.trim() ? s.action : null,
  };
  if (!t?.mat) delete out.mat_color;
  return out;
}

export default function FeatureSlidesPage() {
  return (
    <ContentManager<Slide>
      kind="feature-slides"
      title="Feature Slides"
      noun="slide"
      description="The full-screen feature stories in the app, played in the order shown here."
      blank={blank}
      Form={SlideForm}
      toRecord={toRecord}
      rowTitle={(s) => s.header?.title?.replace(/\s*\n\s*/g, ' ').trim()}
      rowMeta={(s) => [TEMPLATES.find((x) => x.value === s.template_type)?.label.split(' (')[0] || s.template_type, `${s.duration_seconds}s`, s.header?.subtitle].filter(Boolean).join(' · ')}
      rowMedia={(s) => s.main_illustration?.source}
      mediaClass="h-16 w-10"
      searchText={(s) => `${s.header?.title} ${s.header?.subtitle} ${s.template_type}`}
    />
  );
}
