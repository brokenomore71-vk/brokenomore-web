'use client';

// Client for the app content API (credit cards, festivals, feature slides, FAQs). It lives in the app's FastAPI backend
// on Cloud Run (chatbot_backend/app/routers/admin_content.py), next to the JSON the app reads, not in admin-api.
// Every request carries the admin session's access token; the backend accepts app_metadata.role = "admin",
// the same rule as the rest of /admin.

import { adminSupabase } from '@/lib/admin/client';
import { CMS_API_URL } from '@/lib/site';

export type Kind = 'credit-cards' | 'festivals' | 'feature-slides' | 'faqs';

export type Item<T = Record<string, unknown>> = {
  id: string;
  rev: string;
  is_active: boolean;
  data: T;
};

/** A FAQ category and how many questions are in it */
export type FaqCategory = { name: string; count: number };

export type SessionInfo = {
  email: string;
  storage: 'local' | 'gcs';
  writable: boolean;
  read_only_reason: string | null;
};

export type UploadResult = {
  url: string;
  asset_path: string;
  content_type: string;
  size: number;
  width: number | null;
  height: number | null;
};

// The app backend's address (the api.brokenomore.in gateway or the Cloud Run URL), not NEXT_PUBLIC_ADMIN_API_URL.
export const API_BASE = CMS_API_URL;

// Public bucket the app streams assets from (AppConstants.gcpBucketBaseUrl in the app)
const ASSET_BUCKET = 'https://storage.googleapis.com/bnm-public-assets';

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await adminSupabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) throw new ApiError(0, 'NEXT_PUBLIC_CMS_API_URL is not set, so the admin panel does not know where the backend is.');
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(await authHeader()),
        ...init.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    if (detail && typeof detail === 'object') {
      throw new ApiError(res.status, detail.message || 'Request failed', detail.errors || {});
    }
    throw new ApiError(res.status, typeof detail === 'string' ? detail : `Request failed (${res.status})`);
  }
  return body as T;
}

export const adminApi = {
  session: () => request<SessionInfo>('/admin/content/session'),
  list: <T>(kind: Kind) => request<{ items: Item<T>[]; total: number }>(`/admin/content/${kind}`),
  create: <T>(kind: Kind, data: T) =>
    request<Item<T>>(`/admin/content/${kind}`, { method: 'POST', body: JSON.stringify({ data }) }),
  update: <T>(kind: Kind, id: string, data: T, rev: string) =>
    request<Item<T>>(`/admin/content/${kind}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ data, rev }),
    }),
  setActive: <T>(kind: Kind, id: string, isActive: boolean, rev: string) =>
    request<Item<T>>(`/admin/content/${kind}/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive, rev }),
    }),
  remove: (kind: Kind, id: string, rev: string) =>
    request<{ deleted: string }>(`/admin/content/${kind}/${encodeURIComponent(id)}?rev=${encodeURIComponent(rev)}`, {
      method: 'DELETE',
    }),
  reorder: <T>(kind: Kind, ids: string[]) =>
    request<{ items: Item<T>[] }>(`/admin/content/${kind}/order`, { method: 'PUT', body: JSON.stringify({ ids }) }),
  festivalSettings: () => request<{ display_duration_seconds: number }>('/admin/content/festivals/settings'),
  saveFestivalSettings: (seconds: number) =>
    request<{ display_duration_seconds: number }>('/admin/content/festivals/settings', {
      method: 'PUT',
      body: JSON.stringify({ display_duration_seconds: seconds }),
    }),
  faqCategories: () => request<{ categories: FaqCategory[] }>('/admin/content/faqs/categories'),
  addFaqCategory: (name: string) =>
    request<{ categories: FaqCategory[] }>('/admin/content/faqs/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteFaqCategory: (name: string) =>
    request<{ categories: FaqCategory[]; deleted_questions: number }>(
      `/admin/content/faqs/categories?name=${encodeURIComponent(name)}`,
      { method: 'DELETE' },
    ),
  renameFaqCategory: (oldName: string, newName: string) =>
    request<{ categories: FaqCategory[] }>('/admin/content/faqs/categories', {
      method: 'PUT',
      body: JSON.stringify({ old_name: oldName, new_name: newName }),
    }),
  upload: (kind: Kind, file: File, purpose: 'image' | 'video' = 'image') => {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    form.append('purpose', purpose);
    return request<UploadResult>('/admin/content/uploads', { method: 'POST', body: form });
  },
};

/** Make the website show content changes on its next page load (see app/api/admin/revalidate). Best effort:
 * if it fails, the website still catches up within a minute. */
export async function refreshWebsite(): Promise<void> {
  try {
    await fetch('/api/admin/revalidate', { method: 'POST', headers: await authHeader() });
  } catch {}
}

/** A URL the browser can load for a value stored in the JSON (full URL, bucket asset path, or backend /static path). */
export function mediaUrl(value: string | null | undefined): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/static/')) return `${API_BASE}${v}`;
  // Uploaded from this panel: in the public bucket under assets/assets/cms/, where the app's getGcpAssetUrl
  // also looks ("assets/x" -> <bucket>/assets/assets/x)
  if (v.startsWith('assets/cms/')) return encodeURI(`${ASSET_BUCKET}/assets/${v}`);
  // Shipped inside the app: previewed from the copy in public/app-assets/ (same folder layout as the app)
  if (v.startsWith('assets/')) return encodeURI(`/app-assets/${v.slice('assets/'.length)}`);
  return '';
}

export const isVideo = (value: string) => /\.(mp4|webm|mov|m4v)$/i.test(value.split('?')[0]);
