'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/',          label: 'HQ',       icon: '🕹️' },
  { href: '/agents',    label: 'Agents',   icon: '👾' },
  { href: '/usage',     label: 'Usage',    icon: '📊' },
  { href: '/tasks',     label: 'Tasks',    icon: '⚡' },
  { href: '/cron',      label: 'Cron',     icon: '🔧' },
  { href: '/ideas',     label: 'Ideas',    icon: '💡' },
  { href: '/skills',    label: 'Skills',   icon: '🧩' },
  { href: '/linkedin',  label: 'LinkedIn', icon: '📣' },
]

function SystemClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      }) + ' UTC')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-arcade text-[9px] text-neon-green/60 tracking-wider">{time}</span>
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth(true)
  const pathname = usePathname()

  if (loading) {
    return (
      <main className="min-h-screen bg-arcade-black flex items-center justify-center">
        <div className="font-arcade text-xs text-neon-green/60 loading-text">
          LOADING MISSION CONTROL
        </div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-arcade-black">
      {/* ── Top Nav ── */}
      <nav className="
        border-b border-neon-green/10
        bg-arcade-black/95 backdrop-blur-xl
        sticky top-0 z-50
      ">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Nav */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="
                  font-arcade text-[10px] tracking-wider
                  text-neon-green text-glow-green
                  hover:brightness-125
                  transition-all duration-300
                "
              >
                MISSION CONTROL
              </Link>

              <div className="flex items-center gap-0.5">
                {NAV_ITEMS.map(item => {
                  const isActive = item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        relative px-3 py-1.5 rounded
                        font-mono text-xs
                        transition-all duration-200
                        ${isActive
                          ? 'text-neon-green bg-neon-green/10 border border-neon-green/20'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border border-transparent'
                        }
                      `}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[11px]">{item.icon}</span>
                        <span className="hidden lg:inline">{item.label}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right: clock + user */}
            <div className="flex items-center gap-4">
              <SystemClock />
              <div className="w-px h-4 bg-white/10" />
              <span className="text-white/20 text-[10px] font-mono hidden sm:block">
                {user.email?.split('@')[0]}
              </span>
              <button
                onClick={signOut}
                className="
                  px-2 py-1 rounded
                  text-white/30 hover:text-neon-pink/80
                  text-[10px] font-mono
                  hover:bg-neon-pink/10
                  transition-all duration-200
                  border border-transparent hover:border-neon-pink/20
                "
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Status Bar ── */}
      <div className="border-b border-arcade-border bg-arcade-surface/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center h-7 gap-4 text-[10px] font-mono text-white/25 overflow-x-auto">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-glow-pulse" />
              SYSTEM ONLINE
            </span>
            <span className="text-white/10">|</span>
            <span>GATEWAY: iris-gateway</span>
            <span className="text-white/10">|</span>
            <span>MODEL: OPUS 4.6</span>
            <span className="text-white/10">|</span>
            <span>AGENTS: 6</span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 animate-fade-in">
        {children}
      </div>
    </main>
  )
}
