'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { useImprovements, type Improvement } from '@/lib/hooks'
import { AGENT_MAP, STATUS_COLORS } from '@/lib/constants'

const IMPACT_COLORS: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low: 'bg-white/[0.08] text-white/50',
}

const RISK_COLORS: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low: 'bg-emerald-500/15 text-emerald-400',
}

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  proposed: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  implemented: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400' },
}

type Filter = 'all' | 'proposed' | 'approved' | 'implemented' | 'rejected'

export default function ImprovementsPage() {
  const { improvements, loading, refresh } = useImprovements()
  const [filter, setFilter] = useState<Filter>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filtered = filter === 'all'
    ? improvements
    : improvements.filter(i => i.status === filter)

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id)
    try {
      await fetch('/api/improvements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          ...(status === 'approved' ? { approved_by: 'martin', approved_at: new Date().toISOString() } : {}),
          ...(status === 'implemented' ? { implemented_at: new Date().toISOString() } : {}),
        }),
      })
      refresh()
    } catch (err) {
      console.error('Action failed:', err)
    }
    setActionLoading(null)
  }

  const proposedCount = improvements.filter(i => i.status === 'proposed').length

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Improvements</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Self-improvement proposals from Amber
            {proposedCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">
                {proposedCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 w-fit mb-6">
        {(['all', 'proposed', 'approved', 'implemented', 'rejected'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              filter === f ? 'bg-white/[0.08] text-white/80' : 'text-white/30 hover:text-white/50'
            }`}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1 text-white/20">{improvements.filter(i => i.status === f).length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-12 text-center">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm">No improvements {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          <p className="text-white/15 text-xs mt-1">Amber generates proposals daily</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.proposal_id && (
                    <span className="text-white/20 text-[10px] font-mono">{item.proposal_id}</span>
                  )}
                  <h3 className="text-white font-medium text-sm">{item.title}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_MAP[item.status]?.bg || ''} ${STATUS_MAP[item.status]?.text || 'text-white/50'}`}>
                  {item.status}
                </span>
              </div>

              {item.description && (
                <p className="text-white/50 text-sm mb-3 leading-relaxed">{item.description}</p>
              )}

              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/25 text-[10px]">Impact:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${IMPACT_COLORS[item.impact] || IMPACT_COLORS.medium}`}>
                    {item.impact}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/25 text-[10px]">Risk:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_COLORS[item.risk] || RISK_COLORS.medium}`}>
                    {item.risk}
                  </span>
                </div>
                {item.owner && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/25 text-[10px]">Owner:</span>
                    <span className="text-white/50 text-[10px]">
                      {AGENT_MAP[item.owner]?.emoji} {AGENT_MAP[item.owner]?.name || item.owner}
                    </span>
                  </div>
                )}
                <span className="text-white/15 text-[10px]">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {item.outcome && (
                <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-emerald-400/60 text-[10px] uppercase tracking-wider font-medium mb-0.5">Outcome</p>
                  <p className="text-white/50 text-xs">{item.outcome}</p>
                </div>
              )}

              {/* Actions for proposed items */}
              {item.status === 'proposed' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'approved')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'rejected')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400/60 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {item.status === 'approved' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'implemented')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    Mark Implemented
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
