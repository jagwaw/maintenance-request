# Maintenance Request Tool — project brief for Claude Code

Paid test project for a property management company (~75 rental units). Tenants submit
maintenance requests through one online form; staff manage them in a dashboard.
Goal: **a clean, working, secure v1 in ~6 hours.** Simple beats feature-rich. Do not add
features that aren't listed here — put ideas in README "What I'd do next" instead.

The live review includes a 20-minute call where I make one small change live, so keep
the code obvious, small, and easy to change.

## Stack

- Nuxt 3 + TypeScript + Tailwind CSS
- Supabase: Postgres, Auth (staff only), Storage (photos)
- `@nuxtjs/supabase` module, Zod for validation
- Deployed on Vercel from GitHub

## Security rules (non-negotiable)

1. **All database and storage access happens in Nuxt server routes** (`server/api/**`) using
   the Supabase service role key. The browser never queries Supabase tables or storage directly.
2. **RLS is enabled on every table with no policies**, so the anon key can read/write nothing.
3. The service role key is only in server runtime config (`NUXT_SUPABASE_SERVICE_KEY`),
   never in `public` runtime config, never committed.
4. **Tenants have no login and no read access to anything.** The public API can only:
   list properties + unit labels, and create a request. It never returns tenant names,
   emails, phones, or any request data except the new reference code.
5. The tenant form must **not** reveal who lives in a unit (no name prefill, no
   "we found you" message). The response is identical whether or not the contact matched.
6. Every `/api/staff/**` route starts with `requireStaff(event)`: valid Supabase session
   AND the user's email exists in the `staff` table. Public sign-up is disabled in Supabase;
   staff accounts are created manually.
7. Photos go in a **private** bucket `request-photos`. Staff see them only through signed
   URLs that expire after 10 minutes, generated server-side per request view.
8. Uploads: max 3 photos, images only (check MIME + magic bytes server-side), resized
   client-side to max 1600px JPEG so the whole request stays under Vercel's 4.5 MB body limit.
9. Validate every input with Zod on the server. Add a hidden honeypot field to the tenant form.
10. Use the Supabase client's query builder (parameterized) only — no string-built SQL.

## Data model

```
properties   id, name (unique)
units        id, property_id, label, status ('occupied'|'vacant'), unique(property_id, label)
tenants      id, unit_id, name, email (lowercase, nullable), phone_digits (nullable),
             lease_end (date, nullable), import_warnings text[]
vendors      id, name (unique), active bool
             seed: In-house maintenance, Pest control, AC contractor, Plumber, Electrician
staff        id, email (unique), name
requests     id, ref_code (unique, e.g. MR-7KQ2X9, random), unit_id, tenant_id (nullable),
             contact_name, contact_email, contact_phone, contact_verified bool,
             category, details jsonb (follow-up answers), description,
             permission_to_enter bool, pets text, best_times text,
             source ('form'|'phone'|'text'|'in_person'), status, vendor_id (nullable),
             created_by_staff_id (nullable), created_at, updated_at
request_photos  id, request_id, storage_path, created_at
request_events  id, request_id, actor ('tenant' or staff email), type
                ('created'|'status_changed'|'assigned'|'note_added'), from_value, to_value,
                note, created_at
```

- `status` and `category` are plain `text`, validated in the app from config — **not**
  Postgres enums — so adding one during the live call is a one-file change.
- Statuses: New → Scheduled → Waiting on vendor → Done.
- Notes are stored as `request_events` rows with type `note_added` (one history timeline).
- All changes go through one helper, `logEvent()`, in `server/utils/events.ts`.

## Single config file: `config/maintenance.ts`

Holds categories, follow-up questions, self-checks, statuses, request sources, emergency
text, and the emergency phone number. Adding a category or question must only touch this file.

- Categories: AC/heating, plumbing, electrical, pest, appliance, door/lock, other.
- Each category: `label`, `followUps` (id, question, type: 'select'|'text', options?),
  optional `selfCheck` (short list of safe things to try first, plus a
  "Still not fixed — continue" button).
- Examples:
  - AC/heating: "Is it blowing warm air, or not turning on at all?" / "When did you last
    change the filter?" Self-check: check thermostat mode and batteries, check the breaker.
  - Electrical: "Is it one outlet/light, a whole room, or the whole unit?" Self-check:
    reset the GFCI outlet (kitchen/bathroom), check the breaker panel.
  - Plumbing: "Is water leaking right now?" (yes → show emergency notice), "Which fixture?"
- Emergency notice (always visible at the top of the form and repeated when relevant):
  "Gas smell, flooding, or no AC when it's above 90°F? Don't use this form — call
  (000) 000-0000 now." Same number for all properties.

## Contact matching (tenant form)

Normalize: email → trim + lowercase; phone → digits only, keep last 10.
A request is `contact_verified = true` if the email OR phone matches any tenant on that
unit; set `tenant_id` to that tenant. Otherwise accept the request anyway with
`contact_verified = false` — staff see an "Unverified contact" badge. Never reject a
tenant because the sample data has a bad email.

