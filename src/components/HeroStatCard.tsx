'use client'
import { useEffect, useState } from 'react'

type NeonColor = 'green' | 'pink' | 'blue' | 'amber' | 'purple' | 'gray'

const COLOR_MAP: Record<NeonColor, {
  border: string
  bg: string
  text: string
  glow: string
  glowClass: string
}> = {
  green:  { border: 'border-neon-green/30',  bg: 'bg-neon-green/5',  text: 'text-neon-green',  glow: 'text-glow-green',  glowClass: 'glow-green' },
  pink:   { border: 'border-neon-pink/30',   bg: 'bg-neon-pink/5',   text: 'text-neon-pink',   glow: 'text-glow-pink',   glowClass: 'glow-pink' },
  blue:   { border: 'border-neon-blue/30',   bg: 'bg-neon-blue/5',   text: 'text-neon-blue',   glow: 'text-glow-blue',   glowClass: 'glow-blue' },
  amber:  { border: 'border-neon-amber/30',  bg: 'bg-neon-amber/5',  text: 'text-neon-amber',  glow: 'text-glow-amber',  glowClass: 'glow-amber' },
  purple: { border: 'border-neon-purple/30', bg: 'bg-neon-purple/5', text: 'text-neon-purple', glow: 'text-glow-purple', glowClass: 'glow-purple' },
  gray:   { border: 'border-white/10',       bg: 'bg-white/[0.02]',  text: 'text-white/50',    glow: '',                 glowClass: '' },
}

function AnimatedNumber({ value }: { value: number | string }) {
  const [display, setDisplay] = useState(0)
  const target = typeof value === 'number' ? value : parseInt(value) || 0

  useEffect(() => {
    if (typeof value !== 'number') { setDisplay(target); return }
    const start = 0
    const duration = 400
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (target - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, value])

  return <>{typeof value === 'number' ? display : value}</>
}

export function HeroStatCard({
  label,
  value,
  icon = '◉',
  color = 'green',
  suffix,
  href,
}: {
  label: string
  value: string | number
  icon?: string
  color?: NeonColor
  // legacy compat
  accentColor?: string
  suffix?: string
  href?: string
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.green

  const inner = (
    <div
      className={`
        arcade-card p-5 relative overflow-hidden
        ${c.border} ${c.bg}
        hover:${c.glowClass}
        transition-all duration-300 group
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-arcade text-[8px] text-white/30 uppercase tracking-widest">
          {label}
        </p>
        <span className="text-lg opacity-30 group-hover:opacity-50 transition-opacity">
          {icon}
        </span>
      </div>
      <p className={`font-arcade text-2xl ${c.text} ${c.glow} tracking-tight`}>
        <AnimatedNumber value={value} />
        {suffix && <span className="text-sm ml-1 opacity-60">{suffix}</span>}
      </p>
    </div>
  )

  if (href && href !== '#') {
    return <a href={href} className="block">{inner}</a>
  }
  return inner
}
