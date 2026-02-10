export interface AgentMeta {
  id: string
  name: string
  emoji: string
  role: string
}

export const AGENTS: AgentMeta[] = [
  { id: 'main', name: 'Iris', emoji: '🫡', role: 'Chief of Staff' },
  { id: 'max', name: 'Max', emoji: '⚙️', role: 'Builder' },
  { id: 'dash', name: 'Dash', emoji: '📣', role: 'Brand & Growth' },
  { id: 'atlas', name: 'Atlas', emoji: '🏢', role: 'Supliful Ops' },
  { id: 'amber', name: 'Amber', emoji: '🔍', role: 'Operator' },
  { id: 'pixel', name: 'Pixel', emoji: '🎮', role: 'Creative' },
]

export const AGENT_MAP = Object.fromEntries(AGENTS.map(a => [a.id, a]))

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  idle:        { bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  error:       { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400' },
  offline:     { bg: 'bg-white/5',        text: 'text-white/40',    dot: 'bg-white/20' },
  in_progress: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  backlog:     { bg: 'bg-white/5',        text: 'text-white/40',    dot: 'bg-white/20' },
  blocked:     { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400' },
  waiting:     { bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  done:        { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
}

export const PROJECTS = [
  { id: 'doit', name: 'DO IT', description: 'Fitness app at dothework.fit', status: 'active', url: 'https://dothework.fit' },
  { id: 'supliful', name: 'Supliful', description: 'Supplements business', status: 'active', url: null },
  { id: 'mission-control', name: 'Mission Control', description: 'This dashboard', status: 'active', url: 'https://mission.dothework.fit' },
  { id: 'pixel', name: 'Pixel', description: 'Creative projects', status: 'idle', url: null },
]
