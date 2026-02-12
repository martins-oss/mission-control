export function StatusBadge({ status }: { status: string }) {
  const configs = {
    active: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/30',
      dot: 'bg-emerald-400',
      glow: 'shadow-emerald-500/50',
    },
    idle: {
      bg: 'bg-white/5',
      text: 'text-white/40',
      ring: 'ring-white/10',
      dot: 'bg-white/30',
      glow: '',
    },
    offline: {
      bg: 'bg-red-500/10',
      text: 'text-red-400/70',
      ring: 'ring-red-500/20',
      dot: 'bg-red-400/50',
      glow: '',
    },
  } as const
  
  const config = configs[status as keyof typeof configs] || configs.idle
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 
      px-3 py-1.5 rounded-full 
      text-xs font-semibold tracking-wide
      ${config.bg} ${config.text}
      ring-1 ${config.ring}
      transition-all duration-300
    `}>
      <span className={`
        relative w-2 h-2 rounded-full ${config.dot}
        ${status === 'active' ? 'animate-pulse' : ''}
        ${config.glow ? `shadow-sm ${config.glow}` : ''}
      `}>
        {status === 'active' && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        )}
      </span>
      {status}
    </span>
  )
}
