'use client'
import { useState, Suspense } from 'react'
import AppShell from '@/components/AppShell'
import dynamic from 'next/dynamic'

// Dynamically import the LinkedIn content to avoid SSR issues
const LinkedInContent = dynamic(() => import('./LinkedInContent'), { ssr: false })

type Tab = 'linkedin' | 'x'

export default function SocialPage() {
  const [tab, setTab] = useState<Tab>('linkedin')

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">📣 SOCIAL</h1>
          <p className="text-white/30 text-xs font-mono">CONTENT PIPELINE · PUBLISHING · ANALYTICS</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-arcade-surface rounded-lg p-1 w-fit border border-arcade-border">
          <button
            onClick={() => setTab('linkedin')}
            className={`px-4 py-2 rounded text-[10px] font-mono transition-all ${
              tab === 'linkedin'
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'text-white/30 hover:text-white/50 border border-transparent'
            }`}
          >
            LINKEDIN
          </button>
          <button
            onClick={() => setTab('x')}
            className={`px-4 py-2 rounded text-[10px] font-mono transition-all ${
              tab === 'x'
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'text-white/30 hover:text-white/50 border border-transparent'
            }`}
          >
            X / TWITTER
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'linkedin' && (
          <Suspense fallback={<div className="arcade-card p-12 text-center"><p className="font-arcade text-[10px] text-white/20 loading-text">LOADING LINKEDIN</p></div>}>
            <LinkedInContent />
          </Suspense>
        )}

        {tab === 'x' && (
          <div className="arcade-card p-12 text-center border-dashed border-white/10">
            <p className="font-arcade text-[10px] text-white/20 mb-2">🚧 COMING SOON</p>
            <p className="text-white/10 text-xs font-mono">X / Twitter integration in development</p>
            <p className="text-white/10 text-xs font-mono mt-1">Dash monitors via xAI · Amber tracks mentions</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
