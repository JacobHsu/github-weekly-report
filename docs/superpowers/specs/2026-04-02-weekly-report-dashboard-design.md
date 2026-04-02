# Weekly Report Dashboard — Design Spec

**Date:** 2026-04-02
**Status:** Approved

---

## Overview

A Next.js web dashboard for browsing auto-generated weekly commit reports.
Reports are produced by the existing GitHub Actions workflow (see `SPEC.md`)
and stored in `reports/` of the same repository.
The dashboard is deployed on Vercel and rebuilt automatically each Monday
after a new report is committed.

---

## Goals

- Let the developer read each week's report in a clean web UI on Monday morning.
- Require zero manual work after initial setup.
- Stay visually consistent with GitHub Dark theme.

## Non-Goals

- Editing or deleting reports.
- Authentication / access control (personal tool, public or private repo).
- Real-time updates or live commit tracking.
- Charts, graphs, or analytics beyond per-report stats.

---

## Architecture

```
weekly-report/                  ← Next.js project (separate from shell-script repo)
├── app/
│   ├── layout.tsx              ← Global layout: header + GitHub Dark base styles
│   ├── page.tsx                ← Home: list of all reports
│   └── reports/
│       └── [slug]/
│           └── page.tsx        ← Single report view
├── lib/
│   ├── github.ts               ← GitHub Contents API access layer
│   └── markdown.ts             ← Markdown parsing + stats extraction
├── components/
│   ├── ReportCard.tsx          ← List item card (date range, commit count, repo count)
│   ├── ReportContent.tsx       ← Rendered report body
│   └── StatsBar.tsx            ← Summary bar: N commits · M repositories
├── .env.local                  ← GITHUB_TOKEN, REPO_OWNER, REPO_NAME
└── next.config.ts              ← output: 'export' for static generation
```

---

## Data Flow

### Build time (SSG)

1. `lib/github.ts` calls `GET /repos/{owner}/{repo}/contents/reports` to list all `.md` files.
2. For each file, fetch raw content via the `download_url`.
3. `lib/markdown.ts` parses each file to extract: week range, commit list, total commits, repo count.
4. Next.js generates static pages for `/` and `/reports/[slug]`.

### Weekly update

```
Every Monday ~02:00 UTC:
  GitHub Actions → generates report → commits to reports/
                 → calls Vercel Deploy Hook
                 → Vercel rebuilds static site
                 → dashboard updated within minutes
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Personal access token (read-only, `contents` scope) |
| `REPO_OWNER` | GitHub username owning the reports repo |
| `REPO_NAME` | Repository name (e.g. `github-weekly-report`) |
| `VERCEL_DEPLOY_HOOK` | Vercel deploy hook URL (set in GitHub Actions secrets) |

---

## Pages

### Home `/`

- Lists all reports in descending date order (newest first).
- Each `ReportCard` shows:
  - Week range: `2026-03-23 ~ 2026-03-29`
  - Summary: `12 commits · 4 repositories`
  - Arrow link to report page.

### Report `/reports/2026-03-23_2026-03-29`

- `StatsBar` at top: total commits + repo count for the week.
- Back link to home.
- `ReportContent` renders Markdown body:
  - Repo names as `h2` section headers.
  - Each commit: date · SHA (monospace, linked to GitHub) · message.

---

## UI Design

Follows **GitHub Dark** color system exactly:

| Token | Value | Usage |
|-------|-------|-------|
| `canvas-default` | `#0d1117` | Page background |
| `canvas-subtle` | `#161b22` | Card background |
| `border-default` | `#30363d` | Card / divider borders |
| `fg-default` | `#e6edf3` | Primary text |
| `fg-muted` | `#8b949e` | Secondary text (dates, counts) |
| `accent-fg` | `#58a6ff` | Links (repo names, SHAs) |
| `success-fg` | `#3fb950` | SHA highlight (monospace) |

Font: system default for body; monospace (`ui-monospace, SFMono-Regular, Menlo`) for SHAs.

---

## Tech Stack

| Tool | Version | Reason |
|------|---------|--------|
| Next.js | 15 (App Router) | SSG, file-based routing |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Utility-first, easy GitHub Dark tokens |
| ESLint | 9 | Code quality |

---

## Acceptance Criteria

- [ ] Home page lists all reports from `reports/` in descending order.
- [ ] Each report page renders Markdown content correctly.
- [ ] Stats (commit count, repo count) are accurate per report.
- [ ] SHA links open the correct GitHub commit URL.
- [ ] Repo name headers link to the GitHub repository.
- [ ] Vercel Deploy Hook is called by GitHub Actions after each report commit.
- [ ] Site rebuilds and serves the new report within 5 minutes of the hook call.
- [ ] UI matches GitHub Dark color system.
- [ ] Build passes with no TypeScript or ESLint errors.

---

## Out of Scope (Future)

- Search / filter across weeks.
- Dark/light mode toggle.
- Email or Slack notification when new report is available.
