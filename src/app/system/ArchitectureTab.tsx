'use client'
import { useAgentStatus, deriveStatus } from '@/lib/hooks'
import { AGENTS, AGENT_COLORS } from '@/lib/constants'
import { AGENT_CAPABILITIES, SERVICES } from '@/lib/network-data'
import { SYSTEM_CONFIG } from '@/config/system'

const FOLDER_STRUCTURE = [
  { path: '~/.openclaw/', type: 'dir', depth: 0, desc: 'OpenClaw root' },
  { path: 'openclaw.json', type: 'file', depth: 1, desc: 'Main configuration' },
  { path: 'agents/', type: 'dir', depth: 1, desc: '' },
  { path: 'main/', type: 'dir', depth: 2, desc: 'Iris — Orchestrator' },
  { path: 'max/', type: 'dir', depth: 2, desc: 'Max — Builder' },
  { path: 'dash/', type: 'dir', depth: 2, desc: 'Dash — Brand & Growth' },
  { path: 'atlas/', type: 'dir', depth: 2, desc: 'Atlas — Ops' },
  { path: 'amber/', type: 'dir', depth: 2, desc: 'Amber — Research' },
  { path: 'workspace/', type: 'dir', depth: 1, desc: 'Iris workspace' },
  { path: 'SOUL.md, AGENTS.md, MEMORY.md ...', type: 'file', depth: 2, desc: 'Agent identity & memory' },
  { path: 'workspace-max/', type: 'dir', depth: 1, desc: 'Max workspace' },
  { path: 'workspace-dash/', type: 'dir', depth: 1, desc: 'Dash workspace' },
  { path: 'workspace-atlas/', type: 'dir', depth: 1, desc: 'Atlas workspace' },
  { path: 'workspace-amber/', type: 'dir', depth: 1, desc: 'Amber workspace' },
  { path: 'workspace-pixel/', type: 'dir', depth: 1, desc: 'Pixel workspace' },
  { path: 'shared/', type: 'dir', depth: 1, desc: 'Cross-agent shared directory' },
  { path: 'projects/', type: 'dir', depth: 2, desc: 'Mission folders (doit, supliful, mission-control, ...)' },
  { path: 'meta/', type: 'dir', depth: 2, desc: 'Operating docs (TEAM.md, WORKFLOW.md, TRACKER.md)' },
  { path: 'skills/', type: 'dir', depth: 1, desc: 'Installed skill packages' },
  { path: 'media/', type: 'dir', depth: 1, desc: 'Inbound/outbound media files' },
]

export default function ArchitectureTab() {
  const { statuses } = useAgentStatus()

  return (
    <div className="space-y-6">
      {/* Layered Architecture */}
      <div className="space-y-2">

        {/* Channel Layer */}
        <div className="arcade-card p-5">
          <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest mb-3">CHANNEL</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#00D4FF10', border: '1px solid #00D4FF20' }}>
              <span style={{ color: '#00D4FF' }} className="text-sm font-mono">Telegram</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#39FF1410', border: '1px solid #39FF1420' }}>
              <span style={{ color: '#39FF14' }} className="text-sm font-mono">WebChat</span>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center"><div className="w-px h-3 bg-neon-green/15" /></div>

        {/* Gateway Layer */}
        <div className="arcade-card p-5">
          <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest mb-2">GATEWAY</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neon-green text-sm font-mono">OpenClaw v{SYSTEM_CONFIG.version}</p>
              <p className="text-white/25 text-[10px] font-mono mt-0.5">gateway.dothework.fit:{SYSTEM_CONFIG.gatewayPort}</p>
            </div>
            <div className="text-right">
              <p className="text-white/25 text-[10px] font-mono">Host</p>
              <p className="text-white/40 text-[10px] font-mono">iris-gateway (DigitalOcean)</p>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center"><div className="w-px h-3 bg-neon-green/15" /></div>

        {/* Agents Layer */}
        <div className="arcade-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest">AGENTS</p>
            <p className="text-white/15 text-[9px] font-mono">{AGENTS.length} configured</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {AGENTS.map(agent => {
              const status = statuses.find(s => s.agent_id === agent.id)
              const derived = status ? deriveStatus(status) : 'offline'
              const color = AGENT_COLORS[agent.id]?.neon || '#888'
              const caps = AGENT_CAPABILITIES[agent.id]

              return (
                <div key={agent.id} className="p-3 rounded" style={{ backgroundColor: color + '08', border: `1px solid ${color}15` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{agent.emoji}</span>
                    <div>
                      <p className="font-arcade text-[8px]" style={{ color }}>{agent.name.toUpperCase()}</p>
                      <p className="text-white/20 text-[9px] font-mono">{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${derived === 'active' ? 'bg-neon-green animate-pulse' : derived === 'idle' ? 'bg-yellow-400' : 'bg-white/20'}`} />
                    <span className="text-[9px] font-mono text-white/30">{derived}</span>
                  </div>
                  {caps && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {caps.tools.slice(0, 3).map(t => (
                        <span key={t} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: color + '10', color: color + '70' }}>
                          {t}
                        </span>
                      ))}
                      {caps.tools.length > 3 && (
                        <span className="text-[8px] font-mono text-white/15">+{caps.tools.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center"><div className="w-px h-3 bg-neon-green/15" /></div>

        {/* Services Layer */}
        <div className="arcade-card p-5">
          <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest mb-3">SERVICES</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {SERVICES.map(svc => {
              const catColor = svc.category === 'infra' ? '#FFB800' : svc.category === 'api' ? '#00D4FF' : '#B24BF3'
              return (
                <div key={svc.id} className="p-3 rounded" style={{ backgroundColor: catColor + '06', border: `1px solid ${catColor}12` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{svc.icon}</span>
                    <span className="text-white/50 text-[10px] font-mono">{svc.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {svc.connectedAgents.map(aid => {
                      const a = AGENTS.find(a => a.id === aid)
                      return (
                        <span key={aid} className="text-[10px]" title={a?.name}>{a?.emoji}</span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Folder Structure */}
      <div className="arcade-card p-5">
        <h2 className="font-arcade text-[9px] text-white/30 mb-4 tracking-widest">FOLDER STRUCTURE</h2>
        <div className="font-mono text-[11px] space-y-0.5">
          {FOLDER_STRUCTURE.map((item, i) => {
            const indent = item.depth * 20
            const isDir = item.type === 'dir'
            return (
              <div key={i} className="flex items-baseline gap-2 py-0.5" style={{ paddingLeft: indent }}>
                <span className={isDir ? 'text-neon-green/40' : 'text-white/20'}>{isDir ? '/' : ''}</span>
                <span className={isDir ? 'text-neon-green/60 font-medium' : 'text-white/40'}>{item.path}</span>
                {item.desc && <span className="text-white/15 text-[9px] font-sans">{item.desc}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Version Footer */}
      <div className="text-center">
        <p className="text-white/10 text-[10px] font-mono">
          OpenClaw v{SYSTEM_CONFIG.version} · Node v22.22.0 · iris-gateway (DigitalOcean)
        </p>
      </div>
    </div>
  )
}
