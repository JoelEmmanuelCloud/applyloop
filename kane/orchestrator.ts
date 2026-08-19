import spawn from "cross-spawn";
import { execFile } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { readFileSync, watch } from "node:fs";
import { resolve } from "node:path";

function killProcessTree(pid: number) {
  if (process.platform === "win32") {
    execFile("taskkill", ["/pid", String(pid), "/T", "/F"], () => {});
  } else {
    try {
      process.kill(-pid);
    } catch {
      try {
        process.kill(pid);
      } catch {}
    }
  }
}

interface KaneVerdict {
  confirmed?: boolean;
  status?: string;
  severity?: string;
  bug_title?: string;
  suggestion?: string;
  root_cause?: string;
}

interface RunEndEvent {
  type: "run_end";
  status: "passed" | "failed";
  summary: string;
  one_liner?: string;
  reason?: string;
  final_state?: Record<string, unknown>;
  verdict?: KaneVerdict;
}

interface RunKaneOptions {
  mode: "action" | "testing";
  timeoutSec: number;
}

function runKane(objective: string, options: RunKaneOptions): Promise<RunEndEvent> {
  return new Promise((resolvePromise, reject) => {
    const args = ["run", objective, "--mode", options.mode, "--headless", "--agent", "--timeout", String(options.timeoutSec)];

    const child = spawn("kane-cli", args);
    let buffer = "";
    let runEnd: RunEndEvent | null = null;

    const killTimer = setTimeout(() => {
      if (child.pid) killProcessTree(child.pid);
    }, (options.timeoutSec + 30) * 1000);

    child.stdout?.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("{")) continue;
        try {
          const event = JSON.parse(trimmed);
          if (event.type === "run_end") {
            runEnd = event as RunEndEvent;
          }
        } catch {
          continue;
        }
      }
    });

    child.on("close", () => {
      clearTimeout(killTimer);
      if (runEnd) {
        resolvePromise(runEnd);
      } else {
        reject(new Error("kane-cli exited without a run_end event"));
      }
    });

    child.on("error", (error) => {
      clearTimeout(killTimer);
      reject(error);
    });
  });
}

async function runKaneWithRetry(objective: string, options: RunKaneOptions, maxAttempts = 3): Promise<RunEndEvent> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await runKane(objective, options);
      if (result.status === "passed" || result.verdict?.confirmed === true) {
        return result;
      }
      if (attempt < maxAttempts) {
        console.log(`Attempt ${attempt} did not reach a clear result, retrying...`);
        continue;
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        console.log(`Attempt ${attempt} failed (${(error as Error).message}), retrying...`);
      }
    }
  }

  throw lastError;
}

interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  summary: string;
}

function parseResume(path: string): ResumeProfile {
  const text = readFileSync(path, "utf-8");
  const lines = text.split("\n").map((line) => line.trim());
  const name = lines.find((line) => line.length > 0) ?? "Applicant";

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const email = emailMatch ? emailMatch[0] : "applicant@example.com";

  const phoneMatch = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "555-000-0000";

  const summaryStart = text.indexOf("Summary");
  const experienceStart = text.indexOf("Experience");
  const summary =
    summaryStart >= 0 && experienceStart > summaryStart
      ? text
          .slice(summaryStart + "Summary".length, experienceStart)
          .replace(/\s+/g, " ")
          .trim()
      : "";

  return { name, email, phone, summary };
}

function parseQuestionList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {}

  return trimmed
    .split(/\r?\n|;\s*/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      result[key] = next;
      i += 1;
    } else {
      result[key] = "true";
    }
  }
  return result;
}

