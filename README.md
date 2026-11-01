# Maintenance Request Tool

A simple website for a property management company (~75 rental units).

- **Tenants** report problems through one online form. No account or password needed.
- **Staff** sign in to see every request, track progress, assign vendors and keep notes.

**Try it live:** https://xc-maintenance-request.vercel.app

- **Tenant form:** open the link and tap *Submit a maintenance request*.
- **Staff dashboard:** https://xc-maintenance-request.vercel.app/login — sign in as `reviewer@example.com` (password sent by email, not stored here because this repo is public).

---

## For tenants

1. Go to the website and tap **Submit a maintenance request**.
2. Pick your property and unit, and give your name plus an email or phone number.
3. Choose what's wrong (AC/heating, plumbing, electrical, pests, appliance, door/lock, other) and answer a couple of quick questions.
4. For some problems (like AC or electrical), the form suggests a few safe things to try first — such as checking the breaker. If that doesn't fix it, carry on.
5. Describe the problem, add up to 3 photos, and say whether maintenance can enter when you're not home.
6. Submit and get a **reference code** (like `MR-7KQ2X9`) to keep.

**Emergencies:** a red notice at the top of every page says: gas smell, flooding, or no AC above 90°F — don't use the form, call the emergency number. It appears again if you answer that water is leaking right now.

```mermaid
flowchart TD
    A([Tenant opens the website]) --> B{Emergency?<br/>gas, flooding, no AC above 90°F}
    B -- yes --> CALL([Call the emergency number])
    B -- no --> C[Pick property and unit]
    C --> D[Name + email or phone]
    D --> E[What's the problem?<br/>+ a few quick questions]
    E --> F{AC or electrical?}
    F -- yes --> G[Try a few safe fixes first]
    G -- still broken --> H
    F -- no --> H[Describe it + add photos]
    H --> I[Can maintenance enter?<br/>Pets? Best times?]
    I --> J([Submit → get a reference code])
```

---

## For staff

