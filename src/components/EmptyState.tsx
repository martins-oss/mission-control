export function EmptyState({ 
  icon = '◯', 
  title = 'No data', 
  description = '' 
}: {
  icon?: string
  title?: string
  description?: string
}) {
  return (
    <div className="
      bg-white/[0.03] backdrop-blur-sm
      rounded-2xl p-12 border border-white/[0.08]
      text-center
      shadow-lg shadow-black/20
    ">
      <div className="
        w-16 h-16 mx-auto mb-4
        rounded-2xl bg-white/5 border border-white/10
        flex items-center justify-center
        text-3xl text-white/20
      ">
        {icon}
      </div>
      <h3 className="text-white/70 font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-white/40 text-sm max-w-sm mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}

export function AgentCardSkeleton() {
  return (
    <div className="
      bg-white/[0.03] backdrop-blur-sm
      rounded-2xl p-6 border border-white/[0.08]
      animate-pulse
      shadow-lg shadow-black/20
    ">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-white/10 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-white/10 rounded w-32 mb-2" />
          <div className="h-4 bg-white/5 rounded w-24" />
        </div>
      </div>
      <div className="h-16 bg-white/5 rounded-lg" />
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="
      p-5 border-b border-white/[0.06]
      animate-pulse
    ">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  )
}
