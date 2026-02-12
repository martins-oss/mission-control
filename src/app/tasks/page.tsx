'use client'
import AppShell from '@/components/AppShell'

export default function TasksPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-arcade text-sm text-neon-green text-glow-green">
            ⚡ MISSION SELECT
          </h1>
          <p className="text-white/30 text-xs mt-2 font-mono">
            TASK BOARD — IN PROGRESS • BLOCKED • BACKLOG • DONE
          </p>
        </div>
        <div className="arcade-card p-8 flex items-center justify-center min-h-[300px]">
          <p className="font-arcade text-[10px] text-white/20 loading-text">
            LOADING MISSIONS
          </p>
        </div>
      </div>
    </AppShell>
  )
}
