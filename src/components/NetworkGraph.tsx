'use client'
import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { generateNetworkLayout, AGENT_CAPABILITIES, type ServiceNode } from '@/lib/network-data'
import { useAgentStatus, deriveStatus } from '@/lib/hooks'
import { formatModel } from '@/lib/constants'
import type { AgentMeta } from '@/lib/constants'
import type { AgentStatus } from '@/lib/supabase'

// ─── Agent Node ─────────────────────────────────────────────

interface AgentNodeData extends AgentMeta {
  isCenter: boolean
}

function AgentNode({ data }: { data: AgentNodeData }) {
  const { statuses } = useAgentStatus()
  const agentStatus = statuses.find(s => s.agent_id === data.id)
  const status = agentStatus ? deriveStatus(agentStatus) : 'idle'

  const statusColor = status === 'active' ? '#34D399'
    : status === 'idle' ? '#FBBF24'
    : '#6B7280'

  const ringSize = data.isCenter ? 'w-20 h-20' : 'w-16 h-16'
  const imgSize = data.isCenter ? 'w-16 h-16' : 'w-12 h-12'

  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />

      {/* Avatar with status ring */}
      <div
        className={`${ringSize} rounded-full flex items-center justify-center transition-all duration-300`}
        style={{
          background: `radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)`,
          boxShadow: status === 'active' ? `0 0 20px ${statusColor}30, 0 0 40px ${statusColor}10` : 'none',
        }}
      >
        <div className="relative">
          <img
            src={data.avatar}
            alt={data.name}
            className={`${imgSize} rounded-full`}
            style={{
              border: `2px solid ${statusColor}`,
              boxShadow: `0 0 12px ${statusColor}40`,
            }}
          />
          {/* Status dot */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0A0A0A] ${
              status === 'active' ? 'animate-pulse' : ''
            }`}
            style={{ backgroundColor: statusColor }}
          />
        </div>
      </div>

      {/* Name + role */}
      <div className="mt-2 text-center">
        <p className="text-white font-semibold text-xs">{data.name}</p>
        <p className="text-white/30 text-[9px]">{data.role}</p>
        {agentStatus?.model && (
          <p className="text-white/20 text-[8px] font-mono">{formatModel(agentStatus.model)}</p>
        )}
      </div>

      {/* Hover tooltip with capabilities */}
      <div className="absolute top-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <AgentTooltip agentId={data.id} status={agentStatus} />
      </div>
    </div>
  )
}

function AgentTooltip({ agentId, status }: { agentId: string; status?: AgentStatus | null }) {
  const caps = AGENT_CAPABILITIES[agentId]
  if (!caps) return null

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 min-w-[180px] shadow-2xl">
      {status?.current_task && (
        <div className="mb-2 pb-2 border-b border-white/[0.06]">
          <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Current Task</p>
          <p className="text-emerald-400/80 text-[11px] leading-relaxed">{status.current_task}</p>
        </div>
      )}
      <div className="mb-2">
        <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1">Tools</p>
        <div className="flex flex-wrap gap-1">
          {caps.tools.map(t => (
            <span key={t} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 text-[9px]">{t}</span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1">APIs</p>
        <div className="flex flex-wrap gap-1">
          {caps.apis.map(a => (
            <span key={a} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/60 text-[9px]">{a}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Service Node ───────────────────────────────────────────

function ServiceNodeComponent({ data }: { data: ServiceNode }) {
  const categoryColor = data.category === 'infra' ? 'border-blue-500/30 bg-blue-500/5'
    : data.category === 'api' ? 'border-purple-500/30 bg-purple-500/5'
    : 'border-white/10 bg-white/[0.03]'

  return (
    <div className="flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />

      <div className={`w-10 h-10 rounded-lg border ${categoryColor} flex items-center justify-center text-lg`}>
        {data.icon}
      </div>
      <p className="text-white/40 text-[9px] mt-1 text-center font-medium">{data.name}</p>
    </div>
  )
}

// ─── Network Graph ──────────────────────────────────────────

const nodeTypes: NodeTypes = {
  agent: AgentNode as any,
  service: ServiceNodeComponent as any,
}

export default function NetworkGraph() {
  const layout = useMemo(() => generateNetworkLayout(), [])

  return (
    <div className="w-full h-[700px] rounded-xl border border-white/[0.06] overflow-hidden bg-[#050505]">
      <ReactFlow
        nodes={layout.nodes as Node[]}
        edges={layout.edges as Edge[]}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={true}
      >
        <Background color="#ffffff" gap={40} size={0.5} style={{ opacity: 0.03 }} />
        <Controls
          className="!bg-white/[0.06] !border-white/10 !rounded-lg [&>button]:!bg-white/[0.06] [&>button]:!border-white/10 [&>button]:!text-white/40 [&>button:hover]:!bg-white/10"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  )
}
