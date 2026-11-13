import { redirect } from 'next/navigation';
import { FEATURE_PAGES } from '@/lib/featurePages';

// There's no overview page: the features are reached from the navbar's Features menu. An old
// link to /features goes to the first one.
export default function FeaturesPage() {
  redirect(FEATURE_PAGES[0].href);
}
