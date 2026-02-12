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

async function syncTracker() {
  // Read TRACKER.md
  const trackerPath = path.resolve(process.env.HOME!, '.openclaw/shared/projects/meta/TRACKER.md')
  
  if (!fs.existsSync(trackerPath)) {
    console.error('TRACKER.md not found:', trackerPath)
    process.exit(1)
  }

  const content = fs.readFileSync(trackerPath, 'utf-8')
  
  // Parse Active Projects table
  const tableRegex = /## Active Projects\n\n\| # \| Project \| Task \| Owner \| Status \| Priority \| Notes \|\n\|---\|.*?\n((?:\| \d+ \|.*?\n)+)/s
  const match = content.match(tableRegex)
  
  if (!match) {
    console.error('Could not find Active Projects table in TRACKER.md')
    process.exit(1)
  }
  
  const rows = match[1].trim().split('\n')
  const tasks: any[] = []
  
  for (const row of rows) {
    const cols = row.split('|').map(s => s.trim()).filter(Boolean)
    if (cols.length < 7) continue
    
    const [num, project, task, owner, status, priority, notes] = cols
    
    // Normalize status
    const normalizedStatus = status.toLowerCase()
      .replace('in progress', 'in_progress')
      .replace('backlog', 'backlog')
      .replace('waiting', 'waiting')
      .replace('blocked', 'blocked')
    
    // Normalize priority
    const normalizedPriority = priority.toLowerCase()
    
    tasks.push({
      task: task.trim(),
      owner: owner.toLowerCase().split('+')[0].trim(), // Handle "Atlas + Martins" → "atlas"
      status: normalizedStatus,
      priority: normalizedPriority,
      project: project.trim(),
      notes: notes.trim() || null,
    })
  }
  
  console.log(`Parsed ${tasks.length} tasks from TRACKER.md`)
  
  // Get existing tasks from Supabase
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('id, task, owner, status, priority, project')
  
  const existingMap = new Map()
  if (existingTasks) {
    existingTasks.forEach(t => {
      const key = `${t.owner}:${t.task}`
      existingMap.set(key, t)
    })
  }
  
  // Upsert tasks
  let inserted = 0
  let updated = 0
  let skipped = 0
  
  for (const task of tasks) {
    const key = `${task.owner}:${task.task}`
    const existing = existingMap.get(key)
    
    if (existing) {
      // Update if status/priority changed
      if (existing.status !== task.status || existing.priority !== task.priority) {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: task.status,
            priority: task.priority,
            notes: task.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        
        if (error) {
          console.error(`Failed to update ${key}:`, error.message)
        } else {
          console.log(`✓ Updated ${key} (${existing.status} → ${task.status})`)
          updated++
        }
      } else {
        skipped++
      }
    } else {
      // Insert new task
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      if (error) {
        console.error(`Failed to insert ${key}:`, error.message)
      } else {
        console.log(`✓ Inserted ${key}`)
        inserted++
      }
    }
  }
  
  console.log(`\nSync complete: ${inserted} inserted, ${updated} updated, ${skipped} unchanged`)
}

syncTracker()
