import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Weekly Report',
  description: 'GitHub weekly commit reports',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gh-canvas min-h-screen">
        <header className="border-b border-gh-border bg-gh-canvas-subtle">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <span className="text-gh-fg font-semibold">Weekly Report</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
