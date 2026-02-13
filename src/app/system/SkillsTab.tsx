'use client'
import { useState } from 'react'

import { AGENT_COLORS, AGENTS } from '@/lib/constants'

interface Skill {
  name: string
  description: string
  agents: string[] // agent ids that have this skill
  category: 'search' | 'code' | 'comms' | 'data' | 'ai' | 'utility'
  builtin?: boolean
}

const INSTALLED_SKILLS: Skill[] = [
  { name: 'github', description: 'Git ops, PRs, issues, CI runs via gh CLI', agents: ['main', 'max'], category: 'code', builtin: true },
  { name: 'brave-search', description: 'Web search via Brave Search API', agents: ['main', 'dash', 'atlas', 'amber', 'pixel'], category: 'search' },
  { name: 'claude-code-wingman', description: 'Dispatch coding tasks via tmux to Claude Code', agents: ['main', 'max'], category: 'code' },
  { name: 'deepwiki', description: 'Query GitHub repo docs via DeepWiki MCP', agents: ['max', 'amber'], category: 'data' },
  { name: 'gemini', description: 'Gemini CLI for code review & generation', agents: ['max'], category: 'ai' },
  { name: 'xai', description: 'Chat with Grok models via xAI API', agents: ['max'], category: 'ai' },
  { name: 'tavily', description: 'AI-optimized research search', agents: ['dash', 'atlas', 'amber'], category: 'search' },
  { name: 'web-search-plus', description: 'Multi-engine search with auto-routing', agents: ['amber'], category: 'search' },
  { name: 'supermemory', description: 'Store and retrieve memories via API', agents: ['dash', 'atlas', 'amber'], category: 'data' },
  { name: 'notion', description: 'Notion API for pages, databases, blocks', agents: ['main', 'atlas'], category: 'data', builtin: true },
  { name: 'linkedin', description: 'LinkedIn automation via browser/cookies', agents: ['dash'], category: 'comms' },
  { name: 'multi-format-content', description: 'Generate blog + email + video from topic', agents: ['dash'], category: 'comms' },
  { name: 'supabase-rls-gen', description: 'Generate Supabase RLS from Prisma schema', agents: ['max'], category: 'code' },
  { name: 'weather', description: 'Current weather and forecasts', agents: ['main', 'pixel'], category: 'utility', builtin: true },
]

const CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
  search:  { label: 'SEARCH',   color: '#00D4FF', icon: '🔍' },
  code:    { label: 'CODE',     color: '#FFB800', icon: '⌨️' },
  comms:   { label: 'COMMS',    color: '#FF2D7B', icon: '📡' },
  data:    { label: 'DATA',     color: '#B24BF3', icon: '💾' },
  ai:      { label: 'AI',       color: '#39FF14', icon: '🧠' },
  utility: { label: 'UTILITY',  color: '#888888', icon: '🔧' },
}

export default function SkillsTab() {
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all'
    ? INSTALLED_SKILLS
    : INSTALLED_SKILLS.filter(s => s.category === filter)

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
            🧩 INVENTORY
          </h1>
          <p className="text-white/30 text-xs font-mono">
            {INSTALLED_SKILLS.length} SKILLS EQUIPPED · 700+ AVAILABLE ON CLAWHUB
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`
              px-3 py-1.5 rounded text-[10px] font-mono transition-all
              ${filter === 'all'
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'text-white/30 hover:text-white/50 border border-transparent'
              }
            `}
          >
            ALL ({INSTALLED_SKILLS.length})
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = INSTALLED_SKILLS.filter(s => s.category === key).length
            if (count === 0) return null
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`
                  px-3 py-1.5 rounded text-[10px] font-mono transition-all whitespace-nowrap
                  ${filter === key
                    ? 'border'
                    : 'text-white/30 hover:text-white/50 border border-transparent'
                  }
                `}
                style={filter === key ? {
                  backgroundColor: cat.color + '10',
                  color: cat.color,
                  borderColor: cat.color + '30',
                } : undefined}
              >
                {cat.icon} {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(skill => {
            const cat = CATEGORIES[skill.category]
            return (
              <div
                key={skill.name}
                className="arcade-card p-4 hover:border-opacity-40 transition-all"
                style={{
                  borderColor: cat.color + '15',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    <h3 className="font-arcade text-[9px] text-white/70 tracking-wider">
                      {skill.name.toUpperCase()}
                    </h3>
                  </div>
                  {skill.builtin && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/20">
                      BUILTIN
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-white/30 text-[11px] font-mono mb-3 leading-relaxed">
                  {skill.description}
                </p>

                {/* Equipped By */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-white/15">EQUIPPED:</span>
                  {skill.agents.map(agentId => {
                    const agent = AGENTS.find(a => a.id === agentId)
                    const color = AGENT_COLORS[agentId]?.neon || '#888'
                    return (
                      <span
                        key={agentId}
                        className="text-[10px] font-mono px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: color + '10',
                          color: color + '90',
                        }}
                        title={agent?.name}
                      >
                        {agent?.emoji}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* ClaWHub CTA */}
        <div className="arcade-card p-6 text-center border-dashed border-neon-green/15">
          <p className="font-arcade text-[10px] text-neon-green/40 mb-2">
            WANT MORE SKILLS?
          </p>
          <p className="text-white/20 text-xs font-mono mb-3">
            Browse 700+ community skills on ClaWHub
          </p>
          <a
            href="https://clawhub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-block px-4 py-2 rounded
              bg-neon-green/10 text-neon-green text-[10px] font-mono
              border border-neon-green/20
              hover:bg-neon-green/20 transition-all
            "
          >
            BROWSE CLAWHUB →
          </a>
        </div>
      </div>
    </>
  )
}
