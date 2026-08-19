# Testing guide

Everything below has been run and verified during development except where marked. Work through it in order — later sections (Kane, orchestrator) assume the app is running and seeded.

## 0. Setup

```bash
npm install
npm run db:migrate
npm run db:seed
```

`db:seed` prints the ids of the 8 jobs, Alice, Bob, and Alice's application. **Copy these down** — they're regenerated every time you reseed, and you'll need them for the steps below. In another terminal:

```bash
npm run dev
```

Confirm it's up: open `http://localhost:3000` — you should see 8 job listings.

## 1. Core app, by hand

1. **Sign up** as a new user at `/signup` (any name/email/8+ char password).
2. **Browse jobs** on `/` — click into any listing, click "Apply now".
3. **Apply** — fill the form (Resume summary, the two essay questions), submit. You should land on a green "Application submitted successfully" confirmation, not redirect anywhere.
4. **Dashboard** — click "Dashboard" in the nav, confirm your new application is listed, click into it, confirm all your submitted data shows correctly.
5. **Log out**, log back in with the same credentials — confirm the dashboard still shows your application.

If any of this breaks, it's a real regression — this whole path was manually verified working earlier.

## 2. The IDOR bug

The ownership check is currently **patched** (`src/app/api/applications/[id]/route.ts` checks `application.userId === session.userId`). To see it live, both broken and fixed:

**See it broken (red state):**
```bash
git log --oneline
git revert --no-commit 7ba546d
npm run dev
```
(if the dev server is already running, no restart needed — Next.js hot-reloads the route)

Then:
1. Log in as `alice@applyloop.dev` / `password123`, open her application from the dashboard, note the URL (`/dashboard/applications/<id>`).
2. Log out, log in as `bob@applyloop.dev` / `password123`.
3. Paste Alice's application URL directly into the address bar while logged in as Bob.
4. **You should see Alice's name, email, phone, and essay answers** — that's the bug.

**Fix it back:**
```bash
git checkout HEAD -- src/app/api/applications/[id]/route.ts
```
(`git revert --no-commit` stages the change, so a plain `git checkout --` won't undo it — you need `HEAD` there to unstage and restore in one step.)
Repeat step 3 — Bob should now get a "Not found" page instead.

Quick server-side check without the browser, using curl (replace the id):
```bash
curl -s -c /tmp/bob.txt -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"bob@applyloop.dev","password":"password123"}'
curl -s -b /tmp/bob.txt -o /dev/null -w "status=%{http_code}\n" http://localhost:3000/api/applications/<alice_application_id>
```
`404` = patched, `200` (with a JSON body containing Alice's data) = vulnerable.

## 3. Kane CLI flows, individually

Requires `kane-cli login --oauth` already done (run that yourself in a real terminal if `kane-cli whoami` doesn't show `Authenticated`).

**Read the essay questions off a fresh apply page** (update `job_id` in `kane/apply-read.vars.json` to a job nobody's applied to yet, from your latest `db:seed` output):
```bash
kane-cli run "Go to {{base_url}}/jobs/{{job_id}}/apply. If you land on a login page, click the Sign up link and create an account with Name={{name}}, Email={{email}}, Password={{password}}, then continue to the application form for that job. Once the application form is visible, report back the exact text of every form field label that asks for a written, open-ended answer, excluding Name, Email, Phone, and Resume summary. Do not fill in or submit the form." --mode action --headless --agent --timeout 120 --variables-file kane/apply-read.vars.json
```
Look for the `run_end` line at the end — `final_state.answer` should list the two essay question labels.

**Exploit check** (works whether the app is patched or not — tells you which):
```bash
kane/run-exploit.sh <alice_application_id>
```
Pre-patch: fails, with Kane's verdict block showing `confirmed: true`, `severity: critical`. Post-patch: passes.

## 4. The orchestrator (`kane/orchestrator.ts`)

This is the layer that actually closes the loop — parses Kane's output programmatically instead of you reading NDJSON by eye.

**Security check** (one-shot, scriptable — exit code 0/1):
```bash
npm run kane:security-check -- --victim <alice_application_id>
```

**Security watch** (the live demo centerpiece — leave this running in its own terminal):
```bash
npm run kane:security-watch -- --victim <alice_application_id>
```
It runs one check immediately, then sits watching `src/app/api/applications/[id]/route.ts`. While it's running, in a **different** terminal do the revert/checkout dance from Section 2 — you should see the watcher automatically re-run and flip its own PASS/FAIL as you edit and save the file, with no re-invocation on your part. `Ctrl+C` to stop it.

**Apply flow** (the one step that needs a real terminal — this doesn't work piped or scripted, only interactively, by design):
```bash
npm run kane:apply -- --job <fresh_job_id> --resume data/jordan-reyes-resume.txt
```
Expect: it prints the resume it read, then Kane opens the apply page (creates a Jordan Reyes account if one doesn't already exist for that email) and reports back the essay questions, then **pauses and prompts you by name** for a real answer to each one — type anything and hit enter. It then submits and reports Kane's final status.

If a Kane call in any of the above stalls for much longer than ~2 minutes with no output, it's likely Kane's own agent flakiness (see Troubleshooting) — `Ctrl+C` and rerun. The orchestrator already retries internally, so this is more likely to happen calling `kane-cli` directly than through `npm run kane:*`.

## Troubleshooting

- **Ids don't match / "Not found" where you expected data**: every `npm run db:seed` regenerates all ids and invalidates existing session cookies (you'll get logged out). Re-copy the ids it prints.
- **A Kane run hangs with no output for minutes**: check for orphaned headless Chrome processes from a previous killed run — `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*kane-clean*' }` in PowerShell. Kill any you find; they starve new runs of resources.
- **A Kane run prints `{"type":"ask_user",...}` and hangs forever**: the objective text is ambiguous (usually a conditional like "try X, if that fails do Y") and Kane wants a human to disambiguate, which `--agent` mode can't provide. This shouldn't happen with the objectives shipped here — if you've edited one, simplify it back to a single, unconditional path.
- **`apply` prints the two questions but then just exits** without submitting: you're almost certainly piping input in (`< file`) instead of typing it — Node's `readline` doesn't handle piped/non-TTY input reliably across multiple prompts. Run it in a real terminal and type the answers yourself.
- **Re-running `apply` against the same job fails oddly**: Jordan Reyes' account persists across runs (only `db:seed` wipes it). Either pick a job she hasn't applied to yet, or reseed.
