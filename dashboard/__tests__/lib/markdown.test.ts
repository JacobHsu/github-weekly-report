import { extractStats, parseReport } from '@/lib/markdown'

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

describe('parseReport', () => {
  it('parses repo names', () => {
    const result = parseReport(sampleReport)
    expect(result.repos).toHaveLength(2)
    expect(result.repos[0].name).toBe('repo-name-1')
    expect(result.repos[1].name).toBe('repo-name-2')
  })

  it('parses commits for each repo', () => {
    const result = parseReport(sampleReport)
    expect(result.repos[0].commits).toHaveLength(2)
    expect(result.repos[0].commits[0]).toEqual({
      date: '2026-03-25',
      sha: 'abc1234',
      message: 'feat: add login page',
    })
  })

  it('parses generated date', () => {
    const result = parseReport(sampleReport)
    expect(result.generatedDate).toBe('2026-03-30')
  })

  it('returns empty repos array when no sections', () => {
    const result = parseReport('# Weekly Report: 2026-03-23 ~ 2026-03-29\n')
    expect(result.repos).toEqual([])
  })
})
