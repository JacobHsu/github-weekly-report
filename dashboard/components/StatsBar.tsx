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
