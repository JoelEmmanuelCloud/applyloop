# ApplyLoop — Implementation Doc

Kane CLI Hackathon (Aug 19–21, 2026). Submission deadline: 11:59 PM IST Aug 21.

## What this is

A seeded job board. An AI agent reads a resume and autonomously applies to a job through the real UI via Kane CLI, pausing to ask the human for the answer to an open-ended essay question, then submitting and getting Kane's pass confirmation. Separately, the app ships with a deliberate IDOR vulnerability; a Kane exploit flow catches it, the agent patches the route live, and a re-run of the same Kane flow flips from fail to pass. Two closed loops: one functional (agent + Kane drive a real user flow), one security (Kane finds a bug, agent fixes it, Kane confirms the fix).

## Judging targets

- **Ships** — real deployed app, one-command local run, seed data pre-loaded.
- **Verified** — Kane isn't a tacked-on smoke test; it drives the actual apply flow and catches a real, meaningful bug (data leak across accounts).
- **Closed loop** — agent reads Kane's structured output and acts on it twice: once to get the essay question text, once to read a failing exploit result and know what to fix.
- **Craft** — clean UI, fast local setup, a bug class (IDOR) that's realistic and instantly legible to judges.

## Stack

- Next.js 15 (App Router) + TypeScript
- Prisma ORM + Turso (libSQL) — same engine locally (file-based) and in prod (hosted, serverless-friendly, persists on Vercel)
- Auth: hand-rolled — email/password, bcrypt hash, signed httpOnly session cookie (jose or iron-session). No third-party auth provider — keeps the vulnerable code path small and legible for the demo.
- Styling: Tailwind + shadcn/ui (fast, judge-friendly default look)
- Deploy: Vercel, `next build` — live URL for submission
- Resume input: pasted textarea, not file upload (reliable for browser automation, no parsing step)

## Data model (Prisma)

```
User        id, email, passwordHash, name, createdAt
Job         id, title, company, location, description
Application id, userId (FK), jobId (FK), name, email, phone,
            resumeSummary, essayAnswer, status, createdAt
```

`Application.userId` is the ownership field the IDOR bug ignores.

## Routes

- `/` — job listings (public)
- `/jobs/[id]` — job detail + Apply button
- `/jobs/[id]/apply` — application form (name, email, phone, resume summary, essay answer) — requires login
- `/login`, `/signup`
- `/dashboard` — logged-in user's own applications
- `/dashboard/applications/[id]` — single application detail page (renders whatever `/api/applications/[id]` returns)
- `/api/applications/[id]` (GET) — **the vulnerable route**. v1: fetches by ID, no ownership check. v2 (patched): 403 if `application.userId !== session.userId`.
- `/api/applications` (POST) — create application, always scoped to `session.userId`

## Seed data

8 jobs (Northwind Labs, Kepler Systems, Fathom Analytics, Rivet Studio, Anchorpoint — fictional companies, no trademark risk):
1. Frontend Engineer — Northwind Labs
2. Backend Engineer — Kepler Systems
3. Data Analyst — Fathom Analytics
4. Product Designer — Rivet Studio
5. DevOps Engineer — Anchorpoint
6. QA Engineer — Northwind Labs
7. Growth Marketer — Fathom Analytics
8. Mobile Engineer — Kepler Systems

Two seeded users for the exploit demo: `alice@applyloop.dev` (has one submitted application, the victim) and `bob@applyloop.dev` (the attacker). Both credentials go in the README for judges.

Applicant persona for the autopilot agent: "Jordan Reyes" — short resume text (skills, 2 past roles, education) checked into the repo as plain text so the agent has something concrete to read and lift fields from.

Essay questions on the apply form (both open-ended, both required):
1. "Why does this role interest you?"
2. "Describe a time you solved a problem without being told how."

## Kane flows

1. **Autopilot — read** (`--agent`, no submit): open job, start apply flow, fill name/email/phone/resume from variables, report back the exact essay question text without submitting. Agent parses NDJSON, extracts question text, prompts the human in the terminal for an answer.
2. **Autopilot — fill + submit**: re-run with the essay answer added to variables, submit, assert success message shown.
3. **Exploit** (testing-mode flow, re-run on save): log in as Bob, navigate directly to `/dashboard/applications/{alice_application_id}`, assert page does NOT contain Alice's name/email/essay text. Pre-patch this fails (leak visible) — agent reads the failure, patches `/api/applications/[id]/route.ts` to add the ownership check, saves, Kane re-fires automatically, flow now passes.

## Build order (3-day window)

**Day 1 (Aug 19) — scaffold + core app**
- `create-next-app`, Tailwind/shadcn init, Prisma schema, Turso local db, seed script
- Auth (signup/login/session), job listing + detail pages
- Apply form (no essay-pause logic yet, just a working form → creates Application)
- Dashboard + application detail page wired to the **vulnerable** `/api/applications/[id]` (bug is real from the start, not bolted on later)
- Commit early and often, each logical step its own commit

**Day 2 (Aug 20) — Kane integration**
- Install/configure `kane-cli`, get login working (currently erroring — resolve before building flows)
- Write and test the three Kane flows above against the running local app
- Build the terminal-side orchestrator script: runs flow 1, parses essay question from NDJSON output, prompts human via stdin, runs flow 2 with the answer injected
- Deploy to Vercel, confirm seed data + both demo users work against the live URL

**Day 3 (Aug 21) — polish, record, submit**
- Run the exploit flow, confirm red → patch → green on the actual deployed/local instance
- Record the 3-minute demo (script already drafted), upload unlisted, test the link in incognito
- Write README (setup, one-command run, live URL, credentials for judges) + one-paragraph summary
- Submit via the SurveyMonkey form before 11:59 PM IST / 11:29 AM PT Aug 21

## Known blocker

`kane-cli` is currently crashing on login (`Error: Login cancelled or timed out`). This needs to be resolved before Day 2's Kane integration work — treat as the first thing to check tomorrow if not fixed today.

## Fallback per hackathon rules

If Kane or the live deploy has any flakiness on demo day, have a recorded run of both loops (autopilot success, exploit fail→patch→pass) saved as backup evidence, per the hackathon's own guidance for anything that could fail live.
