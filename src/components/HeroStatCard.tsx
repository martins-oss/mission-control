export function HeroStatCard({ 
  label, 
  value, 
  icon = '◉',
  accentColor = 'emerald',
  href = '#',
}: {
  label: string
  value: string | number
  icon?: string
  accentColor?: 'emerald' | 'red' | 'blue' | 'gray'
  href?: string
}) {
  const colorMap = {
    emerald: {
      gradient: 'from-emerald-500/10 to-emerald-500/0',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
    },
    red: {
      gradient: 'from-red-500/10 to-red-500/0',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-red-500/20',
    },
    blue: {
      gradient: 'from-blue-500/10 to-blue-500/0',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
    gray: {
      gradient: 'from-white/5 to-white/0',
      border: 'border-white/10',
      text: 'text-white/50',
      glow: 'shadow-black/20',
    },
  }
  
  const colors = colorMap[accentColor]
  
  const Component = href ? 'a' : 'div'
  
  return (
    <Component
      href={href !== '#' ? href : undefined}
      className={`
        block group relative overflow-hidden
        bg-gradient-to-br ${colors.gradient}
        backdrop-blur-sm rounded-2xl p-6
        border ${colors.border}
        hover:scale-[1.02] transition-all duration-300
        ${colors.glow} shadow-lg
        ${href !== '#' ? 'cursor-pointer' : ''}
      `}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">
            {label}
          </p>
          <span className="text-2xl opacity-20 group-hover:opacity-30 transition-opacity">
            {icon}
          </span>
        </div>
        <p className={`font-display text-5xl font-bold ${colors.text} tracking-tight`}>
          {value}
        </p>
      </div>
      
      {/* Decorative gradient orb */}
      <div className={`
        absolute -right-8 -bottom-8 w-32 h-32 
        bg-gradient-to-br ${colors.gradient}
        rounded-full blur-2xl opacity-30
        group-hover:opacity-40 transition-opacity
      `} />
    </Component>
  )
}
