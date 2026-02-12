export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, {
    bg: string; text: string; ring: string; dot: string; pulse: boolean
  }> = {
    active: {
      bg: 'bg-neon-green/10',
      text: 'text-neon-green',
      ring: 'ring-neon-green/30',
      dot: 'bg-neon-green',
      pulse: true,
    },
    idle: {
      bg: 'bg-neon-amber/10',
      text: 'text-neon-amber',
      ring: 'ring-neon-amber/20',
      dot: 'bg-neon-amber',
      pulse: false,
    },
    offline: {
      bg: 'bg-white/5',
      text: 'text-white/30',
      ring: 'ring-white/10',
      dot: 'bg-white/20',
      pulse: false,
    },
    error: {
      bg: 'bg-neon-pink/10',
      text: 'text-neon-pink',
      ring: 'ring-neon-pink/20',
      dot: 'bg-neon-pink',
      pulse: true,
    },
  }

  const config = configs[status] || configs.idle

  return (
    <span className={`
      inline-flex items-center gap-1.5
      px-2 py-0.5 rounded
      text-[10px] font-mono uppercase tracking-wider
      ${config.bg} ${config.text}
      ring-1 ${config.ring}
    `}>
      <span className={`
        w-1.5 h-1.5 rounded-full ${config.dot}
        ${config.pulse ? 'animate-pulse' : ''}
      `} />
      {status}
    </span>
  )
}
