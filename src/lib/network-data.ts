import { AGENTS } from './constants'

export interface AgentCapabilities {
  tools: string[]
  apis: string[]
  delegatesTo?: string[] // agent IDs this agent can delegate to
}

export const AGENT_CAPABILITIES: Record<string, AgentCapabilities> = {
  main: {
    tools: ['Web Search', 'Gmail', 'Calendar', 'Cron', 'Delegation'],
    apis: ['OpenClaw Gateway', 'Google Workspace', 'Brave Search'],
    delegatesTo: ['max', 'dash', 'atlas', 'amber', 'pixel'],
  },
  max: {
    tools: ['GitHub', 'Supabase', 'Claude Code', 'Expo', 'Vercel'],
    apis: ['GitHub', 'Supabase', 'Vercel', 'Cloudflare'],
  },
  dash: {
    tools: ['LinkedIn', 'X/Twitter', 'Web Search'],
    apis: ['LinkedIn API', 'xAI', 'Brave Search'],
  },
  atlas: {
    tools: ['Notion', 'Slack', 'Gmail', 'Web Search'],
    apis: ['Notion', 'Slack', 'Google Workspace', 'Brave Search'],
  },
  amber: {
    tools: ['Web Search', 'Tavily', 'DeepWiki', 'X Monitoring'],
    apis: ['Tavily', 'Brave Search', 'DeepWiki', 'xAI'],
  },
  pixel: {
    tools: ['Web Search', 'xAI Image/Video Gen'],
    apis: ['xAI', 'Brave Search'],
  },
}

export interface ServiceNode {
  id: string
  name: string
  icon: string
  category: 'infra' | 'api' | 'platform'
  connectedAgents: string[] // agent IDs
}

export const SERVICES: ServiceNode[] = [
  { id: 'supabase', name: 'Supabase', icon: '◆', category: 'infra', connectedAgents: ['max'] },
  { id: 'github', name: 'GitHub', icon: '◈', category: 'platform', connectedAgents: ['max'] },
  { id: 'vercel', name: 'Vercel', icon: '▲', category: 'infra', connectedAgents: ['max'] },
  { id: 'linkedin', name: 'LinkedIn', icon: '◉', category: 'api', connectedAgents: ['dash'] },
  { id: 'xai', name: 'xAI / Grok', icon: '✦', category: 'api', connectedAgents: ['dash', 'amber', 'pixel'] },
  { id: 'google', name: 'Google WS', icon: '◎', category: 'platform', connectedAgents: ['main', 'atlas'] },
  { id: 'notion', name: 'Notion', icon: '◻', category: 'platform', connectedAgents: ['atlas'] },
  { id: 'slack', name: 'Slack', icon: '◼', category: 'platform', connectedAgents: ['atlas'] },
  { id: 'telegram', name: 'Telegram', icon: '◇', category: 'platform', connectedAgents: ['main', 'max', 'dash', 'atlas', 'amber', 'pixel'] },
  { id: 'brave', name: 'Brave Search', icon: '◆', category: 'api', connectedAgents: ['main', 'amber', 'dash', 'pixel'] },
  { id: 'tavily', name: 'Tavily', icon: '◈', category: 'api', connectedAgents: ['amber'] },
  { id: 'cloudflare', name: 'Cloudflare', icon: '☁', category: 'infra', connectedAgents: ['max'] },
]

// Layout: Iris center, agents in ring, services in outer ring
export function generateNetworkLayout() {
  const centerX = 500
  const centerY = 350
  const agentRadius = 200
  const serviceRadius = 400

  // Agent nodes in a circle around Iris
  const agentNodes = AGENTS.map((agent, i) => {
    if (agent.id === 'main') {
      // Iris at center
      return {
        id: agent.id,
        type: 'agent' as const,
        position: { x: centerX - 60, y: centerY - 40 },
        data: { ...agent, isCenter: true },
      }
    }
    // Other agents in a ring (skip index 0 which is main)
    const angle = ((i - 1) / (AGENTS.length - 1)) * 2 * Math.PI - Math.PI / 2
    return {
      id: agent.id,
      type: 'agent' as const,
      position: {
        x: centerX + Math.cos(angle) * agentRadius - 60,
        y: centerY + Math.sin(angle) * agentRadius - 40,
      },
      data: { ...agent, isCenter: false },
    }
  })

  // Service nodes in outer ring
  const serviceNodes = SERVICES.map((service, i) => {
    const angle = (i / SERVICES.length) * 2 * Math.PI - Math.PI / 4
    return {
      id: `svc-${service.id}`,
      type: 'service' as const,
      position: {
        x: centerX + Math.cos(angle) * serviceRadius - 40,
        y: centerY + Math.sin(angle) * serviceRadius - 20,
      },
      data: service,
    }
  })

  // Edges: delegation lines from Iris to agents
  const delegationEdges = (AGENT_CAPABILITIES.main.delegatesTo || []).map(targetId => ({
    id: `delegate-${targetId}`,
    source: 'main',
    target: targetId,
    type: 'default',
    animated: true,
    style: { stroke: '#34D399', strokeWidth: 2, opacity: 0.6 },
    markerEnd: {
      type: 'arrowclosed' as const,
      color: 'rgba(52, 211, 153, 0.6)',
    },
  }))

  // Edges: agent to service connections
  const serviceEdges = SERVICES.flatMap(service =>
    service.connectedAgents.map(agentId => ({
      id: `svc-${agentId}-${service.id}`,
      source: agentId,
      target: `svc-${service.id}`,
      type: 'default',
      style: { stroke: '#ffffff', strokeWidth: 1, opacity: 0.15 },
      markerEnd: {
        type: 'arrowclosed' as const,
        color: 'rgba(255, 255, 255, 0.15)',
      },
    }))
  )

  return {
    nodes: [...agentNodes, ...serviceNodes],
    edges: [...delegationEdges, ...serviceEdges],
  }
}
