'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '◉' },
  { href: '/usage', label: 'Usage', icon: '◊' },
  { href: '/improvements', label: 'Improvements', icon: '◆' },
  { href: '/network', label: 'Network', icon: '⬡' },
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
      <nav className="border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-white font-bold text-lg tracking-tight">
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
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="mr-1.5 text-xs">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/30 text-xs hidden sm:block">{user.email}</span>
              <button
                onClick={signOut}
                className="text-white/25 hover:text-white/50 text-xs transition-colors"
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
