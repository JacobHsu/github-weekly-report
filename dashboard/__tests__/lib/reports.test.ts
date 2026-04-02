import fs from 'fs'
import path from 'path'
import { getReportList, getReportContent } from '@/lib/reports'

jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

const SAMPLE_REPORT = `# Weekly Report: 2026-03-23 ~ 2026-03-29

Generated: 2026-03-30

## repo-name-1

- 2026-03-25 · abc1234 · feat: add login page

---
*Total: 1 commits across 1 repositories*
`

describe('getReportList', () => {
  it('returns sorted report files descending', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue([
      '2026-03-16_2026-03-22.md',
      '2026-03-23_2026-03-29.md',
      'README.md',
    ] as unknown as fs.Dirent[])

    const result = getReportList()

    expect(result).toHaveLength(2)
    expect(result[0].slug).toBe('2026-03-23_2026-03-29')
    expect(result[1].slug).toBe('2026-03-16_2026-03-22')
  })

  it('returns empty array when reports dir does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)
    expect(getReportList()).toEqual([])
  })
})

describe('getReportContent', () => {
  it('returns file content for valid slug', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(SAMPLE_REPORT as unknown as Buffer)

    const result = getReportContent('2026-03-23_2026-03-29')
    expect(result).toBe(SAMPLE_REPORT)
  })

  it('throws for invalid slug format', () => {
    expect(() => getReportContent('../etc/passwd')).toThrow('Invalid slug format')
  })

  it('throws when report file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)
    expect(() => getReportContent('2026-03-23_2026-03-29')).toThrow('Report not found')
  })
})
