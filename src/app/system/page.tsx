'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import dynamic from 'next/dynamic'

const ArchitectureTab = dynamic(() => import('./ArchitectureTab'), { ssr: false })
const AgentsTab = dynamic(() => import('./AgentsTab'), { ssr: false })
const SkillsTab = dynamic(() => import('./SkillsTab'), { ssr: false })
const CronTab = dynamic(() => import('./CronTab'), { ssr: false })
const IdeasTab = dynamic(() => import('./IdeasTab'), { ssr: false })

type Tab = 'architecture' | 'agents' | 'skills' | 'cron' | 'ideas'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'agents',       label: 'Agents',       icon: '👾' },
  { id: 'skills',       label: 'Skills',       icon: '🧩' },
  { id: 'cron',         label: 'Cron',         icon: '⏱️' },
  { id: 'ideas',        label: 'Ideas',        icon: '💡' },
]

export default function SystemPage() {
  const [tab, setTab] = useState<Tab>('agents')

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">🔧 SYSTEM</h1>
          <p className="text-white/30 text-xs font-mono">ARCHITECTURE · AGENTS · SKILLS · CRON · IDEAS</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-arcade-surface rounded-lg p-1 w-fit border border-arcade-border overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded text-[10px] font-mono transition-all whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.id
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'text-white/30 hover:text-white/50 border border-transparent'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'architecture' && <ArchitectureTab />}
        {tab === 'agents' && <AgentsTab />}
        {tab === 'skills' && <SkillsTab />}
        {tab === 'cron' && <CronTab />}
        {tab === 'ideas' && <IdeasTab />}
      </div>
    </AppShell>
  )
}
