# Weekly Report Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Next.js dashboard deployed on Vercel that reads weekly commit reports from GitHub and displays them in a GitHub Dark–styled UI.

**Architecture:** SSG at build time via GitHub Contents API; Vercel rebuilds automatically when GitHub Actions calls a deploy hook after each new report commit. No server-side rendering or ISR needed — reports are generated once per week.

**Tech Stack:** Next.js 15 (App Router, `output: export`), TypeScript 5, Tailwind CSS 3, ESLint 9, Jest + React Testing Library

---

## File Map

| File | Responsibility |
|------|---------------|
| `weekly-report/app/layout.tsx` | Global HTML shell, GitHub Dark base styles, header |
| `weekly-report/app/page.tsx` | Home page — fetches report list, renders ReportCards |
| `weekly-report/app/reports/[slug]/page.tsx` | Report page — fetches single report, renders StatsBar + ReportContent |
| `weekly-report/lib/github.ts` | GitHub Contents API calls (fetchReportList, fetchReportContent) |
| `weekly-report/lib/markdown.ts` | Pure functions: extract stats from Markdown string |
| `weekly-report/components/StatsBar.tsx` | "N commits · M repositories" summary bar |
| `weekly-report/components/ReportCard.tsx` | List item card: week range + stats + link |
| `weekly-report/components/ReportContent.tsx` | Renders raw Markdown as styled HTML |
| `weekly-report/__tests__/lib/github.test.ts` | Unit tests for GitHub API layer (mocked fetch) |
| `weekly-report/__tests__/lib/markdown.test.ts` | Unit tests for Markdown parser |
| `weekly-report/__tests__/components/*.test.tsx` | Component render tests |
| `weekly-report/next.config.ts` | `output: 'export'` |
| `weekly-report/tailwind.config.ts` | GitHub Dark color tokens |
| `weekly-report/jest.config.ts` | Jest + next/jest config |
| `weekly-report/jest.setup.ts` | `@testing-library/jest-dom` import |
| `.github/workflows/weekly-report.yml` | Add Vercel Deploy Hook call after commit |

---

## Task 1: Project Initialization

**Files:**
- Create: `weekly-report/` (project root, sibling to this repo at `d:/11-vibi/`)
- Modify: `weekly-report/next.config.ts`
- Modify: `weekly-report/tailwind.config.ts`
- Create: `weekly-report/.env.local.example`

- [ ] **Step 1: Scaffold the project**

```bash
cd d:/11-vibi
npx create-next-app@latest weekly-report \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd weekly-report
```

Expected: project created with `app/`, `public/`, `package.json`, `tailwind.config.ts`, `next.config.ts`.

- [ ] **Step 2: Install testing dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @types/jest ts-jest
```

- [ ] **Step 3: Install react-markdown**

```bash
npm install react-markdown
```

- [ ] **Step 4: Configure next.config.ts for static export**

Replace the contents of `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
}

export default nextConfig
```

- [ ] **Step 5: Configure Tailwind with GitHub Dark color tokens**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gh-canvas':        '#0d1117',
        'gh-canvas-subtle': '#161b22',
        'gh-border':        '#30363d',
        'gh-fg':            '#e6edf3',
        'gh-fg-muted':      '#8b949e',
        'gh-accent':        '#58a6ff',
        'gh-success':       '#3fb950',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Create Jest config**

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create .env.local.example**

```bash
# .env.local.example
GITHUB_TOKEN=ghp_your_token_here
REPO_OWNER=your-github-username
REPO_NAME=github-weekly-report
```

Copy to `.env.local` and fill in real values (do not commit `.env.local`).

- [ ] **Step 8: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "jest",
"test:coverage": "jest --coverage"
```

- [ ] **Step 9: Verify setup**

```bash
npm run build
```

Expected: build succeeds, `out/` directory created.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js dashboard with Tailwind and Jest"
```

---

## Task 2: GitHub API Layer

**Files:**
- Create: `lib/github.ts`
- Create: `__tests__/lib/github.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/github.test.ts`:

```typescript
import { fetchReportList, fetchReportContent } from '@/lib/github'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => mockFetch.mockReset())

