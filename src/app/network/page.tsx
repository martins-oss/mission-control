'use client'
import dynamic from 'next/dynamic'
import AppShell from '@/components/AppShell'
import { AGENTS } from '@/lib/constants'
import { AGENT_CAPABILITIES, SERVICES } from '@/lib/network-data'

// Dynamic import to avoid SSR issues with ReactFlow
const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] rounded-xl border border-white/[0.06] bg-[#050505] flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading network...</p>
    </div>
  ),
})

export default function NetworkPage() {
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">Agent Network</h1>
          <p className="text-white/60 text-lg mt-2">System architecture and connections</p>
        </div>
      </div>

      {/* Network Graph */}
      <NetworkGraph />

      {/* Legend */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Agents */}
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] shadow-lg shadow-black/20">
          <h3 className="font-display text-white/60 text-xs uppercase tracking-wider font-semibold mb-4">Agents</h3>
          <div className="space-y-2">
            {AGENTS.map(a => (
              <div key={a.id} className="flex items-center gap-2">
                <img src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full" />
                <div>
                  <span className="text-white/70 text-xs font-medium">{a.name}</span>
                  <span className="text-white/30 text-[10px] ml-1.5">{a.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connections */}
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
          <h3 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Connection Types</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-emerald-400 rounded opacity-60" />
              <span className="text-white/50 text-xs">Delegation (animated)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-white/20 rounded" />
              <span className="text-white/50 text-xs">API / Service access</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Service Categories</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded border border-blue-500/30 bg-blue-500/10" />
                <span className="text-white/40 text-[10px]">Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded border border-purple-500/30 bg-purple-500/10" />
                <span className="text-white/40 text-[10px]">API Service</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded border border-white/10 bg-white/[0.03]" />
                <span className="text-white/40 text-[10px]">Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
          <h3 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">System Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Agents</span>
              <span className="text-white/70 text-xs font-medium">{AGENTS.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Services</span>
              <span className="text-white/70 text-xs font-medium">{SERVICES.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Total connections</span>
              <span className="text-white/70 text-xs font-medium">
                {SERVICES.reduce((sum, s) => sum + s.connectedAgents.length, 0) + (AGENT_CAPABILITIES.main.delegatesTo?.length || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Gateway</span>
              <span className="text-emerald-400/70 text-xs font-medium">gateway.dothework.fit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Host</span>
              <span className="text-white/50 text-xs font-mono">iris-gateway (DO VPS)</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
