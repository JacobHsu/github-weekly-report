import fs from 'fs'
import path from 'path'

// At build time, process.cwd() = dashboard/
// reports/ is one level up: github-weekly-report/reports/
const REPORTS_DIR = path.join(process.cwd(), '..', 'reports')

export type ReportFile = {
  name: string
  slug: string
}

export function getReportList(): ReportFile[] {
  if (!fs.existsSync(REPORTS_DIR)) return []

  return fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .map((name) => ({ name, slug: name.replace(/\.md$/, '') }))
    .sort((a, b) => b.slug.localeCompare(a.slug))
}

export function getReportContent(slug: string): string {
  if (!/^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(slug)) {
    throw new Error(`Invalid slug format: ${slug}`)
  }
  const filePath = path.join(REPORTS_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Report not found: ${slug}`)
  }
  return fs.readFileSync(filePath, 'utf-8')
}
