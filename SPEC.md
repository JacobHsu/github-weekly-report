# GitHub Weekly Report — Specification

**Date:** 2026-04-02
**Status:** Approved

---

## Overview

A GitHub Actions–based tool that automatically generates a personal weekly
Markdown report of all commits made across a user's GitHub account during
the previous calendar week (Monday–Sunday). The report is committed back
into the same repository under a `reports/` folder.

---

## Goals

- Give an individual developer a friction-free way to review what they
  shipped each week.
- Require zero manual intervention after initial setup.
- Keep the solution simple and dependency-free.

## Non-Goals

- Tracking PRs, Issues, Reviews, or Discussions.
- Multi-user or team reporting.
- External publishing (email, social media, dashboards).
- Visualisations or statistics beyond a flat commit list.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| 1 | Individual developer | A report generated automatically every week | I don't have to remember to run it |
| 2 | Individual developer | To see all my commits from the previous Mon–Sun | I can review exactly what I shipped last week |
| 3 | Individual developer | Each repo's commits listed with date and message | I can quickly scan what changed where |
| 4 | Individual developer | The report saved as a Markdown file in the repo | I can read it in GitHub or any Markdown viewer |
| 5 | Individual developer | Old reports preserved week over week | I can look back at any previous week |

---

## Functional Requirements

### Report Content

- **Scope:** All repositories owned by (or contributed to by) the
  authenticated GitHub user.
- **Time window:** The previous calendar week — Monday 00:00 UTC through
  Sunday 23:59 UTC.
- **Activity captured:** Git commits only (author matches the configured
  GitHub username).
- **Per-repo section:**
  - Repository name (with link to GitHub)
  - List of commits, each showing:
    - Date (YYYY-MM-DD)
    - Commit message (first line only)
    - Commit SHA (short, 7 chars, linked to GitHub)

### Report Format

```markdown
# Weekly Report: 2026-03-23 ~ 2026-03-29

Generated: 2026-03-30

## repo-name-1

- 2026-03-25 · abc1234 · feat: add login page
- 2026-03-27 · def5678 · fix: resolve null pointer on logout

## repo-name-2

- 2026-03-24 · 1a2b3c4 · chore: update dependencies

---
*Total: 3 commits across 2 repositories*
```

- If no commits exist for a repo in the week, that repo is omitted.
- A summary line at the bottom shows total commits and repo count.

### File Naming & Storage

- Path: `reports/YYYY-MM-DD_YYYY-MM-DD.md`
  - Example: `reports/2026-03-23_2026-03-29.md`
- Committed to the `main` branch of this repository by the Actions bot.
- Commit message: `chore: add weekly report YYYY-MM-DD ~ YYYY-MM-DD`

---

## Technical Design

### Implementation Choice

**Shell script + GitHub REST API via `curl`** (no external dependencies).

Rationale:
- GitHub Actions provides `curl` and `bash` natively.
- The data retrieval logic is simple enough for shell.
- Avoids `npm install` / `pip install` steps, keeping the workflow fast.

### Architecture

```
.github/
  workflows/
    weekly-report.yml     # Scheduled GitHub Actions workflow
scripts/
  generate-report.sh      # Core logic: fetch commits, build Markdown
reports/
  YYYY-MM-DD_YYYY-MM-DD.md  # Generated reports (one per week)
SPEC.md                   # This file
```

### GitHub Actions Workflow

- **Trigger:** `schedule` cron — every Monday at 02:00 UTC
  (`0 2 * * 1`)
- **Also supports:** `workflow_dispatch` for manual runs
- **Runner:** `ubuntu-latest`
- **Permissions:** `contents: write` (to commit the report)

### Script Logic (`generate-report.sh`)

1. Calculate the date range: last Monday → last Sunday (UTC).
2. Call `GET /users/{username}/repos` (paginated) to list all repos.
3. For each repo, call `GET /repos/{owner}/{repo}/commits` with
   `since` and `until` query params and `author` filter.
4. Collect results; skip repos with zero commits.
5. Render Markdown string and write to `reports/<filename>.md`.
6. `git add`, `git commit`, `git push`.

### Authentication

- Uses the built-in `GITHUB_TOKEN` secret provided by Actions.
- No additional secrets required for public repos.
- For private repos, the default `GITHUB_TOKEN` with `contents: write`
  is sufficient within the same user's account.

### Configuration (via workflow environment variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `GH_USERNAME` | (required) | GitHub username to filter commits by |
| `REPORT_BRANCH` | `main` | Branch to commit reports to |

`GH_USERNAME` is set as a repository variable (not a secret) in GitHub
Settings → Actions → Variables.

---

## Acceptance Criteria

- [ ] Workflow runs automatically every Monday at 02:00 UTC.
- [ ] Report covers exactly Mon 00:00 UTC – Sun 23:59 UTC of the prior week.
- [ ] All repos with at least one matching commit appear in the report.
- [ ] Each commit shows date, short SHA (linked), and first-line message.
- [ ] Repos with no commits in the period are excluded.
- [ ] Report file is committed to `reports/` with the correct filename.
- [ ] A manual `workflow_dispatch` trigger also works correctly.
- [ ] The workflow completes without errors on a week with zero commits
  (no empty file committed).

---

## Out of Scope (Future Considerations)

- PR / Issue / Review activity
- Email or Slack delivery
- Commit statistics or charts
- Organisation-level repo scanning
- Support for multiple GitHub accounts
