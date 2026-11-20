import AdminShell from '@/components/admin/AdminShell';

// /admin/content/*: managing what the app shows (credit cards, festivals, feature slides).
// Unlisted and not indexed like the rest of /admin (app/admin/layout.tsx, next.config.ts headers).
export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
