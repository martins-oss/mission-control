'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '◉' },
  { href: '/usage', label: 'Usage', icon: '◊' },
  { href: '/cron', label: 'Cron', icon: '⏰' },
  { href: '/improvements', label: 'Improvements', icon: '◆' },
  { href: '/network', label: 'Network', icon: '⬡' },
  { href: '/setup', label: 'Setup', icon: '⚙' },
  { href: '/linkedin', label: 'LinkedIn', icon: '◈' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth(true)
  const pathname = usePathname()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Top Nav */}
      <nav className="
        border-b border-white/[0.06] 
        bg-[#0A0A0A]/95 backdrop-blur-xl 
        sticky top-0 z-50
        shadow-2xl shadow-black/20
      ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <Link 
                href="/" 
                className="
                  font-display text-lg font-bold tracking-tight
                  bg-gradient-to-r from-white to-white/70
                  bg-clip-text text-transparent
                  hover:from-emerald-400 hover:to-emerald-300
                  transition-all duration-300
                "
              >
                Mission Control
              </Link>
              
              <div className="flex items-center gap-1">
                {NAV_ITEMS.map(item => {
                  const isActive = item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        relative px-4 py-2 rounded-lg 
                        text-sm font-medium
                        transition-all duration-300
                        ${isActive
                          ? 'text-emerald-400'
                          : 'text-white/50 hover:text-white/80'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span className="
                          absolute inset-0 
                          bg-emerald-500/10 rounded-lg 
                          ring-1 ring-emerald-500/30
                        " />
                      )}
                      
                      <span className="relative flex items-center gap-2">
                        <span className={`text-xs ${isActive ? 'scale-110' : ''} transition-transform`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/30 text-xs hidden sm:block">{user.email}</span>
              <button
                onClick={signOut}
                className="
                  px-3 py-1.5 rounded-lg
                  text-white/40 hover:text-white/60
                  text-xs font-medium
                  hover:bg-white/[0.04]
                  transition-all duration-300
                "
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </main>
  )
}
