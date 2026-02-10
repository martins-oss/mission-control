'use client'
import AppShell from '@/components/AppShell'

export default function NetworkPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-5xl mb-4">⬡</div>
        <h1 className="text-xl font-bold text-white mb-2">Agent Network</h1>
        <p className="text-white/30 text-sm max-w-md text-center">
          Interactive visualization of agent connections, tools, and infrastructure.
          Coming soon.
        </p>
      </div>
    </AppShell>
  )
}
