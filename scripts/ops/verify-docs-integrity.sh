#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[docs-integrity] starting validation"

node <<'NODE'
const fs = require('fs');
<<<<<<< ours
=======
const { execSync } = require('child_process');
>>>>>>> theirs

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const validScripts = Object.keys(pkg.scripts || {}).sort();
const validScriptSet = new Set(validScripts);

<<<<<<< ours
const authoritativeFiles = [
  'README.md',
  'AGENTS.md',
  '.github/copilot-instructions.md',
  'docs/operations/AGENT_OPERATIONS_PROTOCOL.md',
  'docs/operations/memory/README.md',
];

const deploymentTerminologyFiles = [
  'README.md',
  'AGENTS.md',
  '.github/copilot-instructions.md',
  'docs/operations/AGENT_OPERATIONS_PROTOCOL.md',
  'docs/operations/memory/README.md',
];
=======
const discoveredDocs = execSync(
  "git ls-files 'README.md' 'AGENTS.md' 'CONTRIBUTING.md' '.github/**/*.md' 'docs/**/*.md'",
  { encoding: 'utf8' }
)
  .split('\n')
  .map((x) => x.trim())
  .filter(Boolean)
  .sort();

const ignoredScriptValidationPatterns = [
  /^docs\/operations\/INSTRUCTION_CONFLICT_AUDIT\.md$/,
  /^docs\/operations\/memory\/DECISION_LOG\.md$/,
  /^docs\/operations\/memory\/SESSION_LOG\.md$/,
  /^docs\/operations\/memory\/context-cache\//,
];

const scannedDocs = discoveredDocs.filter(
  (file) => !ignoredScriptValidationPatterns.some((re) => re.test(file))
);

const deploymentTerminologyFiles = discoveredDocs.filter((file) => {
  return [
    'README.md',
    'AGENTS.md',
    'CONTRIBUTING.md',
    '.github/copilot-instructions.md',
    '.github/pull_request_template.md',
    'docs/operations/AGENT_OPERATIONS_PROTOCOL.md',
    'docs/operations/memory/README.md',
  ].includes(file);
});
>>>>>>> theirs

const forbiddenDeploymentTerms = [
  {
    regex: /@astrojs\/cloudflare/g,
<<<<<<< ours
    suggestion: 'Use Cloudflare Pages + static Astro wording unless the adapter is actually introduced.',
  },
  {
    regex: /wrangler deploy --dry-run/g,
    suggestion: 'Use `npm run check` (astro build && tsc) unless deploy validation is reintroduced in package.json.',
  },
  {
    regex: /wrangler dev/g,
    suggestion: 'Use `npm run preview` (astro preview) for local built-site preview.',
  },
  {
    regex: /platformProxy\.enabled/g,
    suggestion: 'Remove adapter-specific notes unless adapter config exists in astro.config.mjs.',
  },
  {
    regex: /Cloudflare Workers using/gi,
    suggestion: 'Use Cloudflare Pages terminology for this repo\'s current deployment model.',
=======
    suggestion: 'Use Cloudflare Pages + static Astro wording unless the adapter is intentionally added to astro.config.mjs.',
  },
  {
    regex: /wrangler deploy --dry-run/g,
    suggestion: 'Use package.json source-of-truth scripts (for example `npm run check`) unless this script is restored.',
  },
  {
    regex: /wrangler dev/g,
    suggestion: 'Use `npm run preview` for local built-site preview unless runtime emulation is intentionally introduced.',
  },
  {
    regex: /platformProxy\.enabled/g,
    suggestion: 'Remove adapter-specific wording unless adapter config exists in astro.config.mjs.',
  },
  {
    regex: /Cloudflare Workers using/gi,
    suggestion: 'Use Cloudflare Pages terminology for current deployment unless runtime changes are made.',
>>>>>>> theirs
  },
];

function lineNumberFromIndex(content, index) {
  return content.slice(0, index).split('\n').length;
}

