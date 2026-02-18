# Repository Cleanup Plan

## Current State Analysis

### Overview
The repository has accumulated significant "overgrowth" with:
- **16 open issues** (many are duplicates)
- **5 open PRs** (several targeting non-main branches)
- **20 branches** (many stale copilot/* branches)
- Complex web of PRs targeting other PRs instead of main

### Main Branch Status
✅ **Main branch is healthy**
- Last commit: `5314397` (Merge PR #5)
- Build status: ✅ Successful (10 pages built)
- Test status: ✅ TypeScript passes

## Cleanup Actions Required

### Phase 1: Resolve Open Issues

#### Duplicate Copilot Instructions Issues
- **Issue #21**: "✨ Set up Copilot instructions"
  - **Action**: Close as resolved by PR #22
  - **Reason**: PR #22 already implements this

- **Issue #14**: "✨ Set up Copilot instructions for mazzeleczzare.com"
  - **Action**: Close as duplicate of #21, resolved by PR #22
  - **Reason**: Same goal, already addressed

### Phase 2: Consolidate Pull Requests

#### Ready to Merge
- **PR #22**: "Configure accurate Copilot instructions for static site deployment"
  - **Status**: Ready (mergeable, non-draft, targets main)
  - **Action**: ✅ MERGE to main
  - **Impact**: Resolves issues #14 and #21

#### Stale PRs Targeting Wrong Branches
These PRs target `mazze93-patch-2` or other non-main branches, creating tangled dependencies:

- **PR #25**: "Remove custom cursor feature for accessibility"
  - **Base**: `mazze93-patch-2` (not main)
  - **Status**: Draft, 0 file changes
  - **Action**: ❌ CLOSE (stale, wrong target)

- **PR #26**: "Remove redundant border-bottom from link styles"
  - **Base**: `mazze93-patch-2` (not main)
  - **Status**: Draft
  - **Action**: ❌ CLOSE (stale, wrong target)

- **PR #27**: "♿ Wrap all animations in prefers-reduced-motion media queries"
  - **Base**: `mazze93-patch-2` (not main)
  - **Status**: Draft
  - **Action**: ❌ CLOSE (stale, wrong target)

- **PR #29**: "Merge hanging branches into main branch"
  - **Base**: `copilot/sub-pr-9-again` (not main)
  - **Status**: Draft, circular dependency
  - **Action**: ❌ CLOSE (superseded by this PR #30)

- **PR #30**: This PR (clean up repository)
  - **Current Base**: `dependabot/npm_and_yarn/npm_and_yarn-89b1c9695e`
  - **Action**: ✅ UPDATE base to `main`
  - **Purpose**: Document and track the cleanup

### Phase 3: Branch Cleanup

#### Branches to Delete (After PR Closure)
All these branches can be safely deleted as they're either:
- Merged already
- Part of closed/stale PRs
- Not targeting main properly

**Stale Copilot Branches:**
- `copilot/fix-issue-in-blog-post`
- `copilot/fix-issue-in-mazze-leczzare-blog`
- `copilot/fix-issues-or-conflicts` (merged in main history)
- `copilot/fix-too-many-redirects` (merged in main history)
- `copilot/fix-typo-in-blog-post`
- `copilot/merge-hanging-branches` (PR #29)
- `copilot/set-up-copilot-instructions`
- `copilot/set-up-copilot-instructions-again`
- `copilot/sub-pr-9` (PR #25)
- `copilot/sub-pr-9-again` (base of PR #29)
- `copilot/sub-pr-9-another-one` (PR #26)
- `copilot/sub-pr-9-yet-again` (PR #27)
- `copilot/update-blog-post-content`
- `copilot/update-post-feature`

**Manual Patch Branches:**
- `mazze93-patch-1` (unclear purpose, likely stale)
- `mazze93-patch-2` (base of PRs #25-27, can delete after those close)

**Keep These Branches:**
- ✅ `main` (protected, source of truth)
- ✅ `copilot/setup-copilot-instructions` (PR #22, will be deleted after merge)
- ✅ `dependabot/npm_and_yarn/npm_and_yarn-89b1c9695e` (Dependabot PR base)
- ✅ `claude/clean-up-repository-and-resolve-issues` (this PR, delete after merge)

## Execution Steps

### Step 1: Merge PR #22 ✅
```bash
# User action required (cannot be done by agent)
# Navigate to PR #22 and click "Merge pull request"
```

### Step 2: Close Issues #14 and #21 ✅
```bash
# User action required (cannot be done by agent)
# Close with comment: "Resolved by PR #22"
```

### Step 3: Close Stale PRs #25-27, #29 ✅
```bash
# User action required (cannot be done by agent)
# Close each with comment: "Closing stale PR that targets non-main branch. Cleanup consolidated in PR #30."
```

### Step 4: Update PR #30 Base to Main ✅
```bash
# User action required (cannot be done by agent)
# Change base branch from 'dependabot/npm_and_yarn/npm_and_yarn-89b1c9695e' to 'main'
```

### Step 5: Delete Stale Branches 🗑️
```bash
# User action required (cannot be done by agent)
# After PRs are closed/merged, delete all branches listed in "Branches to Delete" section
# Can use GitHub UI or:
git push origin --delete <branch-name>
```

## Final State

After cleanup, the repository will have:
- ✅ All work consolidated on `main` branch
- ✅ No duplicate or conflicting issues
- ✅ No PRs targeting non-main branches
- ✅ Only active/necessary branches remaining
- ✅ Clean git history

## Summary

**Current Complexity:**
- 16 open issues → **Target: 0 open issues**
- 5 open PRs → **Target: 1 open PR (this one, then 0)**
- 20 branches → **Target: ~4 branches (main + active work)**

**Benefits:**
- Clear main branch as source of truth
- No tangled PR dependencies
- Easy to understand repository state
- Fresh start for future development

## Notes

The Copilot instructions file (`.github/copilot-instructions.md`) has some inaccuracies that were addressed in PR #22:
- ✅ Corrected deployment type (static pages, not Workers)
- ✅ Removed references to non-existent wrangler commands
- ✅ Aligned with actual `package.json` scripts

This cleanup aligns with the repository's goal of being a clean, maintainable Astro blog.
