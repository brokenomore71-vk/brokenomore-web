# admin-api

Backend for the hidden admin dashboard at `brokenomore.in/admin`. Runs on **Render**; the website stays on Vercel.

It holds the Supabase **service-role key**, which must never be in the website. The browser signs in with Supabase
(email + password, no sign-up). It then sends its access token here, and the API only answers if that user's
`app_metadata.role` is `admin`.

## Endpoints (all need `Authorization: Bearer <supabase access token>`)

| Method | Path | Returns |
|---|---|---|
| GET | `/health` | `{ ok: true }` (no auth; Render health check) |
| GET | `/admin/me` | the signed-in admin's id and email |
| GET | `/admin/overview` | `{ total, today, last7, last30 }` sign-up counts ("today" is IST) |
| GET | `/admin/users?page=1&limit=20&search=` | newest users first: `full_name`, `email`, `created_at` |

## Environment

| Variable | Example |
|---|---|
| `SUPABASE_URL` | `https://qvsfpqivhwdmrxzvkaso.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |
| `ALLOWED_ORIGINS` | `https://brokenomore.in,https://www.brokenomore.in` |
| `PORT` | set by Render automatically |

The website needs `NEXT_PUBLIC_ADMIN_API_URL` (this service's Render URL) alongside its existing
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Run locally

```bash
cd admin-api
npm install
cp .env.example .env   # then fill it in
npm run dev            # http://localhost:4000
```

## Deploy on Render

Render → **New → Blueprint** → pick this repo. `render.yaml` at the repo root sets up the service
(root dir `admin-api`, `npm install` / `npm start`, health check `/health`) and asks for the secrets.

## Making someone an admin

Admins are never created from the website. In Supabase, create the user (Authentication → Users → Add user,
with "Auto confirm"), then set its role with the service-role key:

```js
await supabase.auth.admin.updateUserById(userId, { app_metadata: { role: 'admin' } });
```

or in the SQL editor:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
where email = 'someone@brokenomore.in';
```
