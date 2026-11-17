import { ImageResponse } from 'next/og';

// The preview image shown when a BrokeNoMore link is shared (WhatsApp, X, LinkedIn, Slack...).
// Built once at build time. Pages without their own image use this one.
export const alt = 'BrokeNoMore: save, split, invest and plan, all in one place';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FEATURES = ['Expense tracker', 'Split bills', 'Digital gold', 'AI stock analysis', 'Loan planner', 'Bill reminders'];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          background: 'radial-gradient(circle at 80% 10%, #3b1f7a 0%, #121212 55%)',
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, color: '#C9B8F0', letterSpacing: 1 }}>BrokeNoMore</div>
        <div style={{ marginTop: 24, fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 960 }}>
          Managing Your Money Has Never Been Easier.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#a3a3a3' }}>Save, split, invest and plan, all in one place.</div>
        <div style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {FEATURES.map((f) => (
            <div
              key={f}
              style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, border: '2px solid #6B46C1', fontSize: 24, color: '#e5e5e5' }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
