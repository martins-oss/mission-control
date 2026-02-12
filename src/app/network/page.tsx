'use client'
import AppShell from '@/components/AppShell'
import { AGENTS } from '@/lib/constants'
import { useAgentStatus } from '@/lib/hooks'
import { SYSTEM_CONFIG } from '@/config/system'

const SKILLS = [
  'github', 'gemini', 'xai', 'gog', 'notion', 'weather',
  'brave-search', 'tavily', 'deepwiki', 'linkedin', 'supermemory',
  'claude-code-wingman', 'multi-format-content', 'web-search-plus',
  'openclaw-auto-updater', 'supabase-schema-gen',
]

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
  { path: 'projects/', type: 'dir', depth: 2, desc: 'Project docs (doit, mission-control)' },
  { path: 'drafts/', type: 'dir', depth: 2, desc: 'Agent draft outputs' },
  { path: 'improvements/', type: 'dir', depth: 2, desc: 'Improvement proposals' },
  { path: 'skills/', type: 'dir', depth: 1, desc: 'Installed skill packages' },
  { path: 'media/', type: 'dir', depth: 1, desc: 'Inbound/outbound media files' },
]

export default function NetworkPage() {
  const { statuses, loading } = useAgentStatus()

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">System Architecture</h1>
        <p className="text-white/40 text-sm mt-0.5">
          OpenClaw multi-agent setup on DigitalOcean VPS
        </p>
      </div>

      {/* Layered Architecture */}
      <div className="space-y-3 mb-12">

        {/* Channel Layer */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Channel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="text-blue-400 text-sm">Telegram</span>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-px h-4 bg-white/10" />
        </div>

        {/* Gateway Layer */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Gateway</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">OpenClaw v{SYSTEM_CONFIG.version}</p>
              <p className="text-white/40 text-xs font-mono mt-0.5">gateway.dothework.fit:18789</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs">Host</p>
              <p className="text-white/60 text-xs font-mono">iris-gateway (DigitalOcean)</p>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-px h-4 bg-white/10" />
        </div>

        {/* Agents Layer */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Agents</p>
            <p className="text-white/30 text-[10px]">{AGENTS.length} active</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {AGENTS.map(agent => {
              const status = statuses.find(s => s.agent_id === agent.id)
              const model = status?.model?.includes('opus') ? 'Opus 4.6' :
                           status?.model?.includes('sonnet') ? 'Sonnet 4.5' :
                           status?.model || '—'
              
              return (
                <div
                  key={agent.id}
                  className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-white/80 text-sm font-medium leading-tight">{agent.name}</p>
                      <p className="text-white/30 text-[10px]">{agent.role}</p>
                    </div>
                  </div>
                  <p className="text-white/40 text-[10px] font-mono">{model}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-px h-4 bg-white/10" />
        </div>

        {/* Skills Layer */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Skills</p>
            <p className="text-white/30 text-[10px]">{SKILLS.length} installed</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(skill => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/50 text-[11px] font-mono"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-px h-4 bg-white/10" />
        </div>

        {/* Infrastructure Layer */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Infrastructure</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Supabase', desc: 'Database & Auth', color: 'emerald' },
              { name: 'Vercel', desc: 'Web Deployment', color: 'white' },
              { name: 'GitHub', desc: 'Source Control', color: 'purple' },
              { name: 'Cloudflare', desc: 'DNS & Tunnels', color: 'orange' },
            ].map(svc => (
              <div
                key={svc.name}
                className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <p className="text-white/70 text-sm font-medium">{svc.name}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Folder Structure */}
      <div>
        <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">
          Folder Structure
        </h2>
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 font-mono text-xs">
          <div className="space-y-0.5">
            {FOLDER_STRUCTURE.map((item, i) => {
              const indent = item.depth * 20
              const isDir = item.type === 'dir'
              
              return (
                <div
                  key={i}
                  className="flex items-baseline gap-2 py-0.5"
                  style={{ paddingLeft: indent }}
                >
                  <span className={isDir ? 'text-blue-400/60' : 'text-white/30'}>
                    {isDir ? '/' : ''}
                  </span>
                  <span className={`${isDir ? 'text-blue-400/80 font-medium' : 'text-white/50'}`}>
                    {item.path}
                  </span>
                  {item.desc && (
                    <span className="text-white/20 text-[10px] font-sans">
                      {item.desc}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="mt-6 text-center">
        <p className="text-white/20 text-xs">
          OpenClaw v{SYSTEM_CONFIG.version} · Node v22.22.0 · iris-gateway (DigitalOcean)
        </p>
      </div>
    </AppShell>
  )
}
