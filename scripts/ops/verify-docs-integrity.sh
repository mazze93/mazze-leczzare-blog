#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[docs-integrity] starting validation"

node <<'NODE'
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const validScripts = Object.keys(pkg.scripts || {}).sort();
const validScriptSet = new Set(validScripts);

const docsIntegrityConfig = {
  commandReferenceScan: {
    include: [
      '*.md',
      '.github/*.md',
      'docs/operations/AGENT_OPERATIONS_PROTOCOL.md',
      'docs/operations/memory/README.md',
    ],
    exclude: [
      'docs/operations/INSTRUCTION_CONFLICT_AUDIT.md',
    ],
  },
  deploymentTerminologyScan: {
    include: [
      '*.md',
      '.github/*.md',
      'docs/operations/AGENT_OPERATIONS_PROTOCOL.md',
      'docs/operations/memory/README.md',
    ],
    exclude: [
      '.github/pull_request_template.md',
      'docs/operations/INSTRUCTION_CONFLICT_AUDIT.md',
    ],
  },
};

const forbiddenDeploymentTerms = [
  {
    regex: /@astrojs\/cloudflare/g,
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
  },
];

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(pattern) {
  const segments = pattern.split('/').map((segment) => {
    if (segment === '**') {
      return '.*';
    }

    return escapeRegExp(segment).replace(/\*/g, '[^/]*');
  });

  return new RegExp(`^${segments.join('/')}$`);
}

function walkFiles(dir, rootDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, rootDir));
      continue;
    }

    files.push(path.relative(rootDir, fullPath).split(path.sep).join('/'));
  }

  return files;
}

function resolveScanFiles(scanConfig, allFiles, failures) {
  const includeMatchers = scanConfig.include.map((pattern) => ({
    pattern,
    regex: globToRegExp(pattern),
  }));
  const excludeMatchers = scanConfig.exclude.map((pattern) => ({
    pattern,
    regex: globToRegExp(pattern),
  }));

  const includeMatches = new Map();
  for (const matcher of includeMatchers) {
    const matches = allFiles.filter((file) => matcher.regex.test(file)).sort();
    if (matches.length === 0) {
      failures.push({
        type: 'scan_pattern_without_matches',
        pattern: matcher.pattern,
      });
    }
    includeMatches.set(matcher.pattern, matches);
  }

  const files = new Set();
  for (const matches of includeMatches.values()) {
    for (const file of matches) {
      const excluded = excludeMatchers.some((matcher) => matcher.regex.test(file));
      if (!excluded) {
        files.add(file);
      }
    }
  }

  return [...files].sort();
}

function lineNumberFromIndex(content, index) {
  return content.slice(0, index).split('\n').length;
}

function collectCommandRefs(content) {
  const refs = [];

  // Inline code references: `npm run <script>`
  const inlineRegex = /`npm\s+run\s+([A-Za-z0-9:_-]+)`/g;
  for (const match of content.matchAll(inlineRegex)) {
    refs.push({ script: match[1], index: match.index ?? 0, source: 'inline code' });
  }

  // Fenced shell blocks: ```bash ... npm run <script> ...```
  const fenceRegex = /```(?:bash|sh|zsh|shell)?\s*\n([\s\S]*?)```/g;
  for (const fenceMatch of content.matchAll(fenceRegex)) {
    const fenceBody = fenceMatch[1] ?? '';
    const fenceStart = fenceMatch.index ?? 0;
    const scriptRegex = /\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g;
    for (const scriptMatch of fenceBody.matchAll(scriptRegex)) {
      refs.push({
        script: scriptMatch[1],
        index: fenceStart + (scriptMatch.index ?? 0),
        source: 'fenced shell block',
      });
    }
  }

  return refs;
}

const failures = [];
const repoFiles = walkFiles('.');
const commandReferenceFiles = resolveScanFiles(
  docsIntegrityConfig.commandReferenceScan,
  repoFiles,
  failures
);
const deploymentTerminologyFiles = resolveScanFiles(
  docsIntegrityConfig.deploymentTerminologyScan,
  repoFiles,
  failures
);

for (const file of commandReferenceFiles) {
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

if (failures.length > 0) {
  console.error('\n[docs-integrity] ❌ Validation failed.\n');
  for (const failure of failures) {
    if (failure.type === 'scan_pattern_without_matches') {
      console.error(
        `- Scan config pattern matched no files: ${failure.pattern}\n` +
          '  Update docsIntegrityConfig in scripts/ops/verify-docs-integrity.sh\n'
      );
    } else if (failure.type === 'invalid_script') {
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
NODE
