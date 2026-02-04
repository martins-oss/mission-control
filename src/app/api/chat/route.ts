import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Gateway accessed via Cloudflare Tunnel
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://gateway.dothework.fit'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN

// Agent IDs map to OpenClaw agent configurations
const agentIds: Record<string, string> = {
  iris: 'main',    // Iris is the main agent
  max: 'max',
  nina: 'nina',
  blake: 'blake',
  eli: 'eli',
  pixel: 'pixel',
}

export async function POST(req: NextRequest) {
  try {
    const { agent, message } = await req.json()
    
    if (!agent || !message) {
      return NextResponse.json({ error: 'Missing agent or message' }, { status: 400 })
    }

    const agentId = agentIds[agent]
    if (!agentId) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 400 })
    }

    // Store user message in Supabase
    await supabase.from('chat_messages').insert({
      agent_id: agent,
      role: 'user',
      content: message
    })

    let response = ''
    
    if (GATEWAY_TOKEN) {
      try {
        // Use OpenAI-compatible chat completions endpoint
        // Model format: "openclaw:<agentId>" routes to specific agent
        const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GATEWAY_TOKEN}`
          },
          body: JSON.stringify({
            model: `openclaw:${agentId}`,
            messages: [
              { role: 'user', content: message }
            ]
          })
        })
        
        if (res.ok) {
          const data = await res.json()
          response = data.choices?.[0]?.message?.content || 'Agent is processing your request...'
        } else {
          const errorText = await res.text()
          console.error('Gateway error:', res.status, errorText)
          response = `[${agent}] Agent session not available. Please try again later.`
        }
      } catch (err) {
        console.error('OpenClaw gateway error:', err)
        response = `[${agent}] I'm currently being set up. Check back soon!`
      }
    } else {
      // Demo mode - return contextual responses when gateway not configured
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
