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
  active:      { bg: 'bg-neon-green/15',  text: 'text-neon-green',  dot: 'bg-neon-green' },
  idle:        { bg: 'bg-neon-amber/15',  text: 'text-neon-amber',  dot: 'bg-neon-amber' },
  error:       { bg: 'bg-neon-pink/15',   text: 'text-neon-pink',   dot: 'bg-neon-pink' },
  offline:     { bg: 'bg-white/5',        text: 'text-white/40',    dot: 'bg-white/20' },
  in_progress: { bg: 'bg-neon-green/15',  text: 'text-neon-green',  dot: 'bg-neon-green' },
  backlog:     { bg: 'bg-white/5',        text: 'text-white/40',    dot: 'bg-white/20' },
  blocked:     { bg: 'bg-neon-pink/15',   text: 'text-neon-pink',   dot: 'bg-neon-pink' },
  waiting:     { bg: 'bg-neon-amber/15',  text: 'text-neon-amber',  dot: 'bg-neon-amber' },
  done:        { bg: 'bg-neon-green/15',  text: 'text-neon-green',  dot: 'bg-neon-green' },
}

/** Agent neon color mapping */
export const AGENT_COLORS: Record<string, { neon: string; glow: string; tw: string }> = {
  main:   { neon: '#B24BF3', glow: 'glow-purple',  tw: 'text-neon-purple' },
  max:    { neon: '#FFB800', glow: 'glow-amber',   tw: 'text-neon-amber' },
  dash:   { neon: '#FF2D7B', glow: 'glow-pink',    tw: 'text-neon-pink' },
  atlas:  { neon: '#00D4FF', glow: 'glow-blue',    tw: 'text-neon-blue' },
  amber:  { neon: '#39FF14', glow: 'glow-green',   tw: 'text-neon-green' },
  pixel:  { neon: '#FF6B6B', glow: 'glow-pink',    tw: 'text-neon-pink' },
}

export const PROJECTS = [
  { id: 'doit', name: 'DO IT', description: 'Fitness app at dothework.fit', status: 'active', url: 'https://dothework.fit' },
  { id: 'supliful', name: 'Supliful', description: 'Supplements business', status: 'active', url: null },
  { id: 'mission-control', name: 'Mission Control', description: 'This dashboard', status: 'active', url: 'https://mission.dothework.fit' },
  { id: 'system', name: 'System', description: 'Infrastructure & operations', status: 'active', url: null },
  { id: 'pixel', name: 'Pixel', description: 'Creative projects', status: 'idle', url: null },
]

/** Model pricing per 1M tokens (USD) */
export const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'claude-opus-4-6':                     { input: 15,   output: 75,   cacheRead: 1.5,  cacheWrite: 18.75 },
  'anthropic/claude-opus-4-6':           { input: 15,   output: 75,   cacheRead: 1.5,  cacheWrite: 18.75 },
  'claude-sonnet-4-5':                   { input: 3,    output: 15,   cacheRead: 0.3,  cacheWrite: 3.75 },
  'anthropic/claude-sonnet-4-5-20250929':{ input: 3,    output: 15,   cacheRead: 0.3,  cacheWrite: 3.75 },
  'claude-3-5-haiku':                    { input: 0.25, output: 1.25, cacheRead: 0.025, cacheWrite: 0.3125 },
}

export function getModelPricing(model: string) {
  if (MODEL_PRICING[model]) return MODEL_PRICING[model]
  if (model.includes('opus')) return MODEL_PRICING['claude-opus-4-6']
  if (model.includes('sonnet')) return MODEL_PRICING['claude-sonnet-4-5']
  if (model.includes('haiku')) return MODEL_PRICING['claude-3-5-haiku']
  return MODEL_PRICING['claude-sonnet-4-5'] // default
}

/** Format raw model string to friendly name */
export function formatModel(raw: string | null): string {
  if (!raw) return '—'
  if (raw.includes('opus-4-6') || raw.includes('opus-4')) return 'Opus 4.6'
  if (raw.includes('sonnet-4-5') || raw.includes('sonnet-4')) return 'Sonnet 4.5'
  if (raw.includes('haiku')) return 'Haiku'
  return raw.replace('anthropic/', '').replace('claude-', '')
}
