import { getReportList, getReportContent } from '@/lib/reports'
import { extractStats } from '@/lib/markdown'
import StatsBar from '@/components/StatsBar'
import ReportContent from '@/components/ReportContent'

export default function HomePage() {
  const reports = getReportList()

  if (reports.length === 0) {
    return <p className="text-gh-fg-muted">No reports yet.</p>
  }

  const latest = reports[0]
  const content = getReportContent(latest.slug)
  const { weekRange, totalCommits, repoCount } = extractStats(content)
  const ghUsername = process.env.GH_USERNAME ?? 'JacobHsu'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-gh-fg font-semibold">{weekRange}</h1>
        <StatsBar totalCommits={totalCommits} repoCount={repoCount} />
      </div>
      <ReportContent markdown={content} ghUsername={ghUsername} />
    </div>
  )
}
