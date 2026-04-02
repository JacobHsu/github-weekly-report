# GitHub Weekly Report

Automatically generates a personal weekly commit report every Monday and publishes it as a GitHub Pages dashboard.

## How It Works

```
Every Monday 02:00 UTC
  → GitHub Actions fetches all commits from the previous Mon–Sun
  → Saves report to reports/YYYY-MM-DD_YYYY-MM-DD.md
  → Deploys dashboard to GitHub Pages
```

## Dashboard

View at: `https://<your-username>.github.io/github-weekly-report/`

Shows the latest week's commits grouped by repository, styled like GitHub's commit history page.

## Setup

### 1. Fork or clone this repo

### 2. Enable GitHub Pages

Settings → Pages → Source → **GitHub Actions**

### 3. Create a Personal Access Token (PAT)

GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

Select scope: **`repo`** (includes private repos) or **`public_repo`** (public only)

Then add it as a repository secret:

Settings → Secrets and variables → Actions → New repository secret

| Name | Value |
|------|-------|
| `GH_PAT` | your token |

### 4. Set repository variable

Settings → Actions → Variables → New repository variable

| Name | Value |
|------|-------|
| `GH_USERNAME` | your GitHub username |

### 5. Run manually to verify

Actions → Weekly Report → Run workflow

The report and dashboard will be live within a few minutes.

## Project Structure

```
.github/
  workflows/
    weekly-report.yml       # Runs every Monday, generates report
    deploy-dashboard.yml    # Builds and deploys dashboard on push
scripts/
  generate-report.sh        # Fetches commits via GitHub API, writes Markdown
reports/
  YYYY-MM-DD_YYYY-MM-DD.md  # Weekly reports (auto-generated)
dashboard/                  # Next.js static site (GitHub Pages)
  app/
  components/
  lib/
SPEC.md                     # Full specification (English)
SPEC-zh.md                  # Full specification (Chinese)
```

## Report Format

```markdown
# Weekly Report: 2026-03-23 ~ 2026-03-29

Generated: 2026-03-30

## repo-name

- 2026-03-25 · abc1234 · feat: add login page

---
*Total: 3 commits across 2 repositories*
```

## Local Development

```bash
# Preview dashboard locally
cd dashboard
npm install
npm run dev
# → http://localhost:3000

# Run tests
npm test

# Generate a real report locally (requires GitHub token)
GH_USERNAME=your-username GITHUB_TOKEN=ghp_xxx bash scripts/generate-report.sh
```
