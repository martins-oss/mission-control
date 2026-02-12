export function EmptyState({
  icon = '◯',
  title = 'NO DATA',
  description = 'AWAITING TRANSMISSION',
}: {
  icon?: string
  title?: string
  description?: string
}) {
  return (
    <div className="arcade-card p-12 text-center">
      <div className="text-3xl mb-4 opacity-20">{icon}</div>
      <h3 className="font-arcade text-[10px] text-white/40 mb-2">{title}</h3>
      {description && (
        <p className="text-white/20 text-xs font-mono">{description}</p>
      )}
    </div>
  )
}

export function AgentCardSkeleton() {
  return (
    <div className="arcade-card p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-white/10 rounded" />
        <div className="flex-1">
          <div className="h-3 bg-white/10 rounded w-20 mb-1.5" />
          <div className="h-2 bg-white/5 rounded w-16" />
        </div>
      </div>
      <div className="health-bar">
        <div className="health-bar-fill bg-white/10 w-1/3" />
      </div>
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="p-4 border-b border-arcade-border animate-pulse">
      <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-2 bg-white/5 rounded w-1/2" />
    </div>
  )
}
