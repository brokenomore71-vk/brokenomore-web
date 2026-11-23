'use client';

// Credit card catalogue (credit_cards.json). Field names are the file's own column names.

import ContentManager, { type FormProps } from '@/components/admin/ContentManager';
import { ChipsInput, Field, Grid, MediaField, Section, Select, TextArea, TextInput } from '@/components/admin/ui';

type Card = Record<string, string | boolean | undefined>;

const TAGS = [
  'Lifetime Free', 'UPI Enabled', 'Cashback', 'Zero Forex', 'Food Delivery', 'Online Grocery', 'Ecommerce',
  'Bills & Utilities', 'Flight & Hotels', 'Cabs & Autos', 'Dining', 'Movies', 'Fuel', 'Offline Stores', 'Health',
  'Insurance', 'Rent', 'Education', 'Jewellery', 'Wallet Reloads', 'Govt & Taxes', 'Domestic Lounge',
  'International Lounge', 'Railway lounge', 'Golf', 'Roadside Assistance',
];
const BADGES = ['Must read', 'Faster payout', 'Applications paused', 'Temporarily not accepting applications'];

const FIELDS = [
  'Card Image', 'Card Name', 'Issuer', 'Best Payout (₹)', 'Payout Type', 'Best Payout Source', 'Other Platform Payout',
  'ETCC Payout (₹)', 'ETB Payout (₹)', 'Referral / Deal Link', 'Image URL', 'Joining Fee (₹)', 'Annual Fee (₹)',
  'Renewal Fee (₹)', 'Fee Waiver', 'Forex Markup (%)', 'Key Benefits', 'Categories / Tags', 'Reward Currency',
  'Domestic Lounge / yr', 'International Lounge / yr', 'Badges', 'Age', 'Min Income (Salaried)', 'Min Credit Score',
  'New to Credit', 'Important T&Cs (EarnKaro)', 'Source Card ID',
];

