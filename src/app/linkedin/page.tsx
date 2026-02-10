'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { useLinkedInPosts, useLinkedInAuth } from '@/lib/hooks'
import { AGENT_MAP } from '@/lib/constants'
import type { LinkedInPost } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

const LI_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:              { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  feedback_requested: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  approved:           { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  scheduled:          { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  posted:             { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  failed:             { bg: 'bg-red-500/15',     text: 'text-red-400' },
}

function PostStatusBadge({ status }: { status: string }) {
  const c = LI_STATUS_COLORS[status] || LI_STATUS_COLORS.draft
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function LinkedInPage() {
  const { posts, loading, refresh } = useLinkedInPosts()
  const { auth, loading: authLoading } = useLinkedInAuth()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [scheduleFor, setScheduleFor] = useState<Record<string, string>>({})

  const isConnected = auth && new Date(auth.expires_at) > new Date()

  const handleAction = async (postId: string, updates: Record<string, any>) => {
    setActionLoading(postId)
    try {
      await fetch('/api/linkedin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, ...updates }),
      })
      refresh()
    } catch (err) {
      console.error('Action failed:', err)
    }
    setActionLoading(null)
  }

  const handlePublishNow = async (postId: string) => {
    setActionLoading(postId)
    try {
      const res = await fetch('/api/linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (!data.success) alert(`Failed: ${data.error}`)
      refresh()
    } catch (err) {
      console.error('Publish failed:', err)
    }
    setActionLoading(null)
  }

  const startEdit = (post: LinkedInPost) => {
    setEditingId(post.id)
    setEditContent(post.content)
  }

  const saveEdit = async (postId: string) => {
    await handleAction(postId, { content: editContent })
    setEditingId(null)
    setEditContent('')
  }

  const submitFeedback = async (postId: string) => {
    if (!feedbackText.trim()) return
    await handleAction(postId, {
      status: 'feedback_requested',
      feedback: feedbackText.trim(),
      feedback_at: new Date().toISOString(),
    })
    setFeedbackId(null)
    setFeedbackText('')
  }

  const drafts = posts.filter(p => p.status === 'draft' || p.status === 'feedback_requested')
  const scheduled = posts.filter(p => p.status === 'approved' || p.status === 'scheduled')
  const history = posts.filter(p => p.status === 'posted' || p.status === 'failed')

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">LinkedIn Scheduler</h1>
          <p className="text-white/30 text-sm mt-0.5">Review, edit, and schedule posts</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-medium text-sm">LinkedIn Connection</h3>
          <p className="text-white/30 text-xs mt-0.5">
            {authLoading ? 'Checking...' : isConnected ? `Connected — expires ${new Date(auth!.expires_at).toLocaleDateString()}` : 'Not connected'}
          </p>
        </div>
        <a
          href="/api/linkedin/authorize"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isConnected
              ? 'bg-white/[0.06] text-white/40 hover:text-white'
              : 'bg-emerald-500 text-black hover:bg-emerald-400'
          }`}
        >
          {isConnected ? 'Reconnect' : 'Connect LinkedIn'}
        </a>
      </div>

      {/* Drafts for Review */}
      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-3">
            Drafts for Review
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-[10px] font-bold">{drafts.length}</span>
          </h2>
          <div className="space-y-3">
            {drafts.map(post => (
              <div key={post.id} className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {post.title && <h3 className="text-white font-medium text-sm">{post.title}</h3>}
                    <PostStatusBadge status={post.status} />
                  </div>
                </div>

                {/* Content — inline editable */}
                {editingId === post.id ? (
                  <div className="mb-4">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={8}
                      className="w-full bg-white/[0.06] border border-emerald-500/30 rounded-lg px-3 py-2.5 text-white/80 text-sm focus:outline-none focus:border-emerald-500/60 resize-y"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => saveEdit(post.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditContent('') }}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/40 text-sm hover:text-white/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-white/70 text-sm whitespace-pre-wrap mb-4 cursor-pointer hover:bg-white/[0.02] rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => startEdit(post)}
                    title="Click to edit"
                  >
                    {post.content}
                  </p>
                )}

                {/* Show existing feedback */}
                {(post as any).feedback && (
                  <div className="mb-4 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <p className="text-orange-400/70 text-[10px] uppercase tracking-wider font-medium mb-1">Feedback</p>
                    <p className="text-white/60 text-sm">{(post as any).feedback}</p>
                  </div>
                )}

                {post.media_url && (
                  <p className="text-blue-400/70 text-xs mb-3">Media: {post.media_url}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-white/25 mb-4">
                  <span>By {AGENT_MAP[post.author]?.emoji || ''} {AGENT_MAP[post.author]?.name || post.author}</span>
                  <span>·</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>

                {/* Feedback input */}
                {feedbackId === post.id ? (
                  <div className="mb-3">
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="What changes do you want?"
                      rows={3}
                      className="w-full bg-white/[0.06] border border-orange-500/20 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-orange-500/40 resize-none placeholder:text-white/20"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => submitFeedback(post.id)}
                        disabled={!feedbackText.trim()}
                        className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 disabled:opacity-30"
                      >
                        Send Feedback
                      </button>
                      <button
                        onClick={() => { setFeedbackId(null); setFeedbackText('') }}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/40 text-sm hover:text-white/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleAction(post.id, { status: 'approved', approved_by: 'martin', approved_at: new Date().toISOString() })}
                    disabled={actionLoading === post.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => startEdit(post)}
                    disabled={editingId === post.id}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-sm font-medium hover:text-white/70 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setFeedbackId(post.id); setFeedbackText('') }}
                    disabled={feedbackId === post.id}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400/70 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                  >
                    Request Changes
                  </button>

                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="datetime-local"
                      value={scheduleFor[post.id] || ''}
                      onChange={e => setScheduleFor(prev => ({ ...prev, [post.id]: e.target.value }))}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white/60 text-xs focus:outline-none focus:border-emerald-500/30"
                    />
                    <button
                      onClick={() => {
                        const dt = scheduleFor[post.id]
                        if (!dt) return alert('Pick a time first')
                        handleAction(post.id, {
                          status: 'scheduled',
                          scheduled_at: new Date(dt).toISOString(),
                          approved_by: 'martin',
                          approved_at: new Date().toISOString(),
                        })
                      }}
                      disabled={actionLoading === post.id || !scheduleFor[post.id]}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-sm font-medium hover:bg-blue-500/25 transition-colors disabled:opacity-30"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled / Approved */}
      {scheduled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-3">Upcoming</h2>
          <div className="space-y-2">
            {scheduled.map(post => (
              <div key={post.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/30">
                    {post.scheduled_at && (
                      <span className="text-blue-400/70">{new Date(post.scheduled_at).toLocaleString()}</span>
                    )}
                    <PostStatusBadge status={post.status} />
                  </div>
                </div>
                <button
                  onClick={() => handlePublishNow(post.id)}
                  disabled={actionLoading === post.id || !isConnected}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Post Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-3">Post History</h2>
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-white/30 text-sm">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-white/30 text-sm">No posts yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {history.map(post => (
                <div key={post.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-sm line-clamp-1">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/20">
                      {post.posted_at && <span>{new Date(post.posted_at).toLocaleString()}</span>}
                      {post.error && <span className="text-red-400/70">{post.error.slice(0, 60)}</span>}
                    </div>
                  </div>
                  <PostStatusBadge status={post.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm">No LinkedIn posts yet.</p>
          <p className="text-white/15 text-xs mt-1">Dash will create drafts for review.</p>
        </div>
      )}
    </AppShell>
  )
}
