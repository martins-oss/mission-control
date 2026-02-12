'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { useAgentStatus } from '@/lib/hooks'
import { AGENTS } from '@/lib/constants'

export default function SetupPage() {
  const { statuses, loading } = useAgentStatus()

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">OpenClaw Setup Overview</h1>
        <p className="text-white/40 text-sm mt-0.5">
          Agent configuration, models, channels, and skills
        </p>
      </div>

      {/* Agents */}
      <div className="mb-8">
        <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">
          Agents <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">{AGENTS.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map(agent => {
            const status = statuses.find(s => s.agent_id === agent.id)
            
            return (
              <div
                key={agent.id}
                className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]"
              >
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">{agent.name}</h3>
                    <p className="text-white/40 text-xs">{agent.role}</p>
                  </div>
                </div>

                {status && (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Model</span>
                      <span className="text-white/70 font-mono">
                        {status.model?.includes('opus') ? 'Opus 4.6' : 
                         status.model?.includes('sonnet') ? 'Sonnet 4.5' : 
                         status.model || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Heartbeat</span>
                      <span className="text-white/70">{status.heartbeat_interval || '5m'}</span>
                    </div>
                    {status.current_task && (
                      <div className="pt-2 border-t border-white/[0.06]">
                        <p className="text-white/40 mb-1">Current Task</p>
                        <p className="text-white/60 text-xs leading-relaxed">{status.current_task}</p>
                      </div>
                    )}
                  </div>
                )}

                {!status && !loading && (
                  <p className="text-white/30 text-xs">No heartbeat data yet</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-8">
        <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Installed Skills</h2>
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'github', 'supabase-schema-gen', 'claude-code-wingman', 'deepwiki',
              'gemini', 'xai', 'gog', 'notion', 'weather', 'brave-search',
              'tavily', 'linkedin', 'supermemory', 'multi-format-content',
              'openclaw-auto-updater', 'web-search-plus'
            ].map(skill => (
              <div
                key={skill}
                className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/60 text-xs font-mono"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Gateway</h2>
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/40">URL</span>
              <span className="text-white/70 font-mono">gateway.dothework.fit</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Port</span>
              <span className="text-white/70">18789</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Protocol</span>
              <span className="text-white/70">HTTPS (Cloudflare Tunnel)</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Channels</h2>
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-white/70">Telegram</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-white/70">Webchat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/20">○</span>
              <span className="text-white/30">iMessage (Mac only)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="mt-6 text-center">
        <p className="text-white/25 text-xs">
          OpenClaw v2026.2.6-3 • VPS: iris-gateway (DigitalOcean) • Node v22.22.0
        </p>
      </div>
    </AppShell>
  )
}
