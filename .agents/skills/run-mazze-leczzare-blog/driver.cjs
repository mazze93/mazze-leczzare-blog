#!/usr/bin/env node
// driver.cjs — smoke-test an Astro static site over HTTP. No browser binaries.
//
// Design rule: DERIVE, DON'T ASSERT. The previous version of this driver rotted
// because it wrote down facts the repo then changed underneath it — a nine-route
// list that missed six live pages, a project path under a macOS user that no
// longer exists, a framework version two majors stale. So:
//
//   · the project root is found by walking up for package.json (or the git root)
//   · the route list is read from dist/ (built output), else from src/pages/
//   · per-route expectations are structural (200 + a non-empty <title> + no dev
//     error overlay), not per-page magic strings that go stale on a rename
//   · versions and scripts are printed from package.json, never asserted here
//
// If you find yourself typing a literal path, a version number or a page name
// into this file, that is the rot starting again. Derive it or drop it.
//
// Usage (from anywhere inside the repo):
//   node <this file>                  # probe an already-running dev server
//   node <this file> --start          # start the dev server, probe, stop it
//   node <this file> --port 4399      # non-default port
//   node <this file> --base http://localhost:4321   # or a full base URL
//   node <this file> --preview        # build + preview (production output)
//   node <this file> --expect /work/=Research        # extra substring checks
//   node <this file> --json           # machine-readable summary on stdout
//
// Exit code 0 = every probed route passed; 1 = at least one failed.

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
function opt(name, fallback = null) {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return fallback;
}
// a bare numeric arg stays supported: `driver.cjs 4399` meant a port for years
const barePort = argv.find((a) => /^\d{2,5}$/.test(a));

const WANT_START = flag("start");
const WANT_PREVIEW = flag("preview");
const AS_JSON = flag("json");
const PORT = Number(opt("port", barePort || (WANT_PREVIEW ? 4322 : 4321)));
const BASE = (opt("base") || `http://localhost:${PORT}`).replace(/\/$/, "");
const EXTRA_EXPECTS = argv
  .map((a, i) => (argv[i - 1] === "--expect" ? a : null))
  .filter(Boolean)
  .map((s) => {
    const at = s.indexOf("=");
    return { path: s.slice(0, at), needle: s.slice(at + 1) };
  });

// ── output (declared early: startup paths log too) ───────────────────────────
const lines = [];
function log(s = "") {
  lines.push(s);
  if (!AS_JSON) console.log(s);
}

// ── project root: derived, never written down ────────────────────────────────
function findRoot() {
  const git = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  if (git.status === 0) {
    const root = git.stdout.trim();
    if (root && fs.existsSync(path.join(root, "package.json"))) return root;
  }
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const ROOT = findRoot();
if (!ROOT) {
  console.error(
    "Could not find a project root (no package.json walking up from cwd).\n" +
      "Run this from inside the site repo:  cd <site repo> && node <path to driver.cjs>",
  );
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

// ── route discovery ──────────────────────────────────────────────────────────
// Most truthful source first. dist/ is the surface that actually ships, dynamic
// routes included; src/pages/ only knows the static ones.
function routesFromDist(distDir) {
  const out = [];
  (function walk(dir, prefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "_astro" || entry.name.startsWith(".")) continue;
        walk(abs, `${prefix}${entry.name}/`);
      } else if (entry.name === "index.html") {
        out.push(prefix || "/");
      } else if (entry.name.endsWith(".html") && entry.name !== "404.html") {
        out.push(`${prefix}${entry.name}`);
      }
    }
  })(distDir, "/");
  return out;
}

function routesFromPages(pagesDir) {
  const out = [];
  (function walk(dir, prefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, `${prefix}${entry.name}/`);
        continue;
      }
      const m = entry.name.match(/^(.*)\.(astro|md|mdx|html)$/);
      if (!m) continue; // .ts/.js endpoints aren't HTML routes
      const stem = m[1];
      if (stem.includes("[")) continue; // dynamic — needs content to enumerate
      if (stem === "404") continue;
      out.push(stem === "index" ? prefix || "/" : `${prefix}${stem}/`);
    }
  })(pagesDir, "/");
  return out;
}

const distDir = path.join(ROOT, "dist");
const pagesDir = path.join(ROOT, "src", "pages");

