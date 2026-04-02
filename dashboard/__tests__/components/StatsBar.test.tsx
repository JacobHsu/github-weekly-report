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
