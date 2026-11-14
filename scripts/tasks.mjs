#!/usr/bin/env node
// One entry point for the whole monorepo (see the root package.json):
//
//   npm run setup    Python venv + every Python and Node dependency
//   npm test         FastAPI, AIML, Express, React app and Dashboard test suites
//   npm run lint     ESLint in every JavaScript project
//   npm run format   Prettier (JavaScript/CSS) + Ruff (Python) across the repo
//
// Runs each step in order, prints a summary and exits non-zero if any step failed.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WINDOWS = process.platform === "win32";
const VENV = join(ROOT, "backend", ".venv");
const PY = WINDOWS ? join(VENV, "Scripts", "python.exe") : join(VENV, "bin", "python");
const NPM = WINDOWS ? "npm.cmd" : "npm";
const JS_PROJECTS = ["backend/node-express", "frontend/react-app", "Dashboard"];
const PY_SOURCES = ["backend/python-fastapi", "AIML", "scripts"];

const step = (label, cmd, args, cwd = ".", env = {}) => ({ label, cmd, args, cwd, env });

const TASKS = {
  setup: () => [
    ...(existsSync(PY) ? [] : [step("create Python venv", WINDOWS ? "python" : "python3", ["-m", "venv", VENV])]),
    step("Python packages", PY, ["-m", "pip", "install", "-r", "requirements-dev.txt"]),
    step("root tools (Prettier)", NPM, ["install"]),
    ...JS_PROJECTS.map((p) => step(`npm ci · ${p}`, NPM, ["ci"], p)),
  ],
  test: () => [
    step("FastAPI tests", PY, ["-m", "pytest", "-q"], "backend/python-fastapi"),
    step("AIML tests", PY, ["-m", "pytest", "-q", "AIML/tests"]),
    ...JS_PROJECTS.map((p) => step(`tests · ${p}`, NPM, ["test"], p)),
  ],
  lint: () => [
    ...JS_PROJECTS.map((p) => step(`eslint · ${p}`, NPM, ["run", "lint"], p)),
    step("ruff check (errors)", PY, ["-m", "ruff", "check", "--select", "E9,F63,F7,F82", ...PY_SOURCES]),
  ],
  format: () => [
    step("prettier", NPM, ["exec", "--", "prettier", "--write", "--log-level", "warn", "."]),
    step("ruff format", PY, ["-m", "ruff", "format", ...PY_SOURCES]),
  ],
  "format:check": () => [
    step("prettier --check", NPM, ["exec", "--", "prettier", "--check", "--log-level", "warn", "."]),
    step("ruff format --check", PY, ["-m", "ruff", "format", "--check", ...PY_SOURCES]),
  ],
};

const name = process.argv[2];
if (!TASKS[name]) {
  console.error(`Usage: node scripts/tasks.mjs <${Object.keys(TASKS).join(" | ")}>`);
  process.exit(2);
}
if (name !== "setup" && !existsSync(PY)) {
  console.error("Python environment missing — run `npm run setup` first.");
  process.exit(1);
}

const results = [];
for (const s of TASKS[name]()) {
  console.log(`\n▶ ${s.label}`);
  const started = Date.now();
  const run = spawnSync(s.cmd, s.args, {
    cwd: join(ROOT, s.cwd),
    stdio: "inherit",
    shell: WINDOWS && s.cmd === NPM, // npm.cmd needs a shell on Windows
    env: { ...process.env, PYTHONPATH: ROOT, ...s.env },
  });
  results.push({ label: s.label, ok: run.status === 0, secs: ((Date.now() - started) / 1000).toFixed(1) });
}

console.log("\nSummary");
for (const r of results) console.log(`  ${r.ok ? "✔" : "✘"} ${r.label} (${r.secs}s)`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
