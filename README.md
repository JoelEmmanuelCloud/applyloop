# ApplyLoop

A seeded job board built for the Kane CLI Hackathon. An AI agent reads a resume and applies to a job through the real UI, driven by Kane CLI, pausing to ask a human for the answer to an open-ended essay question before submitting. The app also ships with a deliberate IDOR vulnerability that a Kane exploit flow catches, which the agent then patches live — verified end-to-end with Kane CLI.

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for the full build plan.

## Run locally

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm install` also generates the Prisma client via a `postinstall` hook. `db:migrate` applies the schema to a local SQLite file at `prisma/dev.db`; `db:seed` loads 8 job listings and two demo users.

## Demo credentials

| User  | Email                | Password      | Role in the demo                        |
| ----- | --------------------- | -------------- | ---------------------------------------- |
| Alice | alice@applyloop.dev   | password123    | Victim — has one submitted application   |
| Bob   | bob@applyloop.dev     | password123    | Attacker — used to demonstrate the IDOR  |

Sign up for a fresh account to run the autopilot apply flow, or reuse Alice's.

## The vulnerability

`GET /api/applications/[id]` returns an application by ID after checking only that the requester is logged in — not that they own the application. Any authenticated user can read another user's name, email, phone, and essay answers by guessing or enumerating an application ID. `src/app/dashboard/applications/[id]/page.tsx` renders whatever that route returns, so the leak is visible directly in the UI.

Fix: check `application.userId === session.userId` in the route handler before returning data.

## Stack

Next.js 16 (App Router, TypeScript) · Prisma ORM · SQLite/libSQL (Turso-compatible) · Tailwind CSS · hand-rolled session auth (bcrypt + signed JWT cookie).