## CSV import: `scripts/import-units.ts`

Input: `data/sample_units.csv` (columns: property, unit, tenant_name, email, phone,
status, lease_end). Idempotent (safe to run twice). Rules:
- Trim all fields; normalize property names by case (`Bayview flats` → `Bayview Flats`).
- Drop exact duplicate rows after normalization.
- Multiple rows per unit = multiple tenants on that unit.
- Vacant rows with no tenant → unit only.
- Keep emails as given (lowercased); **never auto-correct typos**. Add a warning for
  invalid format (no TLD, spaces) or likely typos (gmial, hotmial).
- Phone with fewer than 10 digits → keep, add warning.
- Invalid `lease_end` (e.g. 2027-13-01) → null + warning.
- Status `vacant` but a tenant is listed → import as given + warning.
- Print a warnings report at the end (row number, field, problem, action taken).

## Pages

- `/` — tenant form, mobile-first: emergency notice → property → unit → name, email,
  phone → category → follow-ups → self-check (if any) → description → photos →
  permission to enter (+ optional pets, best times) → submit → reference code screen.
- `/staff/login` — Supabase email/password.
- `/staff` — table of requests; filters: property, status, category; badges for
  unverified contact and vacant unit; "New request" button.
- `/staff/requests/new` — same form fields + source (phone/text/in person).
- `/staff/requests/[id]` — details, follow-up answers, photos (signed URLs), change
  status, assign vendor, add note, full history timeline (who, what, when).
- `/staff/vendors` — list, add, rename, deactivate.

## Working rules

- Small commits, one feature each, with clear messages. Never commit `.env`.
- Build order: scaffold + deploy → schema + import → tenant form → staff auth →
  dashboard → request detail + history → vendors → staff-created requests → polish → README.
- Keep components small; no state library unless needed (`useState`/composables are enough).
- After each feature, tell me how to test it manually, including one negative test
  (e.g. calling a staff API without a session returns 401).

## Security checks (run before submitting)

One check per security rule. Run from the repo root; each should print the expected result.

```bash
# Rule 1 — browser code never queries Supabase tables or storage. Expect: nothing.
git grep -nE "\.from\(['\"]|\.storage\b" -- pages components middleware utils app.vue
# …and only uses the Supabase client for auth. Expect: nothing.
git grep -n "supabase\." -- pages components | grep -v "auth\."

# Rule 2 — RLS on every table, no policies. Expect: tables = rls, policies = 0.
echo "tables=$(grep -c '^create table' supabase/migrations/0001_init.sql) rls=$(grep -c 'enable row level security' supabase/migrations/0001_init.sql) policies=$(grep -ci 'create policy' supabase/migrations/0001_init.sql)"

# Rule 3 — service key never in browser code or public config. Expect: nothing.
git grep -nE "SERVICE_KEY|serviceKey|serverSupabaseServiceRole" -- pages components middleware utils app.vue nuxt.config.ts
# …and .env was never committed. Expect: nothing.
git log --all --oneline -- .env

# Rule 4/5 — only two public routes, and submit returns just the reference code.
git ls-files server/api | grep -v '^server/api/staff/'   # Expect: properties.get.ts, requests/index.post.ts
grep -n "return" server/api/requests/index.post.ts        # Expect: only { refCode } (real and honeypot)

# Rule 6 — every staff route starts with requireStaff. Expect: nothing.
for f in $(git ls-files 'server/api/staff/*'); do grep -q "await requireStaff(event)" "$f" || echo "MISSING: $f"; done

# Rule 7 — private bucket, 10-minute signed URLs. Expect: one line each.
grep -n "'request-photos', 'request-photos', false" supabase/migrations/0001_init.sql
grep -n "10 \* 60" "server/api/staff/requests/[id]/index.get.ts"

# Rule 8 — max 3 photos, MIME + magic-byte check. Expect: one line each.
grep -n "MAX_PHOTOS = 3" config/maintenance.ts
grep -n "isAllowedImage" server/utils/requests.ts

# Rule 9 — every route that reads input validates it with Zod. Expect: nothing.
for f in $(git ls-files server/api); do if grep -qE "readBody|getQuery|getRouterParam|readRequestBody" "$f" && ! grep -q "parseOr400" "$f"; then echo "MISSING: $f"; fi; done
# …and the honeypot exists. Expect: matches in both files.
git grep -n "website" -- components/RequestForm.vue server/api/requests/index.post.ts

# Rule 10 — no string-built SQL. Expect: nothing.
git grep -nE "sql\`|\.query\(|execute\(" -- server scripts pages components
# …and rpc only calls the fixed functions from supabase/migrations, with named parameters.
# Expect: only update_request / create_request.
git grep -n "\.rpc(" -- server scripts pages components
```
