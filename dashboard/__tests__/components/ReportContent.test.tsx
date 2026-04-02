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
  it('renders repo name as a link', () => {
    render(<ReportContent markdown={markdown} ghUsername="jacobhsu" />)
    const repoLink = screen.getByRole('link', { name: 'repo-name-1' })
    expect(repoLink).toHaveAttribute('href', 'https://github.com/jacobhsu/repo-name-1')
  })

  it('renders commit message', () => {
    render(<ReportContent markdown={markdown} ghUsername="jacobhsu" />)
    expect(screen.getByText('feat: add login page')).toBeInTheDocument()
  })

  it('renders SHA as link to GitHub commit', () => {
    render(<ReportContent markdown={markdown} ghUsername="jacobhsu" />)
    const shaLink = screen.getByRole('link', { name: 'abc1234' })
    expect(shaLink).toHaveAttribute(
      'href',
      'https://github.com/jacobhsu/repo-name-1/commit/abc1234'
    )
  })

  it('renders commit date', () => {
    render(<ReportContent markdown={markdown} ghUsername="jacobhsu" />)
    expect(screen.getByText('2026-03-25')).toBeInTheDocument()
  })
})
