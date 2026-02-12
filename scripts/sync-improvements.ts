#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function syncImprovements() {
  // Read proposals file
  const proposalsPath = path.resolve(process.env.HOME!, '.openclaw/shared/improvements/proposals-2026-02-11.md')
  
  if (!fs.existsSync(proposalsPath)) {
    console.error('Proposals file not found:', proposalsPath)
    process.exit(1)
  }

  const content = fs.readFileSync(proposalsPath, 'utf-8')
  
  // Parse proposals - simple regex approach
  const proposalRegex = /## 🥇 \*\*([A-Z]+-\d+): (.+?)\*\*\n\n\*\*What:\*\* (.+?)\n\n\*\*Why:\*\* (.+?)\n\n\*\*Impact:\*\* (🔴|🟡|🟢) (\w+) —.+?\n\n\*\*Risk:\*\* (🔴|🟡|🟢) (\w+) —.+?\n\n\*\*Owner:\*\* (.+?)\n/gs
  
  const proposals: any[] = []
  let match
  
  while ((match = proposalRegex.exec(content)) !== null) {
    const [_, proposalId, title, what, why, impactEmoji, impact, riskEmoji, risk, owner] = match
    
    const status = content.includes(`**Status:** ✅ **AUTO-IMPLEMENT**`) 
      ? 'proposed' 
      : content.includes(`**Status:** Proposed — **NEEDS APPROVAL**`)
      ? 'needs_approval'
      : 'proposed'
    
    proposals.push({
      proposal_id: proposalId,
      title: `${proposalId}: ${title.trim()}`,
      description: what.trim(),
      impact: impact.toLowerCase(),
      risk: risk.toLowerCase(),
      owner: owner.trim(),
      status,
    })
  }
  
  // Also check for secondary proposals (🥈, 🥉, 🏅)
  const secondaryRegex = /## (🥈|🥉|🏅) \*\*([A-Z]+-\d+): (.+?)\*\*\n\n\*\*What:\*\* (.+?)\n\n\*\*Why:\*\* (.+?)\n\n\*\*Impact:\*\* (🔴|🟡|🟢) (\w+) —.+?\n\n\*\*Risk:\*\* (🔴|🟡|🟢) (\w+) —.+?\n\n\*\*Owner:\*\* (.+?)\n/gs
  
  while ((match = secondaryRegex.exec(content)) !== null) {
    const [_, medal, proposalId, title, what, why, impactEmoji, impact, riskEmoji, risk, owner] = match
    
    // Determine status from content
    let status = 'proposed'
    const proposalSection = content.substring(match.index, match.index + 1000)
    
    if (proposalSection.includes('✅ **AUTO-IMPLEMENT**')) {
      status = 'proposed'
    } else if (proposalSection.includes('**NEEDS APPROVAL**')) {
      status = 'needs_approval'
    }
    
    proposals.push({
      proposal_id: proposalId,
      title: `${proposalId}: ${title.trim()}`,
      description: what.trim(),
      impact: impact.toLowerCase(),
      risk: risk.toLowerCase(),
      owner: owner.trim(),
      status,
    })
  }
  
  console.log(`Parsed ${proposals.length} proposals`)
  
  // Upsert into database
  for (const proposal of proposals) {
    // Check if exists
    const { data: existing } = await supabase
      .from('improvements')
      .select('id, status')
      .eq('proposal_id', proposal.proposal_id)
      .maybeSingle()
    
    if (existing) {
      // Only update if still in proposed/needs_approval state
      if (existing.status === 'proposed' || existing.status === 'needs_approval') {
        const { error } = await supabase
          .from('improvements')
          .update(proposal)
          .eq('id', existing.id)
        
        if (error) {
          console.error(`Failed to update ${proposal.proposal_id}:`, error.message)
        } else {
          console.log(`✓ Updated ${proposal.proposal_id}`)
        }
      } else {
        console.log(`⊘ Skipped ${proposal.proposal_id} (status: ${existing.status})`)
      }
    } else {
      const { error } = await supabase
        .from('improvements')
        .insert(proposal)
      
      if (error) {
        console.error(`Failed to insert ${proposal.proposal_id}:`, error.message)
      } else {
        console.log(`✓ Inserted ${proposal.proposal_id}`)
      }
    }
  }
  
  console.log('Done!')
}

syncImprovements()
