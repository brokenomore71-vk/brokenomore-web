import { redirect } from 'next/navigation';

// /admin/content has no page of its own: the sidebar links straight to the three sections.
export default function ContentHome() {
  redirect('/admin/content/credit-cards');
}
