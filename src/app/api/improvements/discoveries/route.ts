import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

interface Discovery {
  id: string
  title: string
  content: string
  file: string
  date: string
  category?: string
}

export async function GET() {
  try {
    const improvementsDir = path.resolve(process.env.HOME!, '.openclaw/shared/improvements')
    
    if (!fs.existsSync(improvementsDir)) {
      return NextResponse.json({ discoveries: [] })
    }

    const files = fs.readdirSync(improvementsDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('.'))
      .sort()
      .reverse() // Most recent first

    const discoveries: Discovery[] = []

    for (const file of files.slice(0, 20)) { // Limit to 20 most recent
      const filePath = path.join(improvementsDir, file)
      const stats = fs.statSync(filePath)
      const content = fs.readFileSync(filePath, 'utf-8')

      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : file.replace('.md', '')

      // Extract date from filename or file stats
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/)
      const date = dateMatch ? dateMatch[1] : stats.mtime.toISOString().split('T')[0]

      // Categorize by filename pattern
      let category = 'discovery'
      if (file.includes('proposal')) category = 'proposal'
      else if (file.includes('research')) category = 'research'
      else if (file.includes('log')) category = 'log'

      discoveries.push({
        id: `file-${file}`,
        title,
        content: content.slice(0, 500), // Preview only
        file,
        date,
        category,
      })
    }

    return NextResponse.json({ discoveries })
  } catch (error) {
    console.error('Failed to read discoveries:', error)
    return NextResponse.json({ discoveries: [], error: 'Failed to read discoveries' }, { status: 500 })
  }
}
