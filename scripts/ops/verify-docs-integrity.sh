#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[docs-integrity] starting validation"

node <<'NODE'
const fs = require('fs');
const { execSync } = require('child_process');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const validScripts = Object.keys(pkg.scripts || {}).sort();
const validScriptSet = new Set(validScripts);

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

const forbiddenDeploymentTerms = [
  {
    regex: /@astrojs\/cloudflare/g,
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
  },
];

function lineNumberFromIndex(content, index) {
  return content.slice(0, index).split('\n').length;
}

function collectCommandRefs(content) {
  const refs = [];

  // Inline code references.
  const inlineRegex = /`([^`]+)`/g;
  for (const match of content.matchAll(inlineRegex)) {
    const snippet = match[1] || '';
    if (isCommandSnippet(snippet)) {
      refs.push(...collectCommandsFromSnippet(snippet, match.index ?? 0, 'inline code'));
    }
  }

  // Fenced shell blocks.
  const fenceRegex = /```(?:bash|sh|zsh|shell)?\s*\n([\s\S]*?)```/g;
  for (const fenceMatch of content.matchAll(fenceRegex)) {
    const fenceBody = fenceMatch[1] ?? '';
    const fenceStart = fenceMatch.index ?? 0;
    refs.push(...collectCommandsFromSnippet(fenceBody, fenceStart, 'fenced shell block'));
  }

  return refs;
}

function isCommandSnippet(snippet) {
  const normalized = snippet.trim();
  return /^(npm\s+run|npx\s+npm\s+run|pnpm\s+run|yarn(\s+run)?\s+)/.test(normalized);
}

function collectCommandsFromSnippet(snippet, offset, source) {
  const refs = [];
  const patterns = [
    { regex: /\bnpm\s+run\s+([A-Za-z0-9:._-]+)/g, kind: 'npm run' },
    { regex: /\bnpx\s+npm\s+run\s+([A-Za-z0-9:._-]+)/g, kind: 'npx npm run' },
    { regex: /\bpnpm\s+run\s+([A-Za-z0-9:._-]+)/g, kind: 'pnpm run' },
    { regex: /\byarn\s+run\s+([A-Za-z0-9:._-]+)/g, kind: 'yarn run' },
    { regex: /\byarn\s+([A-Za-z0-9:._-]+)/g, kind: 'yarn' },
  ];

  for (const { regex, kind } of patterns) {
    for (const match of snippet.matchAll(regex)) {
      refs.push({
        script: match[1],
        index: offset + (match.index ?? 0),
        source,
        commandForm: kind,
      });
    }
  }

  return refs;
}

const failures = [];

function findMergeMarkerIssues(content, file) {
  const markerRegex = /^(<{7}|={7}|>{7})(?: .+)?$/gm;
  const issues = [];
  for (const match of content.matchAll(markerRegex)) {
    issues.push({
      type: 'merge_marker',
      file,
      line: lineNumberFromIndex(content, match.index ?? 0),
      marker: match[0],
    });
  }
  return issues;
}

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
  const content = fs.readFileSync(file, 'utf8');
  failures.push(...findMergeMarkerIssues(content, file));
  const refs = collectCommandRefs(content);

  for (const ref of refs) {
    if (!validScriptSet.has(ref.script)) {
      failures.push({
        type: 'invalid_script',
        file,
        line: lineNumberFromIndex(content, ref.index),
        script: ref.script,
        source: ref.source,
        commandForm: ref.commandForm,
      });
    }
  }
}

const integrityScriptFile = 'scripts/ops/verify-docs-integrity.sh';
const integrityScriptContent = fs.readFileSync(integrityScriptFile, 'utf8');
failures.push(...findMergeMarkerIssues(integrityScriptContent, integrityScriptFile));

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
    } else if (failure.type === 'merge_marker') {
      const msg = `Merge conflict marker \"${failure.marker}\" found. Resolve conflict markers before rerunning docs checks.`;
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
NODE
