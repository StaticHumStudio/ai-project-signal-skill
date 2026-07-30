#!/usr/bin/env bash
#
# REFERENCE: this is the production automation that ran Signal as a daily
# pipeline (cron -> Claude CLI -> validate -> isolated worktree -> review PR).
# The portable, provider-agnostic version of the sourcing prompt is
# ../method/PROMPT.md, which runs a single pass by hand in any assistant.
# This script is kept as an example of how the automated loop was wired.
#
# Daily Signal sourcing via Claude Code CLI.
# After staging is written and validated, opens a review PR with the
# day's signals copied into site/content/published/.

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_DIR="${SIGNAL_REPO_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd -P)}"
LOG_FILE="${SIGNAL_LOG_FILE:-$REPO_DIR/signal-cron.log}"
LOCK_FILE="${SIGNAL_LOCK_FILE:-/tmp/signal-daily.lock}"
CLAUDE_BIN="${CLAUDE_BIN:-$HOME/.local/bin/claude}"
GH_BIN="${GH_BIN:-/usr/bin/gh}"
TODAY="$(date +%F)"
PROMPT_REL="reference/SKILL.md"
VALIDATOR_REL="reference/validate-staging.mjs"
STAGING_REL="site/content/staging/$TODAY.json"
PUBLISHED_REL="site/content/published/$TODAY.json"
BRANCH="signal/auto-$TODAY"
WORKTREE_DIR="${SIGNAL_WORKTREE_DIR:-/tmp/signal-pr-$TODAY}"

if [[ "${SIGNAL_CHECK_ONLY:-0}" == "1" ]]; then
  for path in "$PROMPT_REL" "$VALIDATOR_REL"; do
    if [[ ! -f "$REPO_DIR/$path" ]]; then
      echo "$path: MISSING"
      exit 1
    fi
    echo "$path: OK"
  done

  for path in "site/content/staging" "site/content/published"; do
    if [[ ! -d "$REPO_DIR/$path" ]]; then
      echo "$path: MISSING"
      exit 1
    fi
    echo "$path: OK"
  done
  exit 0
fi

mkdir -p "$(dirname "$LOG_FILE")"
exec >> "$LOG_FILE" 2>&1

echo "[$(date -Is)] Signal daily sourcing start"

exec 9> "$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date -Is)] Another Signal sourcing run is already active"
  exit 0
fi

cd "$REPO_DIR"
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

for bin in "$CLAUDE_BIN" "$GH_BIN"; do
  if [[ ! -x "$bin" ]]; then
    echo "[$(date -Is)] Required binary not found or not executable: $bin"
    exit 1
  fi
done

if [[ -e "$STAGING_REL" ]]; then
  echo "[$(date -Is)] Staging file already exists, reusing: $STAGING_REL"
else
  "$CLAUDE_BIN" -p "Execute the Signal Sourcing Task in $PROMPT_REL for today's date, $TODAY. Write one valid JSON array to $STAGING_REL with up to 10 high-quality demand signals. Do not pad with weak signals just to reach 10. Do not move the file to site/content/published. Do not run git add, git commit, git push, or any deploy step. Stop after the staging file is written and report the file path." --permission-mode auto
fi

# Validate the staging file in both the freshly-written and reuse cases.
# A partial Claude run or a bad hand-edit must not get promoted to published.
if [[ ! -s "$STAGING_REL" ]]; then
  echo "[$(date -Is)] Staging file missing or empty: $STAGING_REL"
  exit 1
fi

node "$VALIDATOR_REL" "$STAGING_REL"

echo "[$(date -Is)] Staging file validated: $STAGING_REL"

# Open a review PR with the day's signals.
# Worktree isolation keeps any in-progress edits in the main checkout out of the PR.

echo "[$(date -Is)] Preparing review PR on branch $BRANCH"

git fetch origin main

# Gate on PR existence, not branch existence. A prior run might have pushed
# the branch but failed before `gh pr create` returned; in that case we want
# the retry to open the missing PR against the existing remote branch.
EXISTING_PR="$("$GH_BIN" pr list --head "$BRANCH" --state open --json number --jq '.[0].number // empty' 2>/dev/null || true)"
if [[ -n "$EXISTING_PR" ]]; then
  echo "[$(date -Is)] PR #$EXISTING_PR already open for $BRANCH; nothing to do"
  exit 0
fi

if [[ -e "$WORKTREE_DIR" ]]; then
  echo "[$(date -Is)] Cleaning stale worktree at $WORKTREE_DIR"
  git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || rm -rf "$WORKTREE_DIR"
  git worktree prune
fi
git branch -D "$BRANCH" 2>/dev/null || true

REMOTE_BRANCH_EXISTS=0
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  REMOTE_BRANCH_EXISTS=1
fi

if [[ $REMOTE_BRANCH_EXISTS -eq 1 ]]; then
  echo "[$(date -Is)] Remote branch exists without open PR; opening PR for existing branch"
  git fetch origin "$BRANCH":"refs/remotes/origin/$BRANCH"
  git worktree add "$WORKTREE_DIR" "origin/$BRANCH"
else
  git worktree add -b "$BRANCH" "$WORKTREE_DIR" origin/main
  mkdir -p "$WORKTREE_DIR/site/content/published"
  cp "$STAGING_REL" "$WORKTREE_DIR/$PUBLISHED_REL"
  (
    cd "$WORKTREE_DIR"
    git add "$PUBLISHED_REL"
    git commit -m "Signal: $TODAY"
    git push -u origin "$BRANCH"
  )
fi

(
  cd "$WORKTREE_DIR"
  "$GH_BIN" pr create \
    --title "Signal: $TODAY" \
    --body "Automated daily signal sourcing for $TODAY.

Review the published file and merge to deploy to statichum.studio/signal.
Edit or drop weak signals before merging if needed." \
    --base main \
    --head "$BRANCH"
)

git worktree remove --force "$WORKTREE_DIR"
git worktree prune

echo "[$(date -Is)] Signal daily PR opened for $TODAY"
