import type { NextConfig } from 'next'

// On GitHub Actions the repo is deployed under /<repo-name>/
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
const basePath = isGitHubActions ? '/github-weekly-report' : ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
}

export default nextConfig