const blank = (): Card => {
  const card: Card = Object.fromEntries(FIELDS.map((f) => [f, '']));
  card['Payout Type'] = 'Upto';
  card['Best Payout Source'] = 'ClariFi';
  card['Fee Waiver'] = 'N/A';
  card['Forex Markup (%)'] = '3.5';
  return card;
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');
// Stored as "• one\n• two"; edited as one benefit per line (the server adds the bullets back)
const unbullet = (v: unknown) => str(v).replace(/^•\s?/gm, '');

function CardForm({ value, onChange, errors, disabled }: FormProps<Card>) {
  const set = (field: string) => (v: string) => onChange({ ...value, [field]: v });
  const text = (field: string, props: { placeholder?: string; hint?: string; required?: boolean; label?: string } = {}) => (
    <Field label={props.label || field} required={props.required} error={errors[field]} hint={props.hint}>
      <TextInput value={str(value[field])} onChange={(e) => set(field)(e.target.value)} placeholder={props.placeholder} invalid={!!errors[field]} disabled={disabled} />
    </Field>
  );

  return (
    <div className="flex flex-col gap-6">
      <Section title="Card">
        <Field
          label="Card image"
          required
          error={errors['Card Image']}
          hint="Front of the card, landscape (about 1.586 : 1), PNG/JPEG/WebP under 5 MB."
        >
          <MediaField
            kind="credit-cards"
            value={str(value['Card Image'])}
            onChange={(v) => onChange({ ...value, 'Card Image': v, 'Image URL': v })}
            invalid={!!errors['Card Image']}
            disabled={disabled}
            previewClass="h-[76px] w-[120px]"
          />
        </Field>
        <Grid>
          {text('Card Name', { required: true, placeholder: 'HDFC Bank Millennia Credit Card' })}
          {text('Issuer', { required: true, placeholder: 'HDFC' })}
        </Grid>
        {text('Referral / Deal Link', { label: 'Apply link', placeholder: 'https://…', hint: 'Where the app sends people to apply.' })}
      </Section>

      <Section title="Fees" description="Plain numbers like 1500 are saved as ₹1,500.">
        <Grid cols={3}>
          {text('Joining Fee (₹)', { label: 'Joining fee', placeholder: '₹500' })}
          {text('Annual Fee (₹)', { label: 'Annual fee', placeholder: '₹500' })}
          {text('Renewal Fee (₹)', { label: 'Renewal fee', placeholder: '₹500' })}
        </Grid>
        <Grid>
          {text('Fee Waiver', { label: 'Fee waiver', placeholder: '₹2L/yr or N/A' })}
          {text('Forex Markup (%)', { label: 'Forex markup (%)', placeholder: '3.5' })}
        </Grid>
      </Section>

      <Section title="Benefits">
        <Field label="Key benefits" error={errors['Key Benefits']} hint="One benefit per line. The app condenses these into the card's highlights.">
          <TextArea
            rows={6}
            value={unbullet(value['Key Benefits'])}
            onChange={(e) => set('Key Benefits')(e.target.value)}
            invalid={!!errors['Key Benefits']}
            disabled={disabled}
            placeholder={'5% cashback on Amazon, Flipkart and Swiggy\n1% cashback on all other spends'}
          />
        </Field>
        <Field label="Categories / tags" hint="Used for the app's category filters.">
          <ChipsInput value={str(value['Categories / Tags'])} onChange={set('Categories / Tags')} suggestions={TAGS} />
        </Field>
        <Grid cols={3}>
          {text('Reward Currency', { label: 'Reward currency', placeholder: 'Reward Points' })}
          {text('Domestic Lounge / yr', { label: 'Domestic lounge / yr', placeholder: '8 or Unlimited' })}
          {text('International Lounge / yr', { label: 'International lounge / yr', placeholder: '4 or Unlimited' })}
        </Grid>
        <Field label="Badges">
          <ChipsInput value={str(value['Badges'])} onChange={set('Badges')} suggestions={BADGES} />
        </Field>
      </Section>

      <Section title="Eligibility">
        <Grid>
          {text('Age', { placeholder: '21 to 65 years' })}
          {text('Min Income (Salaried)', { label: 'Minimum income (salaried)', placeholder: 'Rs 25,000/monthly' })}
          {text('Min Credit Score', { label: 'Minimum credit score', placeholder: '750' })}
          {text('New to Credit', { label: 'New to credit', placeholder: 'Allowed / Not Allowed' })}
        </Grid>
      </Section>

      <Section title="Partner payout (internal)" description="Kept on the server for the team. Never sent to the app.">
        <Grid cols={3}>
          {text('Best Payout (₹)', { label: 'Best payout', placeholder: '₹2,500' })}
          <Field label="Payout type">
            <Select
              value={str(value['Payout Type'])}
              onChange={(e) => set('Payout Type')(e.target.value)}
              disabled={disabled}
              options={[{ value: 'Upto', label: 'Upto' }, { value: 'Flat', label: 'Flat' }, { value: '', label: '—' }]}
            />
          </Field>
          {text('Best Payout Source', { label: 'Best payout source', placeholder: 'ClariFi' })}
        </Grid>
        <Grid cols={3}>
          {text('Other Platform Payout', { label: 'Other platform payout', placeholder: 'EarnKaro ₹2080' })}
          {text('ETCC Payout (₹)', { label: 'ETCC payout', placeholder: '₹0' })}
          {text('ETB Payout (₹)', { label: 'ETB payout', placeholder: '₹0' })}
        </Grid>
        <Field label="Important T&Cs (EarnKaro)" hint="One point per line.">
          <TextArea rows={4} value={unbullet(value['Important T&Cs (EarnKaro)'])} onChange={(e) => set('Important T&Cs (EarnKaro)')(e.target.value)} disabled={disabled} />
        </Field>
      </Section>
    </div>
  );
}

export default function CreditCardsPage() {
  return (
    <ContentManager<Card>
      kind="credit-cards"
      title="Credit Cards"
      noun="card"
      description="The card catalogue in the app's Credit Cards section, in the order shown here. Hidden cards stay saved but aren't sent to the app."
      blank={blank}
      Form={CardForm}
      rowTitle={(c) => str(c['Card Name'])}
      rowMeta={(c) =>
        [str(c['Issuer']), str(c['Joining Fee (₹)']) && `Joining ${str(c['Joining Fee (₹)'])}`, str(c['Annual Fee (₹)']) && `Annual ${str(c['Annual Fee (₹)'])}`]
          .filter(Boolean)
          .join(' · ')
      }
      rowMedia={(c) => str(c['Card Image'])}
      mediaClass="h-10 w-16"
      searchText={(c) => `${str(c['Card Name'])} ${str(c['Issuer'])} ${str(c['Categories / Tags'])}`}
    />
  );
}