function discoverRoutes() {
  let r = [];
  let src = "none";
  if (fs.existsSync(distDir)) {
    r = routesFromDist(distDir);
    src = "dist/ — built output, dynamic routes included";
  }
  if (r.length === 0 && fs.existsSync(pagesDir)) {
    r = routesFromPages(pagesDir);
    src = "src/pages/ — no dist/, so dynamic routes are NOT covered; build for full coverage";
  }
  return { r: [...new Set(r)].sort(), src };
}

let routes = [];
let routeSource = "none";
// `--start` (dev mode) never builds, so an unrelated dist/ left over from an
// earlier --preview run is not "the current truth" — it's whatever the last
// build happened to contain, which can add routes since deleted or miss ones
// added since. Route discovery has to match what's actually being served:
// dev mode always serves src/pages/ directly, so that's the only honest
// source for it, dist/ or no dist/. --preview mode legitimately prefers
// dist/ (below), because by the time routes are read for it, startServer()
// has already rebuilt — see the re-discovery call right after that build.
if (!WANT_PREVIEW) {
  if (fs.existsSync(pagesDir)) {
    routes = routesFromPages(pagesDir);
    routeSource = "src/pages/ — dev server, dynamic routes NOT covered; use --preview for full coverage";
  }
} else {
  ({ r: routes, src: routeSource } = discoverRoutes());
}

