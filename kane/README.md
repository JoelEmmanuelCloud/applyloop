# Kane flows

Requires the app running locally (`npm run dev`) and `kane-cli` authenticated (`kane-cli login --oauth`).

## 1. Read the essay questions (autopilot, no submit)

```bash
kane-cli run "Go to {{base_url}}/jobs/{{job_id}}/apply. If you land on a login page, click the Sign up link and create an account with Name={{name}}, Email={{email}}, Password={{password}}, then continue to the application form for that job. Once the application form is visible, report back the exact text of every form field label that asks for a written, open-ended answer (ignore Name, Email, and Phone). Do not fill in or submit the form." \
  --mode action --headless --agent --timeout 120 --variables-file kane/apply-read.vars.json
```

Parse the `answer` field from the `run_end` NDJSON line for the essay question labels, then ask a human for real answers before running the next flow. Verified working: correctly signs up a new user and extracts `["Resume summary","Why does this role interest you?","Describe a time you solved a problem without being told how."]`.

## 2. Fill and submit

```bash
kane-cli run "Go to {{base_url}}/jobs/{{job_id}}/apply. If you land on a login page, log in with Email={{email}}, Password={{password}}. Once the application form is visible, fill Phone={{phone}}, Resume summary={{resume_summary}}, \"Why does this role interest you?\"={{essay_1}}, \"Describe a time you solved a problem without being told how.\"={{essay_2}}. Click Submit application. Wait 3 seconds, then check the page text for the phrase 'Application submitted successfully' and report whether it is present." \
  --mode action --headless --agent --timeout 100 --variables-file kane/apply-submit.vars.json
```

`apply-submit.vars.json` points at the Data Analyst listing so it doesn't collide with the `userId+jobId` unique constraint from earlier test runs. Update `job_id` (and pick fresh essay answers) whenever re-running against a reseeded database, since re-seeding regenerates every id.

**Real bug this flow caught:** `ApplyForm` used to call `router.refresh()` right after a successful submit. That re-rendered the parent server component, which saw the just-created application and swapped the success message for "You already applied to this role." — Kane's `--mode testing` run caught this as a genuine state-transition bug (confirmed independently by querying the DB — the application really was created, but the UI lied about it). Fixed by dropping the `router.refresh()` call in `src/app/jobs/[id]/apply/apply-form.tsx`.

## 3. IDOR exploit (testing mode)

```bash
kane/run-exploit.sh <victim_application_id>
```

or directly:

```bash
kane-cli run "Go to http://localhost:3000/login. Type bob@applyloop.dev into Email and password123 into Password, then click Log in. After logging in, navigate to the exact URL http://localhost:3000/dashboard/applications/<victim_application_id>. This page is expected to show an access-denied or not-found message rather than another user's data — that is the correct, secure behavior, not an error to recover from. Wait 3 seconds, then read the page text as it is. Assert the page text does NOT contain 'Alice Chen'. Assert the page text does NOT contain 'alice@applyloop.dev'." \
  --mode testing --headless --agent --timeout 100
```

**Values are inlined directly in the objective string, not passed via `--variables-file`.** Kane's `{{var}}` templating did not reliably resolve inside a multi-segment URL path (`/dashboard/applications/{{id}}`) — it silently produced a URL missing the id segment, landing on `/dashboard` instead and passing the assertion for the wrong reason (false negative — the leak was still there, curl confirmed it separately). Inlining the literal id into the objective string fixed this. `kane/run-exploit.sh` does that substitution in shell before calling `kane-cli`.

Pre-patch: this **fails**, and Kane's own verdict engine auto-classifies it as `confirmed: true`, `severity: critical`, `bug_title: "Application details route leaks another applicant's PII"`, with network evidence (`GET .../dashboard/applications/{id} -> 200`) — see `kane/evidence/exploit-pre-patch.ndjson`.

Post-patch (after adding the ownership check to `src/app/api/applications/[id]/route.ts`): the identical objective **passes** — `kane/evidence/exploit-post-patch.ndjson`. Note the objective wording explicitly tells Kane that landing on an access-denied/not-found state is the *expected, secure* outcome; without that framing Kane's self-correction logic treated the blocked page as "stuck" (a failed navigation) rather than a passing assertion, since the page still loads at the exact target URL but shows an error state instead of a hard redirect.

## Notes

- `--variables-file` JSON uses `{ "key": { "value": "..." } }`, referenced in objectives as `{{key}}`. Reliable for form field values; unreliable for values embedded inside a URL path — inline those directly instead.
- Re-seeding (`npm run db:seed`) regenerates every id (cuid) and invalidates existing session cookies — update `job_id` / `victim_application_id` after reseeding (see the seed script's console output).
- `--agent` emits NDJSON; the `run_end` line's `summary`, `status`, and `final_state` are what an orchestrating agent should parse.
- If a Kane run hits `{"type":"ask_user",...}` and hangs, the objective is missing an explicit starting point — begin with `Go to <url>` / `Navigate to <url>`.