async function runApplyFlow(args: Record<string, string>) {
  const baseUrl = args["base-url"] ?? "http://localhost:3000";
  const jobId = args["job"];
  const resumePath = args["resume"];
  const password = args["password"] ?? "password123";

  if (!jobId || !resumePath) {
    console.error("Usage: apply --job <jobId> --resume <path> [--base-url <url>] [--password <pw>]");
    process.exit(1);
  }

  const profile = parseResume(resolve(resumePath));
  console.log(`Read resume for ${profile.name} <${profile.email}>`);
  console.log(`Summary: ${profile.summary}`);

  console.log("\nAsking Kane to open the application form and report the essay questions...");
  const readObjective = `Go to ${baseUrl}/jobs/${jobId}/apply. If you land on a login page, click the Sign up link and create an account with Name="${profile.name}", Email=${profile.email}, Password=${password}, then continue to the application form for that job. Once the application form is visible, report back the exact text of every form field label that asks for a written, open-ended answer, excluding Name, Email, Phone, and Resume summary. Do not fill in or submit the form.`;

  let questions: string[] = [];
  const maxReadAttempts = 3;

  for (let attempt = 1; attempt <= maxReadAttempts; attempt += 1) {
    const readResult = await runKaneWithRetry(readObjective, { mode: "action", timeoutSec: 120 });
    const rawAnswer = (readResult.final_state?.answer as string | undefined) ?? "";
    questions = parseQuestionList(rawAnswer);

    if (questions.length > 0) break;

    if (attempt < maxReadAttempts) {
      console.log(`Read attempt ${attempt} came back with no essay questions, retrying...`);
    } else {
      console.error(`Kane did not find any essay questions after ${maxReadAttempts} attempts.`);
      process.exit(1);
    }
  }

  console.log(`\nFound ${questions.length} essay question(s):`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answers: Record<string, string> = {};

  for (const question of questions) {
    const answer = await rl.question(`\n${question}\n> `);
    answers[question] = answer;
  }
  rl.close();

  const fillInstructions = Object.entries(answers)
    .map(([question, answer]) => `"${question}"=${JSON.stringify(answer)}`)
    .join(", ");

  console.log("\nSubmitting the application with your answers...");
  const submitObjective = `Go to ${baseUrl}/jobs/${jobId}/apply. If you land on a login page, log in with Email=${profile.email}, Password=${password}. Once the application form is visible, fill Phone=${profile.phone}, Resume summary=${JSON.stringify(profile.summary)}, ${fillInstructions}. Click Submit application. Wait 3 seconds, then check the page text for the phrase 'Application submitted successfully' and report whether it is present.`;

  const submitResult = await runKaneWithRetry(submitObjective, { mode: "action", timeoutSec: 100 });

  console.log(`\nStatus: ${submitResult.status}`);
  console.log(submitResult.summary);
}

async function runSecurityCheck(args: Record<string, string>): Promise<boolean> {
  const baseUrl = args["base-url"] ?? "http://localhost:3000";
  const victimId = args["victim"];
  const attackerEmail = args["attacker-email"] ?? "bob@applyloop.dev";
  const attackerPassword = args["attacker-password"] ?? "password123";

  if (!victimId) {
    console.error("Usage: security-check --victim <applicationId> [--base-url <url>]");
    process.exit(1);
  }

  const objective = `Go to ${baseUrl}/login. Type ${attackerEmail} into Email and ${attackerPassword} into Password, then click Log in. After logging in, navigate to the exact URL ${baseUrl}/dashboard/applications/${victimId}. This page is expected to show an access-denied or not-found message rather than another user's data — that is the correct, secure behavior, not an error to recover from. Wait 3 seconds, then read the page text as it is. Assert the page text does NOT contain 'Alice Chen'. Assert the page text does NOT contain 'alice@applyloop.dev'.`;

  const result = await runKaneWithRetry(objective, { mode: "testing", timeoutSec: 100 });

  const timestamp = new Date().toISOString();
  const passed = result.status === "passed";

  console.log(`[${timestamp}] ${passed ? "PASS" : "FAIL"} — ${passed ? "ownership check is enforced" : "IDOR is exploitable"}.`);
  if (result.final_state) {
    console.log(`  final_state: ${JSON.stringify(result.final_state)}`);
  }
  if (!passed && result.verdict) {
    console.log(`  confirmed: ${result.verdict.confirmed}`);
    console.log(`  severity: ${result.verdict.severity}`);
    console.log(`  bug_title: ${result.verdict.bug_title}`);
    console.log(`  suggestion: ${result.verdict.suggestion}`);
  }
  return passed;
}

async function runSecurityWatch(args: Record<string, string>) {
  const routeFile = resolve("src/app/api/applications/[id]/route.ts");
  console.log(`Watching ${routeFile} — save the file to re-run the exploit check.`);
  console.log("Running an initial check now...\n");

  await runSecurityCheck(args);

  let pending = false;
  watch(routeFile, async () => {
    if (pending) return;
    pending = true;
    setTimeout(async () => {
      console.log("\nFile changed — re-running the exploit check...\n");
      await runSecurityCheck(args);
      pending = false;
    }, 500);
  });
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  if (command === "apply") {
    await runApplyFlow(args);
    return;
  }

  if (command === "security-check") {
    const passed = await runSecurityCheck(args);
    process.exit(passed ? 0 : 1);
  }

  if (command === "security-watch") {
    await runSecurityWatch(args);
    return;
  }

  console.error("Usage: orchestrator.ts <apply|security-check|security-watch> [options]");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
