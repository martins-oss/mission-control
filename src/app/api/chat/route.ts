import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY_URL || 'http://iris-gateway:18788'
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN

const agentLabels: Record<string, string> = {
  iris: 'iris-main',
  max: 'max-product',
  nina: 'nina-growth',
  blake: 'blake-investor',
  eli: 'eli-content',
  pixel: 'pixel-creative',
}

export async function POST(req: NextRequest) {
  try {
    const { agent, message } = await req.json()
    
    if (!agent || !message) {
      return NextResponse.json({ error: 'Missing agent or message' }, { status: 400 })
    }

    const label = agentLabels[agent]
    if (!label) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 400 })
    }

    // Store user message in Supabase
    await supabase.from('chat_messages').insert({
      agent_id: agent,
      role: 'user',
      content: message
    })

    // For now, return a placeholder response
    // In production, this would call OpenClaw gateway to spawn/send to agent session
    let response = ''
    
    if (OPENCLAW_TOKEN) {
      try {
        // Try to send to OpenClaw gateway
        const res = await fetch(`${OPENCLAW_GATEWAY}/api/sessions/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENCLAW_TOKEN}`
          },
          body: JSON.stringify({
            label,
            message,
            timeoutSeconds: 120
          })
        })
        
        if (res.ok) {
          const data = await res.json()
          response = data.response || data.message || 'Agent is processing your request...'
        } else {
          response = `[${agent}] Agent session not available. Please try again later.`
        }
      } catch (err) {
        console.error('OpenClaw gateway error:', err)
        response = `[${agent}] I'm currently being set up. Check back soon!`
      }
    } else {
      // Demo mode - return contextual responses
      const responses: Record<string, string> = {
        iris: "I'm Iris, your orchestrator. I coordinate the team and keep everything running smoothly. How can I help?",
        max: "Hey! I'm Max, your product engineer. I handle the DO IT app, bug fixes, and feature development. What would you like me to build?",
        nina: "Hi! I'm Nina, focused on growth. I can help with ASO, user acquisition strategies, and distribution channels. What growth challenge are you facing?",
        blake: "Hello. I'm Blake, handling investor relations. I'm working on the Series A deck and can help with fundraising strategy. What do you need?",
        eli: "Hey there! I'm Eli, your content person. I can help with LinkedIn posts, Twitter threads, and building in public content. What story should we tell?",
        pixel: "Hi! I'm Pixel! I help with creative and fun stuff. Want to make a game or build something cool together?",
      }
      response = responses[agent] || "Hello! I'm here to help."
    }

    // Store assistant response
    await supabase.from('chat_messages').insert({
      agent_id: agent,
      role: 'assistant',
      content: response
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