// ── http ─────────────────────────────────────────────────────────────────────
function getOnce(url) {
  const lib = url.startsWith("https:") ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.get(url, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () =>
        resolve({ status: res.statusCode, body, location: res.headers.location }),
      );
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

// Redirects are followed, not failed. Against production nearly every one of
// these is correct behaviour — `trailingSlash: "always"` 308s the .html pages,
// and the auth guard 302s /admin/ to the login page — so a driver that called
// 3xx a failure reported six false alarms on a perfectly healthy deploy. Follow
// the chain, judge the destination, and show the hop.
async function get(url, maxHops = 4) {
  const chain = [];
  let current = url;
  for (let i = 0; i <= maxHops; i++) {
    const res = await getOnce(current);
    if (res.status >= 300 && res.status < 400 && res.location && i < maxHops) {
      const next = new URL(res.location, current).toString();
      chain.push(`${res.status}→${new URL(next).pathname}`);
      current = next;
      continue;
    }
    return { ...res, chain, finalUrl: current };
  }
  return { status: 599, body: "", chain, finalUrl: current };
}

async function waitForServer(timeoutMs) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeoutMs) {
    try {
      await get(`${BASE}/`);
      return true;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  const why = lastErr ? lastErr.code || lastErr.message || lastErr.constructor.name : "unknown";
  throw new Error(`no server at ${BASE} after ${timeoutMs}ms (${why})`);
}

// ── structural expectations ──────────────────────────────────────────────────
// What any healthy page on any Astro site must satisfy. These survive renames,
// redesigns and new pages; per-page magic strings do not.
function checkPage(route, res) {
  const problems = [];
  if (res.status !== 200) problems.push(`HTTP ${res.status}`);
  const title = (res.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  if (res.status === 200) {
    if (!title || !title.trim()) problems.push("empty or missing <title>");
    if (res.body.length < 500) problems.push(`suspiciously small body (${res.body.length}B)`);
    if (/vite-error-overlay|astro-error-overlay/i.test(res.body)) {
      problems.push("dev error overlay in response");
    }
  }
  for (const e of EXTRA_EXPECTS) {
    if (e.path === route && !res.body.includes(e.needle)) {
      problems.push(`missing expected text ${JSON.stringify(e.needle)}`);
    }
  }
  return { problems, title: (title || "").trim().slice(0, 60) };
}

// ── server lifecycle (optional) ──────────────────────────────────────────────
// Astro 7's `astro dev` DAEMONIZES: the npm command returns as soon as the
// background server is up, and it manages ONE daemon per project — asking for a
// second port while one is running is a silent no-op. A previous version of this
// driver spawned it like a foreground process, "killed" the npm wrapper on exit
// (leaving the real daemon listening), and then hung for 90s on the next run
// because that stale daemon owned the project. Both symptoms were invisible
// because the child's output was swallowed. Hence: talk to the daemon through
// its own CLI (`astro dev status|stop|logs`), and never swallow its output.
let startedByUs = false;
let child = null;          // only used for `preview`, which runs in the foreground
const childOut = [];       // its output, kept so a failed start can explain itself
let childExited = null;

function astroDev(sub) {
  return spawnSync("npx", ["astro", "dev", sub], { cwd: ROOT, encoding: "utf8" });
}

function daemonRunning() {
  const r = astroDev("status");
  return !/No dev server is running/i.test(`${r.stdout}${r.stderr}`);
}

function startServer() {
  const script = WANT_PREVIEW ? "preview" : "dev";
  if (!pkg.scripts || !pkg.scripts[script]) {
    throw new Error(`package.json has no "${script}" script to start`);
  }
  if (WANT_PREVIEW && pkg.scripts.build) {
    log("  building first (npm run build)…");
    const b = spawnSync("npm", ["run", "build"], { cwd: ROOT, encoding: "utf8" });
    if (b.status !== 0) throw new Error(`npm run build failed:\n${b.stderr || b.stdout}`);
  }
  if (!WANT_PREVIEW && daemonRunning()) {
    log("  an astro dev daemon is ALREADY running for this project.");
    log("  Astro allows one per project, so a second port would silently not start.");
    log("  Probing the existing server instead; stop it yourself with: npx astro dev stop");
    return;
  }
  log(`  starting: npm run ${script} -- --port ${PORT}`);

  // `dev` daemonizes and returns; `preview` blocks in the foreground. Two
  // different lifecycles, so two different spawns — running preview through
  // spawnSync would hang here forever.
  if (WANT_PREVIEW) {
    child = spawn("npm", ["run", script, "--", "--port", String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });
    child.stdout.on("data", (d) => childOut.push(String(d)));
    child.stderr.on("data", (d) => childOut.push(String(d)));
    child.on("exit", (code) => {
      if (code !== null && code !== 0) childExited = code;
    });
    startedByUs = true;
    return;
  }

  const r = spawnSync("npm", ["run", script, "--", "--port", String(PORT)], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  if (r.status !== 0 && r.status !== null) {
    log(out.split("\n").slice(-20).join("\n"));
    throw new Error(`npm run ${script} exited ${r.status}`);
  }
  startedByUs = true;
}

// Whatever is listening on a port, by pid. lsof is present on macOS and on
// most Linux images; if it isn't, this degrades to a no-op and the caller's
// verification loop reports the port as still answering rather than pretending.
function killByPort(port, signal) {
  const r = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    encoding: "utf8",
  });
  const pids = (r.stdout || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map(Number)
    .filter((pid) => pid !== process.pid);
  for (const pid of pids) {
    try {
      process.kill(pid, signal);
    } catch {
      /* gone between lsof and kill */
    }
  }
  return pids.length;
}

function stopServer() {
  if (!startedByUs) return;
  if (WANT_PREVIEW) {
    // Signalling the npm process group does NOT reliably reach the server:
    // npm puts `astro preview` in its own group, so the port stayed bound after
    // every run. Kill what is actually holding the port instead — that is the
    // thing we mean, and it is checkable.
    killByPort(PORT, "SIGTERM");
    if (child && child.pid) {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        try {
          child.kill("SIGTERM");
        } catch {
          /* already gone */
        }
      }
    }
  } else {
    const r = astroDev("stop");
    const said = `${r.stdout || ""}${r.stderr || ""}`.trim();
    if (said) log(`  ${said.split("\n")[0]}`);
  }
  startedByUs = false;
}

// Stopping is not "signal sent", it is "port free". A SIGTERM to the process
// group races process.exit(), and npm can outlive it — an earlier version left
// the preview server listening after every run, which then blocked the next one.
async function stopServerVerified(timeoutMs = 4000) {
  stopServer();
  const start = Date.now();
  let escalated = false;
  while (Date.now() - start < timeoutMs) {
    try {
      await get(`${BASE}/`);
    } catch {
      return true; // nothing is answering — it is actually down
    }
    if (!escalated && Date.now() - start > 1200) {
      escalated = true;
      killByPort(PORT, "SIGKILL");
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  log(`  ! ${BASE} is still answering after stop — kill it by hand`);
  return false;
}

function devLogsTail(n = 15) {
  const r = astroDev("logs");
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  return out ? out.split("\n").slice(-n).join("\n") : "(no dev logs available)";
}

process.on("SIGINT", () => {
  stopServer();
  process.exit(130);
});

(async () => {
  log("");
  log(`  project   ${ROOT}`);
  log(`  package   ${pkg.name || "(unnamed)"}${pkg.version ? ` ${pkg.version}` : ""}`);
  log(`  astro     ${deps.astro || "(not a direct dependency)"}`);
  log(`  node      ${process.version}  ${process.execPath}`);
  log(`  scripts   ${Object.keys(pkg.scripts || {}).join(", ") || "(none)"}`);
  log(`  base      ${BASE}`);
  log(`  routes    ${routes.length} from ${routeSource}`);
  log("");

  if (routes.length === 0) {
    log("No routes discovered — nothing to probe.");
    process.exit(1);
  }

  if (WANT_START) startServer();
  // startServer() just built fresh (WANT_PREVIEW's branch of it runs
  // `npm run build` before starting the preview server) — re-read dist/
  // now, not the pre-build snapshot discoverRoutes() took above, or a
  // route added or removed in this same invocation goes unprobed.
  if (WANT_START && WANT_PREVIEW) {
    ({ r: routes, src: routeSource } = discoverRoutes());
    log(`  routes    ${routes.length} from ${routeSource} (rebuilt)`);
  }

  try {
    await waitForServer(WANT_START ? 90000 : 10000);
  } catch (err) {
    log(`  ✗ ${err.message}`);
    if (WANT_START && !WANT_PREVIEW) {
      log("");
      log("  last lines of `astro dev logs`:");
      log(devLogsTail());
    }
    if (WANT_START && WANT_PREVIEW) {
      log("");
      log(childExited !== null ? `  preview exited ${childExited}` : "  preview output:");
      log(childOut.join("").trim().split("\n").slice(-20).join("\n") || "  (no output)");
    }
    if (!WANT_START) {
      log("");
      log("  Start one first, or re-run with --start:");
      log(`    cd ${ROOT} && npm run ${WANT_PREVIEW ? "preview" : "dev"} -- --port ${PORT}`);
    }
    stopServer();
    process.exit(1);
  }

  let failed = 0;
  const results = [];
  for (const route of routes) {
    try {
      let res = await get(BASE + route);
      let note = "";
      // `astro dev` serves public/ files but does NOT resolve a directory to its
      // index.html the way Cloudflare Pages does, so a standalone page shipped as
      // public/<name>/index.html 404s in dev and works in production. Retry the
      // explicit file before calling that a failure — otherwise the driver cries
      // wolf on pages that are fine.
      if (res.status === 404 && route.endsWith("/")) {
        const retry = await get(`${BASE}${route}index.html`);
        if (retry.status === 200) {
          res = retry;
          note = " (directory index resolves in production, not in dev)";
        }
      }
      if (res.chain && res.chain.length) note += ` (${res.chain.join(" ")})`;
      const { problems, title } = checkPage(route, res);
      const ok = problems.length === 0;
      if (!ok) failed++;
      results.push({ route, status: res.status, ok, problems, title, note: note.trim() || undefined });
      log(
        `  ${ok ? "✓" : "✗"}  ${route.padEnd(36)} ${String(res.status).padEnd(4)} ${
          ok ? title + note : problems.join("; ")
        }`,
      );
    } catch (err) {
      failed++;
      results.push({ route, ok: false, problems: [err.message] });
      log(`  ✗  ${route.padEnd(36)} ERR  ${err.message}`);
    }
  }

  // Environment caveats are CHECKED AND REPORTED, never asserted in prose.
  // Under `astro dev` these 404 (Vite doesn't serve .js-backed .xml routes, and
  // Cloudflare Functions don't run); under `preview` or in production they are
  // real. Printing the observed status means the doc never has to claim it.
  log("");
  log("  ── environment notes (reported, never a failure) ──");
  for (const p of ["/rss.xml", "/api/contact"]) {
    try {
      const res = await get(BASE + p);
      log(`  ·  ${p.padEnd(36)} ${res.status}`);
    } catch (err) {
      log(`  ·  ${p.padEnd(36)} ERR  ${err.message}`);
    }
  }

  log("");
  log("  ── summary ─────────────────────────────────────────────");
  log(`  ${routes.length - failed}/${routes.length} routes passed`);
  log(`  ${failed === 0 ? "SMOKE PASSED" : "SMOKE FAILED"}`);
  log("");

  if (startedByUs) await stopServerVerified();
  if (AS_JSON) {
    console.log(JSON.stringify({ root: ROOT, base: BASE, routeSource, results, failed }, null, 2));
  }
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error("SMOKE FAILED:", err.message);
  stopServer();
  process.exit(1);
});
