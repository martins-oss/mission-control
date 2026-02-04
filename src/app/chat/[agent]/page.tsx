"use client"
import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  file_name?: string
  file_url?: string
}

interface FileAttachment {
  name: string
  content: string
  type: string
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
  const [attachment, setAttachment] = useState<FileAttachment | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const agentId = params.agent as string
  const agent = agents[agentId]

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

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

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 1MB for text files
    if (file.size > 1024 * 1024) {
      alert('File size must be under 1MB')
      return
    }

    // Read file content for text files
    if (file.type.startsWith('text/') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.json') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.html')) {
      const content = await file.text()
      setAttachment({ name: file.name, content, type: 'text' })
    } else {
      // For other files, just store the name
      setAttachment({ name: file.name, content: '[Binary file]', type: 'binary' })
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = () => {
    setAttachment(null)
  }

  const sendMessage = async () => {
    if ((!input.trim() && !attachment) || sending) return
    setSending(true)
    
    let userMessage = input.trim()
    
    // Append file content if attached
    if (attachment) {
      if (attachment.type === 'text') {
        userMessage = userMessage 
          ? `${userMessage}\n\n---\n📎 ${attachment.name}:\n\`\`\`\n${attachment.content}\n\`\`\``
          : `📎 ${attachment.name}:\n\`\`\`\n${attachment.content}\n\`\`\``
      } else {
        userMessage = userMessage 
          ? `${userMessage}\n\n[Attached: ${attachment.name}]`
          : `[Attached: ${attachment.name}]`
      }
    }
    
    setInput('')
    setAttachment(null)
    
    // Add user message to UI immediately
    const tempUserId = 'user-' + Date.now().toString()
    const userMsg: Message = { 
      id: tempUserId, 
      role: 'user', 
      content: userMessage, 
      created_at: new Date().toISOString() 
    }
    setMessages(prev => [...prev, userMsg])
    
    // Save user message to Supabase
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
          id: 'assistant-' + Date.now().toString(), 
          role: 'assistant', 
          content: data.response, 
          created_at: new Date().toISOString() 
        }
        setMessages(prev => [...prev, assistantMsg])
        
        // Save assistant message to Supabase
        await supabase.from('chat_messages').insert({
          agent_id: agentId,
          role: 'assistant',
          content: data.response
        })
      }
    } catch (err) {
      console.error('Send error:', err)
      // Add error message
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: '⚠️ Failed to send message. Please try again.',
        created_at: new Date().toISOString()
      }])
    }
    setSending(false)
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
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
  if (!user || !agent) return null

  return (
    <main className="min-h-screen bg-background-primary flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-4 flex items-center gap-4 backdrop-blur-sm bg-background-primary/80 sticky top-0 z-10">
        <button 
          onClick={() => router.push('/')} 
          className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
        >
          ← Back
        </button>
        <div className="text-3xl">{agent.emoji}</div>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg">{agent.name}</h1>
          <p className="text-white/40 text-sm">{agent.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-white/40 text-sm">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{agent.emoji}</div>
            <p className="text-white/60 text-lg mb-2">Start a conversation with {agent.name}</p>
            <p className="text-white/40 text-sm">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                <span className="text-sm">{agent.emoji}</span>
              </div>
            )}
            <div className={"max-w-[75%] rounded-2xl px-4 py-3 " + (
              msg.role === 'user' 
                ? 'bg-accent text-black rounded-br-md' 
                : 'bg-white/5 border border-white/10 text-white rounded-bl-md'
            )}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              <p className={"text-xs mt-2 " + (msg.role === 'user' ? 'text-black/50' : 'text-white/30')}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center ml-3 flex-shrink-0 mt-1">
                <span className="text-sm">👤</span>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-sm">{agent.emoji}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Input Area */}
      <div className="border-t border-white/10 p-4 backdrop-blur-sm bg-background-primary/80">
        {/* File attachment preview */}
        {attachment && (
          <div className="mb-3 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span className="text-lg">📎</span>
            <span className="text-white/80 text-sm flex-1 truncate">{attachment.name}</span>
            <button 
              onClick={removeAttachment}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex gap-3 items-end">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex-shrink-0"
            title="Attach file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.md,.json,.ts,.tsx,.js,.jsx,.css,.html,.py,.sh,.yml,.yaml,.toml,.csv"
          />
          
          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 resize-none min-h-[48px] max-h-[200px] transition-colors"
              disabled={sending}
              rows={1}
            />
          </div>
          
          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={sending || (!input.trim() && !attachment)}
            className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium p-3 rounded-xl transition-all flex-shrink-0 active:scale-95"
            title="Send message (Enter)"
          >
            {sending ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
        
        <p className="text-white/30 text-xs mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </main>
  )
}