**Sign in** with the email and password the office set up for you. (There's no public sign-up — staff accounts are created by the office.)

| Page | What you can do |
|---|---|
| **Requests** | See every request, newest first. Filter by property, status or problem type. |
| **Request details** | See everything the tenant sent, including photos. Change the status, assign a vendor, add notes. |
| **New request** | Log a request that came in by phone, text or in person. |
| **Vendors** | Add, rename or deactivate vendors (plumber, electrician, pest control…). |

**Statuses:** New → Scheduled → Waiting on vendor → Done

**Badges on the list help you spot things that need a closer look:**
- 🟠 **Unverified contact** — the email/phone doesn't match anyone on file for that unit. The request is still accepted; it might be a new tenant, a family member, or a typo.
- 🔴 **Vacant unit** — the request is for a unit that's listed as empty.
- ⚪ **Phone / Text / In person** — staff logged it on the tenant's behalf.

**History:** every change — status, vendor, note — is recorded with who did it and when, so anyone can pick up a request and see the full story.

```mermaid
flowchart TD
    A([Staff signs in]) --> B[Requests list<br/>filter by property, status, type]
    P([Tenant phones, texts or visits]) --> N[Staff logs it with New request]
    N --> B
    B --> C[Open a request<br/>details, answers, photos]
    C --> D[Set status]
    C --> E[Assign a vendor]
    C --> F[Add a note]
    D & E & F --> H([History shows who did what, and when])
```

---

## How tenant data is kept safe

- **Tenants can't see anything** — not other requests, not who lives where. Submitting a request only gives back a reference code.
- **The form never reveals who lives in a unit.** It doesn't fill in names or say "we found you"; the thank-you screen is the same for everyone.
- **Only staff can see requests**, and only after signing in with an account the office created.
- **Photos are private.** Staff see them through links that stop working after 10 minutes.
- **Uploads are checked** — only real images, at most 3, shrunk on the phone before sending so they upload quickly.
- **Spam protection** — a hidden trap field catches most bots.

---

## Importing units and tenants

The office's spreadsheet of units and tenants (`data/sample_units.csv`) is loaded with one command. It's safe to run more than once.

It cleans up obvious things (extra spaces, "Bayview flats" vs "Bayview Flats", duplicate rows) but **never changes tenant details on its own**. Anything that looks wrong — like `gmial.com`, a phone number that's too short, or an impossible date — is kept as-is and listed in a report so someone can fix it properly.

### What the import found in sample_units.csv

From `npm run import:units -- --dry-run` (row numbers count the header as row 1):

| Row | Field | Problem | Action |
|---|---|---|---|
| 5 | email | invalid format "denise.carter@gmail" | kept as given |
| 8 | email | likely typo "luis.herrera@gmial.com" | kept as given (not corrected) |
| 10 | status | unit is vacant but a tenant is listed | imported as given |
| 12 | (row) | exact duplicate of row 11 | row dropped |
| 13 | email | likely typo "marcuslee.fl@hotmial.com" | kept as given (not corrected) |
| 14 | phone | only 6 digits | kept as given |
| 15 | lease_end | invalid date "2027-13-01" | set to empty |
| 16 | email | invalid format "jenna moore@yahoo.com" | kept as given |

---

## Assumptions

Most of these were confirmed with the owner before building (✔).

- ✔ **Tenants don't log in.** They pick their property and unit, and the request is matched to the tenant on file by email **or** phone. They get a reference code, but can't look anything up afterwards.
- **A request is never turned away** because the contact details don't match — it's accepted and marked *Unverified contact* for staff to check. Real tenants have typos, new numbers, or a family member reporting for them.
- ✔ **Staff can log requests** that came in by phone, text or in person, and the tool records which.
- ✔ **One emergency number** — the placeholder (000) 000-0000 — for every property. "Extreme heat" means **above 90°F**.
- ✔ **Vendors are a short list staff can edit**, and vendors never log in. Vendors are deactivated rather than deleted, so old requests keep their history.
- ✔ **One staff role** — every staff member can see and change everything, and every change is recorded.
- ✔ **No email or text notifications** in this first version.
- **Staff accounts are created by the office**, not by signing up on the website.
- **Up to 3 photos** per request is enough to show the problem.
- **Requests for vacant units are allowed** (e.g. a neighbour reporting a leak) but flagged so staff notice.

---

## Questions I'd ask the owner next

Before building, I asked the owner six questions (tenant identity, phone/walk-in requests, emergency number, vendors, roles, notifications). Their answers are the ✔ items under Assumptions. These are the follow-ups I'd ask next.

1. Should tenants get an email or text confirming their request, with the reference code?
2. Who can mark a request **Done** — any staff member, or only after the tenant confirms it's fixed?
3. Should a vendor automatically receive the request details when they're assigned?
4. Do any properties need a different emergency or after-hours number?
5. Do requests need a priority (e.g. *urgent* vs *can wait a week*), separate from the emergency phone line?
6. Should tenants be able to add information or cancel a request after sending it?
7. How long should requests and photos be kept?
8. Who keeps the unit and tenant list up to date when people move in or out?
9. Should 'can't secure the unit' (broken lock or door) count as urgent, with the emergency notice shown?

---

## Known issues

- **No limit on how often someone can submit.** A hidden trap stops simple bots, but a determined person could still send many fake requests.
- **Tenants can't check their request's status** after submitting — they need to contact the office with their reference code.
- **Photo links expire after 10 minutes** (on purpose, for privacy). If a staff member leaves a request open longer, refreshing the page brings the photos back.
- **Units and tenants can't be edited on the website yet.** Changes are made by updating the spreadsheet and importing again, or directly in Supabase.
- **Staff accounts are managed in Supabase**, not on the website.
- **Some iPhone photos (HEIC format) may not upload from a desktop Chrome browser.** They work from the iPhone itself.
- **If a photo upload fails halfway**, the tenant sees an error and can try again, but an unused photo may be left in storage. It's private and harmless, just takes a little space.
- **Status and vendor changes are saved together with their history entry, in one database transaction. Creating a request isn't yet:** if saving fails partway, the tenant may submit again and staff could see a duplicate. Next step: the same approach for request creation.
- **Vendor changes (add, rename, deactivate) aren't recorded in the history;** only request changes are.
- **Very large photo sets can exceed the host's 4.5 MB upload limit, which shows a generic error.** Photos are resized on the phone first, so this is unlikely.
- **Only the spreadsheet import has automated tests** (`npm test`). The rest of the app was tested by hand, including the negative cases (wrong logins, bad inputs, expired photo links).

---

## What I'd do next

- **Email/text updates** to tenants when their request is scheduled or done.
- **"Check my request"** page where a tenant enters their reference code to see the status.
- **Limit how often** one person can submit, to stop floods of fake requests.
- **Manage staff accounts** from the website instead of in Supabase.
- **Simple reports** — e.g. how long requests take, which units have the most problems.

---

## How this was built (and what AI wrote)

I built this with **Claude Code**, an AI coding assistant, working step by step and committing each feature separately.

**What AI wrote:** most of the code — the pages, the server routes, the database setup, the spreadsheet import script — and the first draft of this README and the flow charts.

**What I did:**
- Planned the project brief (features, data model, security rules) with an AI assistant, based on the owner's answers — see CLAUDE.md.
- Asked the owner the questions above and turned the answers into decisions.
- Made the product and design calls along the way — for example the landing page, giving the thank-you page its own link, moving staff pages under `/dashboard`, how errors show next to the field that caused them, and the loading indicators.
- Reviewed the code and tested every feature by hand in the browser and in Supabase, including the failure cases, and asked for fixes when something was off (e.g. the order of follow-up answers, the emergency notice position, error placement on the vendors page).

---

## Running it yourself (for developers)

Built with Nuxt 3, Tailwind CSS and Supabase. Hosted on Vercel.

1. Create a Supabase project and, in its SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_request_transactions.sql`. Turn off public sign-ups (Authentication → Sign In / Providers).
2. Copy `.env.example` to `.env` and fill in the Supabase URL, anon key and service role key.
3. Use Node 22 (`nvm use`), then `npm install`.
4. Import units: `npm run import:units` (add `-- --dry-run` to preview the report).
5. Create a staff login in Supabase (Authentication → Users → Add user, tick *Auto Confirm*), then add them to the staff list:
   `insert into staff (email, name) values ('you@example.com', 'Your Name');`
6. `npm run dev` and open http://localhost:3000. Staff sign in at `/login`.

**Where to change things:** categories, questions, quick fixes, statuses and the emergency number all live in one file — `config/maintenance.ts`.

More detail on the tenant form: [docs/tenant-form-flow.md](docs/tenant-form-flow.md).
