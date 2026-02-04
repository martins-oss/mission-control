"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTeamMembers, useProjects, useStats, useActivities } from '@/lib/hooks'
import { useAuth } from '@/lib/auth'
import { TeamMember, Project, supabase } from '@/lib/supabase'

type DocTab = 'overview' | 'soul' | 'agents' | 'tools'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth(true)
  const { members, loading: membersLoading } = useTeamMembers()
  const { projects, loading: projectsLoading } = useProjects()
  const { stats, loading: statsLoading } = useStats()
  const { activities } = useActivities(5)
  
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [docTab, setDocTab] = useState<DocTab>('overview')
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMember, setChatMember] = useState<TeamMember | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  // Load messages when chat opens
  useEffect(() => {
    if (chatOpen && chatMember) {
      loadMessages(chatMember.name.toLowerCase())
    }
  }, [chatOpen, chatMember])

  const loadMessages = async (agentId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true })
      .limit(50)
    if (data) setMessages(data)
  }

  const openChat = (member: TeamMember) => {
    setChatMember(member)
    setChatOpen(true)
    setMessages([])
  }

  const closeChat = () => {
    setChatOpen(false)
    setChatMember(null)
    setMessages([])
    setInput('')
  }

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.1
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.15)
  }

  const sendMessage = async () => {
    if (!input.trim() || sending || !chatMember) return
    setSending(true)
    
    const userMessage = input.trim()
    const agentId = chatMember.name.toLowerCase()
    setInput('')
    
    // Add user message to UI
    const userMsg: Message = { 
      id: 'user-' + Date.now(), 
      role: 'user', 
      content: userMessage, 
      created_at: new Date().toISOString() 
    }
    setMessages(prev => [...prev, userMsg])
    
    // Save user message
    await supabase.from('chat_messages').insert({
      agent_id: agentId,
      role: 'user',
      content: userMessage,
      user_id: user?.id
    })
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, message: userMessage })
      })
      const data = await res.json()
      
      if (data.response) {
        const assistantMsg: Message = { 
          id: 'assistant-' + Date.now(), 
          role: 'assistant', 
          content: data.response, 
          created_at: new Date().toISOString() 
        }
        setMessages(prev => [...prev, assistantMsg])
        
        // Save assistant message
        await supabase.from('chat_messages').insert({
          agent_id: agentId,
          role: 'assistant',
          content: data.response
        })
        
        // Play notification sound
        playNotificationSound()
      }
    } catch (err) {
      console.error('Send error:', err)
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: '⚠️ Failed to send message. Please try again.',
        created_at: new Date().toISOString()
      }])
    }
    setSending(false)
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background-primary flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </main>
    )
  }

  if (!user) return null

  const loading = membersLoading || projectsLoading || statsLoading
  
  return (
    <main className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">🎯 Mission Control</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm">{user.email}</span>
            <button onClick={signOut} className="text-white/40 hover:text-white text-sm transition-colors">
              Sign out
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Active Tasks', value: loading ? '...' : stats.active.toString(), color: 'text-blue-400' },
            { label: 'Blocked', value: loading ? '...' : stats.blocked.toString(), color: 'text-red-400' },
            { label: 'Done', value: loading ? '...' : stats.done.toString(), color: 'text-green-400' },
            { label: 'Messages Today', value: loading ? '...' : (stats.totalMessages || 0).toString(), color: 'text-accent' },
            { label: 'Cost Today', value: loading ? '...' : `$${stats.todayCost.toFixed(2)}`, color: 'text-white' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm">{stat.label}</p>
              <p className={"text-2xl font-bold " + stat.color}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Team Status */}
        <div className="mb-8">
          <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4">Team Status</h2>
          <div className="flex gap-4 flex-wrap">
            {membersLoading ? (
              <div className="text-white/40">Loading team...</div>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => { setSelectedMember(member); setSelectedProject(null); setDocTab('overview') }}
                  className={"bg-white/5 rounded-xl p-4 border text-center cursor-pointer transition-all hover:bg-white/10 min-w-[100px] " + 
                    (selectedMember?.id === member.id ? 'border-accent ring-1 ring-accent' : 'border-white/10')}
                >
                  <div className="text-3xl mb-2">{member.emoji}</div>
                  <div className="text-white text-sm font-medium">{member.name}</div>
                  <div className={"text-xs mt-1 " + (
                    member.status === 'active' ? 'text-green-400' : 
                    member.status === 'idle' ? 'text-yellow-400' : 'text-white/40'
                  )}>
                    <span className={member.status === 'active' ? 'inline-block w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse' : 'inline-block w-2 h-2 rounded-full bg-white/20 mr-1'}></span>
                    {member.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="col-span-2">
            <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4">Projects</h2>
            {projectsLoading ? (
              <div className="text-white/40">Loading projects...</div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => { setSelectedProject(project); setSelectedMember(null) }}
                    className={"bg-white/5 rounded-xl p-4 border flex items-center justify-between cursor-pointer transition-all hover:bg-white/10 " +
                      (selectedProject?.id === project.id ? 'border-accent ring-1 ring-accent' : 'border-white/10')}
                  >
                    <div>
                      <span className="text-white font-medium">{project.name}</span>
                      <span className="text-white/40 text-sm ml-4">
                        {project.owner?.emoji} {project.owner?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-sm">{project.done_count}/{project.task_count}</span>
                      <span className={"px-2 py-0.5 rounded text-xs " + (
                        project.priority === 'high' || project.priority === 'critical' 
                          ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                      )}>{project.priority}</span>
                      <span className={"px-2 py-0.5 rounded text-xs " + (
                        project.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                        project.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                        project.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                        project.status === 'done' ? 'bg-green-500/20 text-green-400' :
                        'bg-white/10 text-white/60'
                      )}>{project.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Activity */}
            <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4 mt-8">Recent Activity</h2>
            <div className="space-y-2">
              {activities.length === 0 ? (
                <div className="text-white/40 text-sm">No recent activity</div>
              ) : (
                activities.map((activity) => {
                  // Check if it's a chat message
                  const isChat = 'role' in activity && 'content' in activity
                  
                  if (isChat) {
                    const chatActivity = activity as { id: string; role: string; content: string; created_at: string; team_member?: TeamMember; agent_id: string }
                    return (
                      <div key={chatActivity.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{chatActivity.role === 'user' ? '👤' : (chatActivity.team_member?.emoji || '🤖')}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">
                                {chatActivity.role === 'user' ? 'You' : (chatActivity.team_member?.name || chatActivity.agent_id)}
                              </span>
                              <span className="text-white/30 text-xs">
                                {new Date(chatActivity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-white/60 text-sm truncate">{chatActivity.content.slice(0, 100)}{chatActivity.content.length > 100 ? '...' : ''}</p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  // Regular activity
                  return (
                    <div key={activity.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2">
                        <span>{activity.team_member?.emoji}</span>
                        <span className="text-white text-sm">{activity.team_member?.name}</span>
                        <span className="text-white/40 text-sm">{(activity as Activity).action}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="col-span-1">
            {selectedMember && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-5xl mb-2">{selectedMember.emoji}</div>
                    <h3 className="text-white text-xl font-bold">{selectedMember.name}</h3>
                    <p className="text-white/60 text-sm">{selectedMember.role}</p>
                  </div>
                  <div className={"px-2 py-0.5 rounded text-xs " + (
                    selectedMember.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                    selectedMember.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-white/10 text-white/40'
                  )}>{selectedMember.status}</div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-white/10 pb-2">
                  {(['overview', 'soul', 'agents', 'tools'] as DocTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDocTab(tab)}
                      className={"px-3 py-1 rounded text-xs transition-colors " + (
                        docTab === tab 
                          ? 'bg-accent text-black' 
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                  {docTab === 'overview' && (
                    <div>
                      {selectedMember.last_activity && (
                        <div className="mb-4">
                          <p className="text-white/40 text-xs uppercase mb-1">Last Active</p>
                          <p className="text-white text-sm">{new Date(selectedMember.last_activity).toLocaleString()}</p>
                        </div>
                      )}
                      <p className="text-white/40 text-sm">
                        Click the tabs above to view {selectedMember.name}&apos;s documentation.
                      </p>
                    </div>
                  )}
                  {docTab === 'soul' && (
                    <div className="text-white/80 text-sm whitespace-pre-wrap font-mono">
                      {selectedMember.soul_md || 'No SOUL.md available'}
                    </div>
                  )}
                  {docTab === 'agents' && (
                    <div className="text-white/80 text-sm whitespace-pre-wrap font-mono">
                      {selectedMember.agents_md || 'No AGENTS.md available'}
                    </div>
                  )}
                  {docTab === 'tools' && (
                    <div className="text-white/80 text-sm whitespace-pre-wrap font-mono">
                      {selectedMember.tools_md || 'No TOOLS.md available'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button 
                  onClick={() => openChat(selectedMember)}
                  className="w-full mt-4 bg-accent hover:bg-accent/80 text-black font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  💬 Open Chat
                </button>
              </div>
            )}
            {selectedProject && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="text-white text-xl font-bold mb-1">{selectedProject.name}</h3>
                <p className="text-white/60 text-sm mb-2">{selectedProject.owner?.emoji} {selectedProject.owner?.name}</p>
                {selectedProject.description && (
                  <p className="text-white/40 text-sm mb-4">{selectedProject.description}</p>
                )}
                <div className="flex gap-2 mb-4">
                  <span className={"px-2 py-0.5 rounded text-xs " + (
                    selectedProject.priority === 'high' || selectedProject.priority === 'critical'
                      ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                  )}>{selectedProject.priority}</span>
                  <span className={"px-2 py-0.5 rounded text-xs " + (
                    selectedProject.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    selectedProject.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                    selectedProject.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedProject.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    'bg-white/10 text-white/60'
                  )}>{selectedProject.status}</span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/40 text-xs uppercase mb-2">Progress</p>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all" 
                      style={{width: selectedProject.task_count ? `${(selectedProject.done_count || 0) / selectedProject.task_count * 100}%` : '0%'}}
                    />
                  </div>
                  <p className="text-white text-sm">{selectedProject.done_count || 0} of {selectedProject.task_count || 0} tasks done</p>
                </div>
                <button className="w-full mt-4 bg-accent hover:bg-accent/80 text-black font-medium py-2 px-4 rounded-lg transition-colors">
                  View Tasks
                </button>
              </div>
            )}
            {!selectedMember && !selectedProject && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
                <p className="text-white/40">Select a team member or project</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Slide Panel */}
      {chatOpen && chatMember && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={closeChat}
          />
          
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-[500px] max-w-full bg-background-primary border-l border-white/10 z-50 flex flex-col shadow-2xl animate-slide-in">
            {/* Chat Header */}
            <div className="border-b border-white/10 p-4 flex items-center gap-4">
              <button 
                onClick={closeChat}
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                ✕
              </button>
              <div className="text-3xl">{chatMember.emoji}</div>
              <div className="flex-1">
                <h2 className="text-white font-bold">{chatMember.name}</h2>
                <p className="text-white/40 text-sm">{chatMember.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-white/40 text-sm">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">{chatMember.emoji}</div>
                  <p className="text-white/60">Start a conversation with {chatMember.name}</p>
                  <p className="text-white/40 text-sm mt-2">Enter to send • Shift+Enter for new line</p>
                </div>
              )}
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <span className="text-sm">{chatMember.emoji}</span>
                    </div>
                  )}
                  <div className={"max-w-[80%] rounded-2xl px-4 py-2 " + (
                    msg.role === 'user' 
                      ? 'bg-accent text-black rounded-br-sm' 
                      : 'bg-white/5 border border-white/10 text-white rounded-bl-sm'
                  )}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p className={"text-xs mt-1 " + (msg.role === 'user' ? 'text-black/40' : 'text-white/30')}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                      <span className="text-sm">👤</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {sending && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-2">
                    <span className="text-sm">{chatMember.emoji}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${chatMember.name}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 resize-none min-h-[48px] max-h-[150px] text-sm"
                  disabled={sending}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-black font-medium p-3 rounded-xl transition-all active:scale-95"
                >
                  {sending ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </main>
  )
}