function collectCommandRefs(content) {
  const refs = [];

<<<<<<< ours
  // Inline code references: `npm run <script>`
  const inlineRegex = /`npm\s+run\s+([A-Za-z0-9:_-]+)`/g;
  for (const match of content.matchAll(inlineRegex)) {
    refs.push({ script: match[1], index: match.index ?? 0, source: 'inline code' });
  }

  // Fenced shell blocks: ```bash ... npm run <script> ...```
=======
  // Inline code references.
  const inlineRegex = /`([^`]+)`/g;
  for (const match of content.matchAll(inlineRegex)) {
    const snippet = match[1] || '';
    refs.push(...collectCommandsFromSnippet(snippet, match.index ?? 0, 'inline code'));
  }

  // Fenced shell blocks.
>>>>>>> theirs
  const fenceRegex = /```(?:bash|sh|zsh|shell)?\s*\n([\s\S]*?)```/g;
  for (const fenceMatch of content.matchAll(fenceRegex)) {
    const fenceBody = fenceMatch[1] ?? '';
    const fenceStart = fenceMatch.index ?? 0;
<<<<<<< ours
    const scriptRegex = /\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g;
    for (const scriptMatch of fenceBody.matchAll(scriptRegex)) {
      refs.push({
        script: scriptMatch[1],
        index: fenceStart + (scriptMatch.index ?? 0),
        source: 'fenced shell block',
=======
    refs.push(...collectCommandsFromSnippet(fenceBody, fenceStart, 'fenced shell block'));
  }

  return refs;
}

function collectCommandsFromSnippet(snippet, offset, source) {
  const refs = [];
  const patterns = [
    { regex: /\bnpm\s+run\s+([A-Za-z0-9:._-]+)/g, kind: 'npm run' },
    { regex: /\bnpx\s+npm\s+run\s+([A-Za-z0-9:._-]+)/g, kind: 'npx npm run' },
    { regex: /\bpnpm\s+([A-Za-z0-9:._-]+)/g, kind: 'pnpm' },
    { regex: /\byarn\s+([A-Za-z0-9:._-]+)/g, kind: 'yarn' },
  ];

  for (const { regex, kind } of patterns) {
    for (const match of snippet.matchAll(regex)) {
      refs.push({
        script: match[1],
        index: offset + (match.index ?? 0),
        source,
        commandForm: kind,
>>>>>>> theirs
      });
    }
  }

  return refs;
}

const failures = [];

<<<<<<< ours
for (const file of authoritativeFiles) {
=======
if (discoveredDocs.length === 0) {
  failures.push({
    type: 'coverage',
    message: 'No documentation files discovered by docs-integrity scan patterns.',
  });
}

if (scannedDocs.length + (discoveredDocs.length - scannedDocs.length) !== discoveredDocs.length) {
  failures.push({
    type: 'coverage',
    message: 'Internal coverage accounting mismatch.',
  });
}

for (const file of scannedDocs) {
>>>>>>> theirs
  const content = fs.readFileSync(file, 'utf8');
  const refs = collectCommandRefs(content);

  for (const ref of refs) {
    if (!validScriptSet.has(ref.script)) {
      failures.push({
        type: 'invalid_script',
        file,
        line: lineNumberFromIndex(content, ref.index),
        script: ref.script,
        source: ref.source,
<<<<<<< ours
=======
        commandForm: ref.commandForm,
>>>>>>> theirs
      });
    }
  }
}

for (const file of deploymentTerminologyFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const forbidden of forbiddenDeploymentTerms) {
    const matches = [...content.matchAll(forbidden.regex)];
    for (const match of matches) {
      failures.push({
        type: 'forbidden_term',
        file,
        line: lineNumberFromIndex(content, match.index ?? 0),
        term: match[0],
        suggestion: forbidden.suggestion,
      });
    }
  }
}

<<<<<<< ours
if (failures.length > 0) {
  console.error('\n[docs-integrity] ❌ Validation failed.\n');
  for (const failure of failures) {
    if (failure.type === 'invalid_script') {
      console.error(
        `- File: ${failure.file}:${failure.line}\n` +
          `  Invalid script reference: npm run ${failure.script}\n` +
          `  Source: ${failure.source}\n` +
          `  Valid scripts: ${validScripts.join(', ')}\n`
      );
    } else if (failure.type === 'forbidden_term') {
      console.error(
        `- File: ${failure.file}:${failure.line}\n` +
          `  Forbidden deployment term found: ${failure.term}\n` +
          `  Use instead: ${failure.suggestion}\n`
      );
    }
  }

  console.error('[docs-integrity] Fix the above issues, then rerun: npm run docs:check\n');
  process.exit(1);
}

console.log('[docs-integrity] ✅ Script references and deployment terminology are valid.');
=======
const astroConfig = fs.readFileSync('astro.config.mjs', 'utf8');
if (!/output:\s*"static"/.test(astroConfig)) {
  failures.push({
    type: 'runtime_alignment',
    message: 'astro.config.mjs no longer uses output: "static". Update docs-integrity deployment expectations.',
  });
}

if (!deploymentTerminologyFiles.includes('README.md')) {
  failures.push({
    type: 'coverage',
    message: 'README.md must be part of deployment terminology checks.',
  });
}

if (failures.length > 0) {
  console.error('\n[docs-integrity] ❌ Validation failed.\n');

  for (const failure of failures) {
    if (failure.type === 'invalid_script') {
      const msg =
        `Invalid script reference: ${failure.commandForm} ${failure.script}. ` +
        `Valid scripts: ${validScripts.join(', ')}`;
      console.error(`- File: ${failure.file}:${failure.line}\n  ${msg}\n  Source: ${failure.source}\n`);
      console.error(`::error file=${failure.file},line=${failure.line}::${msg}`);
    } else if (failure.type === 'forbidden_term') {
      const msg = `Forbidden deployment term \"${failure.term}\". Use instead: ${failure.suggestion}`;
      console.error(`- File: ${failure.file}:${failure.line}\n  ${msg}\n`);
      console.error(`::error file=${failure.file},line=${failure.line}::${msg}`);
    } else {
      console.error(`- ${failure.message}`);
      console.error(`::error::${failure.message}`);
    }
  }

  const ignored = discoveredDocs.filter((file) => !scannedDocs.includes(file));
  if (ignored.length > 0) {
    console.error('[docs-integrity] Ignored script-validation docs (historical artifacts):');
    for (const file of ignored) console.error(`  - ${file}`);
  }

  console.error('\n[docs-integrity] Fix the above issues, then rerun: npm run docs:check\n');
  process.exit(1);
}

const ignored = discoveredDocs.filter((file) => !scannedDocs.includes(file));
if (ignored.length > 0) {
  console.log('[docs-integrity] ℹ️ Ignored script-validation docs (historical artifacts):');
  for (const file of ignored) console.log(`  - ${file}`);
}

console.log(`[docs-integrity] ✅ Script refs validated in ${scannedDocs.length} docs; deployment terms validated in ${deploymentTerminologyFiles.length} docs.`);
>>>>>>> theirs
NODE
