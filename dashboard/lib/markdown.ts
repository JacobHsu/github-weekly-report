export type ReportStats = {
  weekRange: string
  totalCommits: number
  repoCount: number
}

export type Commit = {
  date: string
  sha: string
  message: string
}

export type RepoSection = {
  name: string
  commits: Commit[]
}

export type ParsedReport = {
  weekRange: string
  generatedDate: string
  repos: RepoSection[]
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

export function parseReport(markdown: string): ParsedReport {
  const { weekRange, totalCommits, repoCount } = extractStats(markdown)

  const generatedMatch = markdown.match(/^Generated:\s*(.+)$/m)
  const generatedDate = generatedMatch ? generatedMatch[1].trim() : ''

  const repos: RepoSection[] = []
  const sections = markdown.split(/^## /m).slice(1)

  for (const section of sections) {
    const lines = section.trim().split('\n')
    const name = lines[0].trim()
    if (!name || name.startsWith('---')) continue

    const commits: Commit[] = []
    for (const line of lines.slice(1)) {
      const match = line.match(
        /^-\s+(\d{4}-\d{2}-\d{2})\s+·\s+([a-f0-9]{7})\s+·\s+(.+)$/
      )
      if (match) {
        commits.push({ date: match[1], sha: match[2], message: match[3].trim() })
      }
    }

    if (commits.length > 0) {
      repos.push({ name, commits })
    }
  }

  return { weekRange, generatedDate, repos, totalCommits, repoCount }
}