describe('fetchReportList', () => {
  it('returns sorted report files descending', async () => {
    process.env.REPO_OWNER = 'alice'
    process.env.REPO_NAME = 'github-weekly-report'
    process.env.GITHUB_TOKEN = 'tok'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: '2026-03-16_2026-03-22.md', download_url: 'https://raw.example/a' },
        { name: '2026-03-23_2026-03-29.md', download_url: 'https://raw.example/b' },
        { name: 'README.md',               download_url: 'https://raw.example/c' },
      ],
    })

    const result = await fetchReportList()

    expect(result).toHaveLength(2)
    expect(result[0].slug).toBe('2026-03-23_2026-03-29')
    expect(result[1].slug).toBe('2026-03-16_2026-03-22')
  })

  it('throws when GitHub API returns non-ok status', async () => {
    process.env.REPO_OWNER = 'alice'
    process.env.REPO_NAME = 'github-weekly-report'
    process.env.GITHUB_TOKEN = 'tok'

    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    await expect(fetchReportList()).rejects.toThrow('GitHub API error: 404')
  })
})

describe('fetchReportContent', () => {
  it('returns raw markdown string', async () => {
    process.env.REPO_OWNER = 'alice'
    process.env.REPO_NAME = 'github-weekly-report'
    process.env.GITHUB_TOKEN = 'tok'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '# Weekly Report: 2026-03-23 ~ 2026-03-29\n',
    })

    const result = await fetchReportContent('2026-03-23_2026-03-29')
    expect(result).toBe('# Weekly Report: 2026-03-23 ~ 2026-03-29\n')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/lib/github.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/github'`

- [ ] **Step 3: Implement lib/github.ts**

Create `lib/github.ts`:

```typescript
const GITHUB_API = 'https://api.github.com'

export type ReportFile = {
  name: string
  slug: string
  downloadUrl: string
}

export async function fetchReportList(): Promise<ReportFile[]> {
  const { REPO_OWNER, REPO_NAME, GITHUB_TOKEN } = process.env
  const res = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/reports`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

  const files = (await res.json()) as Array<{ name: string; download_url: string }>
  return files
    .filter((f) => f.name.endsWith('.md'))
    .map((f) => ({
      name: f.name,
      slug: f.name.replace('.md', ''),
      downloadUrl: f.download_url,
    }))
    .sort((a, b) => b.name.localeCompare(a.name))
}

export async function fetchReportContent(slug: string): Promise<string> {
  const { REPO_OWNER, REPO_NAME, GITHUB_TOKEN } = process.env
  const res = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/reports/${slug}.md`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.raw+json',
      },
    }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.text()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/github.test.ts
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add lib/github.ts __tests__/lib/github.test.ts
git commit -m "feat: add GitHub API layer"
```

---

## Task 3: Markdown Stats Parser

**Files:**
- Create: `lib/markdown.ts`
- Create: `__tests__/lib/markdown.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/markdown.test.ts`:

```typescript
import { extractStats } from '@/lib/markdown'

const sampleReport = `# Weekly Report: 2026-03-23 ~ 2026-03-29

Generated: 2026-03-30

## repo-name-1

- 2026-03-25 · abc1234 · feat: add login page
- 2026-03-27 · def5678 · fix: resolve null pointer on logout

## repo-name-2

- 2026-03-24 · 1a2b3c4 · chore: update dependencies

---
*Total: 3 commits across 2 repositories*
`

describe('extractStats', () => {
  it('extracts week range from title', () => {
    const stats = extractStats(sampleReport)
    expect(stats.weekRange).toBe('2026-03-23 ~ 2026-03-29')
  })

  it('extracts total commit count', () => {
    const stats = extractStats(sampleReport)
    expect(stats.totalCommits).toBe(3)
  })

  it('extracts repo count', () => {
    const stats = extractStats(sampleReport)
    expect(stats.repoCount).toBe(2)
  })

  it('returns zeros when summary line is missing', () => {
    const stats = extractStats('# Weekly Report: 2026-03-23 ~ 2026-03-29\n\nNo commits.')
    expect(stats.totalCommits).toBe(0)
    expect(stats.repoCount).toBe(0)
  })

  it('returns empty string when title line is missing', () => {
    const stats = extractStats('*Total: 5 commits across 3 repositories*')
    expect(stats.weekRange).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/lib/markdown.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/markdown'`

- [ ] **Step 3: Implement lib/markdown.ts**

Create `lib/markdown.ts`:

```typescript
export type ReportStats = {
  weekRange: string
  totalCommits: number
  repoCount: number
}

export function extractStats(markdown: string): ReportStats {
  const titleMatch = markdown.match(/^# Weekly Report:\s*(.+)$/m)
  const weekRange = titleMatch ? titleMatch[1].trim() : ''

  const summaryMatch = markdown.match(
    /\*Total:\s*(\d+)\s*commits?\s*across\s*(\d+)\s*repositor/i
  )
  const totalCommits = summaryMatch ? parseInt(summaryMatch[1], 10) : 0
  const repoCount = summaryMatch ? parseInt(summaryMatch[2], 10) : 0

  return { weekRange, totalCommits, repoCount }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/markdown.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add lib/markdown.ts __tests__/lib/markdown.test.ts
git commit -m "feat: add Markdown stats parser"
```

---

## Task 4: StatsBar Component

**Files:**
- Create: `components/StatsBar.tsx`
- Create: `__tests__/components/StatsBar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/StatsBar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import StatsBar from '@/components/StatsBar'

describe('StatsBar', () => {
  it('renders commit count and repo count', () => {
    render(<StatsBar totalCommits={12} repoCount={4} />)
    expect(screen.getByText(/12 commits/)).toBeInTheDocument()
    expect(screen.getByText(/4 repositories/)).toBeInTheDocument()
  })

  it('uses singular "commit" for count of 1', () => {
    render(<StatsBar totalCommits={1} repoCount={1} />)
    expect(screen.getByText(/1 commit\b/)).toBeInTheDocument()
    expect(screen.getByText(/1 repository/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/components/StatsBar.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/StatsBar'`

- [ ] **Step 3: Implement StatsBar**

Create `components/StatsBar.tsx`:

```typescript
type Props = {
  totalCommits: number
  repoCount: number
}

export default function StatsBar({ totalCommits, repoCount }: Props) {
  const commitLabel = totalCommits === 1 ? 'commit' : 'commits'
  const repoLabel = repoCount === 1 ? 'repository' : 'repositories'

  return (
    <div className="flex gap-4 text-sm text-gh-fg-muted">
      <span>{totalCommits} {commitLabel}</span>
      <span>·</span>
      <span>{repoCount} {repoLabel}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/StatsBar.test.tsx
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add components/StatsBar.tsx __tests__/components/StatsBar.test.tsx
git commit -m "feat: add StatsBar component"
```

---

## Task 5: ReportCard Component

**Files:**
- Create: `components/ReportCard.tsx`
- Create: `__tests__/components/ReportCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/ReportCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import ReportCard from '@/components/ReportCard'

describe('ReportCard', () => {
  const props = {
    slug: '2026-03-23_2026-03-29',
    weekRange: '2026-03-23 ~ 2026-03-29',
    totalCommits: 12,
    repoCount: 4,
  }

  it('renders the week range', () => {
    render(<ReportCard {...props} />)
    expect(screen.getByText('2026-03-23 ~ 2026-03-29')).toBeInTheDocument()
  })

  it('renders commit and repo stats', () => {
    render(<ReportCard {...props} />)
    expect(screen.getByText(/12 commits/)).toBeInTheDocument()
    expect(screen.getByText(/4 repositories/)).toBeInTheDocument()
  })

  it('links to the correct report page', () => {
    render(<ReportCard {...props} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/reports/2026-03-23_2026-03-29')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/components/ReportCard.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ReportCard'`

- [ ] **Step 3: Implement ReportCard**

Create `components/ReportCard.tsx`:

```typescript
import Link from 'next/link'
import StatsBar from './StatsBar'

type Props = {
  slug: string
  weekRange: string
  totalCommits: number
  repoCount: number
}

export default function ReportCard({ slug, weekRange, totalCommits, repoCount }: Props) {
  return (
    <Link
      href={`/reports/${slug}`}
      className="block p-4 rounded-md border border-gh-border bg-gh-canvas-subtle
                 hover:border-gh-accent transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gh-fg font-medium">{weekRange}</p>
          <div className="mt-1">
            <StatsBar totalCommits={totalCommits} repoCount={repoCount} />
          </div>
        </div>
        <span className="text-gh-fg-muted">→</span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/ReportCard.test.tsx
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add components/ReportCard.tsx __tests__/components/ReportCard.test.tsx
git commit -m "feat: add ReportCard component"
```

---

## Task 6: ReportContent Component

**Files:**
- Create: `components/ReportContent.tsx`
- Create: `__tests__/components/ReportContent.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/ReportContent.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import ReportContent from '@/components/ReportContent'

const markdown = `# Weekly Report: 2026-03-23 ~ 2026-03-29

Generated: 2026-03-30

## repo-name-1

- 2026-03-25 · abc1234 · feat: add login page

---
*Total: 1 commits across 1 repositories*
`

describe('ReportContent', () => {
  it('renders repo section heading', () => {
    render(<ReportContent markdown={markdown} />)
    expect(screen.getByRole('heading', { name: 'repo-name-1' })).toBeInTheDocument()
  })

  it('renders commit entry', () => {
    render(<ReportContent markdown={markdown} />)
    expect(screen.getByText(/feat: add login page/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/components/ReportContent.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ReportContent'`

- [ ] **Step 3: Implement ReportContent**

Create `components/ReportContent.tsx`:

```typescript
import ReactMarkdown from 'react-markdown'

type Props = {
  markdown: string
}

export default function ReportContent({ markdown }: Props) {
  return (
    <div className="prose-report">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold text-gh-fg mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gh-fg mt-6 mb-2 pb-1 border-b border-gh-border">
              {children}
            </h2>
          ),
          p: ({ children }) => (
            <p className="text-gh-fg-muted text-sm mb-2">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 mb-4">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gh-fg font-mono">{children}</li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-gh-accent hover:underline font-mono"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-gh-border my-4" />,
          em: ({ children }) => (
            <em className="text-gh-fg-muted not-italic text-sm">{children}</em>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/components/ReportContent.test.tsx
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add components/ReportContent.tsx __tests__/components/ReportContent.test.tsx
git commit -m "feat: add ReportContent component"
```

---

## Task 7: Global Layout

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update globals.css**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0d1117;
  color: #e6edf3;
}
```

- [ ] **Step 2: Implement layout.tsx**

Replace `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Weekly Report',
  description: 'GitHub weekly commit reports',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gh-canvas min-h-screen">
        <header className="border-b border-gh-border bg-gh-canvas-subtle">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <span className="text-gh-fg font-semibold">Weekly Report</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: add global layout with GitHub Dark theme"
```

---

## Task 8: Home Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement app/page.tsx**

Replace `app/page.tsx`:

```typescript
import { fetchReportList } from '@/lib/github'
import { fetchReportContent } from '@/lib/github'
import { extractStats } from '@/lib/markdown'
import ReportCard from '@/components/ReportCard'

export default async function HomePage() {
  const reports = await fetchReportList()

  const reportItems = await Promise.all(
    reports.map(async (report) => {
      const content = await fetchReportContent(report.slug)
      const stats = extractStats(content)
      return { ...report, ...stats }
    })
  )

  return (
    <div>
      <h1 className="text-xl font-semibold text-gh-fg mb-6">Reports</h1>
      {reportItems.length === 0 ? (
        <p className="text-gh-fg-muted">No reports yet.</p>
      ) : (
        <div className="space-y-3">
          {reportItems.map((item) => (
            <ReportCard
              key={item.slug}
              slug={item.slug}
              weekRange={item.weekRange}
              totalCommits={item.totalCommits}
              repoCount={item.repoCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds, `out/index.html` generated.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add home page with report list"
```

---

## Task 9: Report Page

**Files:**
- Create: `app/reports/[slug]/page.tsx`

- [ ] **Step 1: Implement the report page**

Create `app/reports/[slug]/page.tsx`:

```typescript
import Link from 'next/link'
import { fetchReportList, fetchReportContent } from '@/lib/github'
import { extractStats } from '@/lib/markdown'
import StatsBar from '@/components/StatsBar'
import ReportContent from '@/components/ReportContent'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const reports = await fetchReportList()
  return reports.map((r) => ({ slug: r.slug }))
}

export default async function ReportPage({ params }: Props) {
  const { slug } = await params
  const content = await fetchReportContent(slug)
  const { weekRange, totalCommits, repoCount } = extractStats(content)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gh-accent hover:underline text-sm">
          ← Back
        </Link>
        <span className="text-gh-fg-muted text-sm">/</span>
        <span className="text-gh-fg font-medium">{weekRange}</span>
      </div>
      <div className="mb-6 p-3 rounded-md border border-gh-border bg-gh-canvas-subtle">
        <StatsBar totalCommits={totalCommits} repoCount={repoCount} />
      </div>
      <ReportContent markdown={content} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds with static pages generated for each report slug.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/reports/
git commit -m "feat: add report detail page"
```

---

## Task 10: Vercel Deploy Hook

**Files:**
- Modify: `d:/11-vibi/github-weekly-report/.github/workflows/weekly-report.yml`

- [ ] **Step 1: Add VERCEL_DEPLOY_HOOK secret in GitHub**

Go to: `github.com/<your-username>/github-weekly-report` → Settings → Secrets and variables → Actions → New repository secret

- Name: `VERCEL_DEPLOY_HOOK`
- Value: your Vercel deploy hook URL (from Vercel project → Settings → Git → Deploy Hooks → create hook named `weekly-report`)

- [ ] **Step 2: Add deploy hook call to workflow**

Open `d:/11-vibi/github-weekly-report/.github/workflows/weekly-report.yml`.

After the `git push` step, add:

```yaml
      - name: Trigger Vercel rebuild
        if: env.HAS_COMMITS == 'true'
        run: curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
```

The `HAS_COMMITS` guard ensures Vercel only rebuilds when a new report was actually committed (no empty-week rebuilds). Adjust the condition variable name to match what the script already uses.

- [ ] **Step 3: Commit the workflow change**

```bash
cd d:/11-vibi/github-weekly-report
git add .github/workflows/weekly-report.yml
git commit -m "feat: trigger Vercel rebuild after weekly report commit"
```

- [ ] **Step 4: Deploy to Vercel**

```bash
cd d:/11-vibi/weekly-report
npx vercel --prod
```

Set environment variables in Vercel dashboard (Project → Settings → Environment Variables):
- `GITHUB_TOKEN`
- `REPO_OWNER`
- `REPO_NAME`

- [ ] **Step 5: Verify end-to-end**

1. Open the Vercel URL — home page should list existing reports.
2. Click a report — should render full Markdown content with stats.
3. Manually trigger the GitHub Actions workflow (`workflow_dispatch`) — confirm the Vercel deploy hook is called and the site rebuilds.

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|-------------|------|
| Report list in descending order | Task 8 |
| Stats per report (commits, repos) | Task 3 + 4 |
| Single report view with Markdown | Task 6 + 9 |
| SHA links to GitHub commits | Task 6 (ReportContent `<a>`) |
| Repo name headers | Task 6 (h2 renderer) |
| Vercel Deploy Hook after commit | Task 10 |
| Site rebuilds within 5 min | Task 10 |
| GitHub Dark UI | Task 4 + 5 + 6 + 7 |
| TypeScript + ESLint pass | Task 1 |

**No gaps found.**

**Type consistency check:**
- `ReportFile` (Task 2) → used in Task 8 and 9 ✓
- `ReportStats` (Task 3) → used in Task 4 (props), Task 8, Task 9 ✓
- `StatsBar` props: `totalCommits`, `repoCount` — consistent across Tasks 4, 5, 8, 9 ✓
- `ReportCard` props: `slug`, `weekRange`, `totalCommits`, `repoCount` — defined Task 5, used Task 8 ✓
