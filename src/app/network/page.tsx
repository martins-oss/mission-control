'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import AppShell from '@/components/AppShell'
import { AGENTS } from '@/lib/constants'
import { AGENT_CAPABILITIES, SERVICES } from '@/lib/network-data'

interface FileNode {
  name: string
  type: 'file' | 'dir'
  size?: number
  children?: FileNode[]
  path: string
}

interface WorkspaceData {
  agentId: string
  tree: FileNode[]
  totalSize: number
  totalSizeFormatted: string
}

// Dynamic import to avoid SSR issues with ReactFlow
const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] rounded-xl border border-white/[0.06] bg-[#050505] flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading network...</p>
    </div>
  ),
})

function FileTree({ nodes, depth = 0 }: { nodes: FileNode[]; depth?: number }) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-0.5" style={{ paddingLeft: depth * 16 }}>
      {nodes.map((node, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 py-0.5">
            <span className="text-white/40 text-xs">
              {node.type === 'dir' ? '📁' : '📄'}
            </span>
            <span className={`text-xs ${node.type === 'dir' ? 'text-white/70 font-medium' : 'text-white/50'}`}>
              {node.name}
            </span>
            {node.type === 'file' && node.size !== undefined && (
              <span className="text-white/25 text-[10px] ml-auto">{formatBytes(node.size)}</span>
            )}
          </div>
          {node.children && node.children.length > 0 && (
            <FileTree nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NetworkPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)

  async function loadWorkspace(agentId: string) {
    setSelectedAgent(agentId)
    setWorkspaceLoading(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/workspace`)
      if (res.ok) {
        const data = await res.json()
        setWorkspaceData(data)
      } else {
        console.error('Failed to load workspace:', await res.text())
      }
    } catch (err) {
      console.error('Workspace fetch failed:', err)
    }
    setWorkspaceLoading(false)
  }

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

      {/* Workspace Viewer — TEMPORARILY DISABLED
          Issue: Vercel serverless functions can't access VPS filesystem
          Fix required: Create gateway API endpoint for workspace data
      */}
      {false && (
      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-white mb-6">Agent Workspaces</h2>
        
        {/* Agent Selector */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => loadWorkspace(agent.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                transition-all duration-300
                ${selectedAgent === agent.id
                  ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30 text-emerald-400'
                  : 'bg-white/[0.03] hover:bg-white/[0.05] text-white/60'}
              `}
            >
              <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full" />
              <span className="text-sm font-medium">{agent.name}</span>
            </button>
          ))}
        </div>

        {/* Workspace Display */}
        {workspaceLoading ? (
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-12 border border-white/[0.08] shadow-lg shadow-black/20 text-center">
            <p className="text-white/40 text-sm">Loading workspace...</p>
          </div>
        ) : workspaceData && workspaceData.agentId && workspaceData.tree ? (
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] shadow-lg shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold mb-1">
                  {AGENTS.find(a => a.id === workspaceData.agentId)?.name} Workspace
                </h3>
                <p className="text-white/40 text-xs font-mono">{workspaceData.agentId}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-sm font-semibold">{workspaceData.totalSizeFormatted}</p>
                <p className="text-white/40 text-xs">Total Size</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <FileTree nodes={workspaceData.tree} />
            </div>

            <p className="text-white/25 text-xs mt-4">
              ⚠️ Showing up to 3 levels deep. Hidden files and node_modules excluded.
            </p>
          </div>
        ) : selectedAgent ? (
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-12 border border-white/[0.08] shadow-lg shadow-black/20 text-center">
            <p className="text-white/30 text-sm">No workspace data</p>
          </div>
        ) : (
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-12 border border-white/[0.08] shadow-lg shadow-black/20 text-center">
            <p className="text-white/40 text-sm">Select an agent to view their workspace structure</p>
          </div>
        )}
      </div>
      )}
    </AppShell>
  )
}
