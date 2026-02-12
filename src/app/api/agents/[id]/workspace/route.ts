import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

interface FileNode {
  name: string
  type: 'file' | 'dir'
  size?: number
  children?: FileNode[]
  path: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

async function getDirectoryTree(dirPath: string, maxDepth = 3, currentDepth = 0): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) return []

  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    const nodes: FileNode[] = []

    for (const entry of entries) {
      // Skip hidden files and common excludes
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

      const fullPath = path.join(dirPath, entry.name)
      const stats = await fs.promises.stat(fullPath)

      if (entry.isDirectory()) {
        const children = await getDirectoryTree(fullPath, maxDepth, currentDepth + 1)
        nodes.push({
          name: entry.name,
          type: 'dir',
          path: fullPath,
          children,
        })
      } else {
        nodes.push({
          name: entry.name,
          type: 'file',
          size: stats.size,
          path: fullPath,
        })
      }
    }

    // Sort: directories first, then by name
    return nodes.sort((a, b) => {
      if (a.type === 'dir' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'dir') return 1
      return a.name.localeCompare(b.name)
    })
  } catch (err) {
    console.error('Failed to read directory:', dirPath, err)
    return []
  }
}

function calculateTotalSize(node: FileNode): number {
  if (node.type === 'file') return node.size || 0
  if (!node.children) return 0
  return node.children.reduce((sum, child) => sum + calculateTotalSize(child), 0)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const workspacePath = path.resolve(process.env.HOME!, `.openclaw/workspace-${agentId}`)

    if (!fs.existsSync(workspacePath)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const tree = await getDirectoryTree(workspacePath)
    const totalSize = tree.reduce((sum, node) => sum + calculateTotalSize(node), 0)

    return NextResponse.json({
      agentId,
      workspacePath,
      tree,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
    })
  } catch (error) {
    console.error('Workspace scan failed:', error)
    return NextResponse.json({ 
      error: 'Failed to scan workspace',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
