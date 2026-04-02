import { parseReport } from '@/lib/markdown'

type Props = {
  markdown: string
  ghUsername: string
}

export default function ReportContent({ markdown, ghUsername }: Props) {
  const { repos } = parseReport(markdown)

  if (repos.length === 0) {
    return <p className="text-gh-fg-muted text-sm">No commits found.</p>
  }

  return (
    <div className="space-y-4">
      {repos.map((repo) => (
        <div
          key={repo.name}
          className="border border-gh-border rounded-md overflow-hidden"
        >
          {/* Repo header */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gh-canvas-subtle border-b border-gh-border">
            <svg
              className="text-gh-fg-muted shrink-0"
              width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
              aria-hidden="true"
            >
              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z" />
            </svg>
            <a
              href={`https://github.com/${ghUsername}/${repo.name}`}
              className="text-gh-fg text-sm font-semibold hover:text-gh-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {repo.name}
            </a>
            <span className="ml-auto text-gh-fg-muted text-xs">
              {repo.commits.length} {repo.commits.length === 1 ? 'commit' : 'commits'}
            </span>
          </div>

          {/* Commit rows */}
          <div>
            {repo.commits.map((commit) => (
              <div
                key={commit.sha}
                className="flex items-center justify-between px-4 py-3 border-b border-gh-border last:border-b-0 hover:bg-gh-canvas-subtle"
              >
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-gh-fg text-sm font-medium truncate">
                    {commit.message}
                  </p>
                  <p className="text-gh-fg-muted text-xs mt-0.5">
                    {commit.date}
                  </p>
                </div>
                <a
                  href={`https://github.com/${ghUsername}/${repo.name}/commit/${commit.sha}`}
                  className="font-mono text-xs px-2 py-1 border border-gh-border rounded text-gh-fg-muted hover:text-gh-fg hover:border-gh-fg-muted whitespace-nowrap shrink-0 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {commit.sha}
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
