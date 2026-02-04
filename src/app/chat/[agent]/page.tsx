"use client"
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const agents: Record<string, { name: string; emoji: string; role: string }> = {
  iris: { name: 'Iris', emoji: '🫡', role: 'Orchestrator' },
  max: { name: 'Max', emoji: '🔧', role: 'Product Engineer' },
  nina: { name: 'Nina', emoji: '📈', role: 'Growth' },
  blake: { name: 'Blake', emoji: '💰', role: 'Investor Relations' },
  eli: { name: 'Eli', emoji: '✍️', role: 'Content' },
  pixel: { name: 'Pixel', emoji: '👧', role: 'Creative Companion' },
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const agentId = params.agent as string
  const agent = agents[agentId]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!agent) {
      router.push('/')
      return
    }
    loadMessages()
  }, [agentId, agent, router])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true })
      .limit(50)
    if (data) setMessages(data)
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const userMessage = input.trim()
    setInput('')
    
    const tempId = Date.now().toString()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMessage, created_at: new Date().toISOString() }])
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, message: userMessage })
      })
      const data = await res.json()
      if (data.response) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.response, created_at: new Date().toISOString() }])
      }
    } catch (err) {
      console.error('Send error:', err)
    }
    setSending(false)
  }

  if (authLoading) {
    return <main className="min-h-screen bg-background-primary flex items-center justify-center"><p className="text-white/60">Loading...</p></main>
  }
  if (!user || !agent) return null

  return (
    <main className="min-h-screen bg-background-primary flex flex-col">
      <div className="border-b border-white/10 p-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="text-white/60 hover:text-white">← Back</button>
        <div className="text-2xl">{agent.emoji}</div>
        <div>
          <h1 className="text-white font-bold">{agent.name}</h1>
          <p className="text-white/40 text-sm">{agent.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/40 py-8">
            Start a conversation with {agent.name}
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={"max-w-[70%] rounded-2xl px-4 py-2 " + (
              msg.role === 'user' 
                ? 'bg-accent text-black' 
                : 'bg-white/10 text-white'
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={`Message ${agent.name}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-accent"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-black font-medium px-6 py-3 rounded-xl transition-colors"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </main>
  )
}
