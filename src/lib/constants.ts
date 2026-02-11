const AVATAR_BASE = 'https://vogtsynqcrnwexxlrsec.supabase.co/storage/v1/object/public/avatars'

export interface AgentMeta {
  id: string
  name: string
  emoji: string
  role: string
  avatar: string
}

export const AGENTS: AgentMeta[] = [
  { id: 'main', name: 'Iris', emoji: '🫡', role: 'Chief of Staff', avatar: `${AVATAR_BASE}/iris.png` },
  { id: 'max', name: 'Max', emoji: '⚙️', role: 'Builder', avatar: `${AVATAR_BASE}/max.png` },
  { id: 'dash', name: 'Dash', emoji: '📣', role: 'Brand & Growth', avatar: `${AVATAR_BASE}/dash.png` },
  { id: 'atlas', name: 'Atlas', emoji: '🏢', role: 'Supliful Ops', avatar: `${AVATAR_BASE}/atlas.png` },
  { id: 'amber', name: 'Amber', emoji: '🔍', role: 'Operator', avatar: `${AVATAR_BASE}/amber.png` },
  { id: 'pixel', name: 'Pixel', emoji: '🎮', role: 'Creative', avatar: `${AVATAR_BASE}/pixel.png` },
]

// Non-agent owners that may appear in tasks
export const EXTRA_OWNERS: Record<string, { name: string; emoji: string; avatar?: string }> = {
  martin: { name: 'Martin', emoji: '👤' },
}

export const AGENT_MAP: Record<string, { name: string; emoji: string; role?: string; avatar?: string }> = {
  ...Object.fromEntries(AGENTS.map(a => [a.id, a])),
  ...EXTRA_OWNERS,
}

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
  { id: 'system', name: 'System', description: 'Infrastructure & operations', status: 'active', url: null },
  { id: 'pixel', name: 'Pixel', description: 'Creative projects', status: 'idle', url: null },
]

/** Format raw model string to friendly name */
export function formatModel(raw: string | null): string {
  if (!raw) return '—'
  if (raw.includes('opus-4-6') || raw.includes('opus-4')) return 'Opus 4.6'
  if (raw.includes('sonnet-4-5') || raw.includes('sonnet-4')) return 'Sonnet 4.5'
  if (raw.includes('haiku')) return 'Haiku'
  return raw.replace('anthropic/', '').replace('claude-', '')
}
