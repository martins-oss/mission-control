'use client'
import { useMemo, useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths,
} from 'date-fns'
import type { LinkedInPost } from '@/lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500',
  feedback_requested: 'bg-orange-500',
  approved: 'bg-blue-500',
  scheduled: 'bg-blue-400',
  posted: 'bg-emerald-500',
  failed: 'bg-red-500',
}

interface Props {
  posts: LinkedInPost[]
  onSelectPost?: (post: LinkedInPost) => void
}

export default function LinkedInCalendar({ posts, onSelectPost }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const postsByDate = useMemo(() => {
    const map: Record<string, LinkedInPost[]> = {}
    posts.forEach(post => {
      // Use scheduled_at, posted_at, or created_at for calendar placement
      const dateStr = post.scheduled_at || post.posted_at || post.created_at
      if (!dateStr) return
      const key = format(new Date(dateStr), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(post)
    })
    return map
  }, [posts])

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/50 hover:text-white text-sm transition-colors"
        >
          ←
        </button>
        <h3 className="text-white font-semibold text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/50 hover:text-white text-sm transition-colors"
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-white/30 text-[10px] uppercase tracking-wider font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const dayPosts = postsByDate[key] || []
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)

          return (
            <div
              key={key}
              className={`min-h-[80px] rounded-lg p-1.5 border transition-colors ${
                today
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : inMonth
                    ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                    : 'border-transparent bg-transparent'
              }`}
            >
              <span className={`text-[11px] font-medium ${
                today ? 'text-emerald-400' : inMonth ? 'text-white/50' : 'text-white/15'
              }`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayPosts.slice(0, 3).map(post => (
                  <button
                    key={post.id}
                    onClick={() => onSelectPost?.(post)}
                    className={`w-full text-left rounded px-1 py-0.5 text-[9px] leading-tight truncate transition-colors hover:opacity-80 ${
                      STATUS_COLORS[post.status] || 'bg-white/10'
                    } bg-opacity-20 text-white/70`}
                    style={{ backgroundColor: `color-mix(in srgb, ${getStatusHex(post.status)} 20%, transparent)` }}
                    title={post.content.slice(0, 100)}
                  >
                    {post.title || post.content.slice(0, 25)}
                  </button>
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-white/30 text-[9px]">+{dayPosts.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { status: 'draft', label: 'Draft' },
          { status: 'scheduled', label: 'Scheduled' },
          { status: 'posted', label: 'Posted' },
          { status: 'failed', label: 'Failed' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
            <span className="text-white/40 text-[10px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getStatusHex(status: string): string {
  const map: Record<string, string> = {
    draft: '#eab308',
    feedback_requested: '#f97316',
    approved: '#3b82f6',
    scheduled: '#60a5fa',
    posted: '#34d399',
    failed: '#ef4444',
  }
  return map[status] || '#ffffff'
}
