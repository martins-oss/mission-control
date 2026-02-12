export const SYSTEM_CONFIG = {
  version: '2026.2.6-3',
  gatewayPort: 18789,
  workspaces: {
    iris: '/home/openclaw/.openclaw/workspace',
    max: '/home/openclaw/.openclaw/workspace-max',
    dash: '/home/openclaw/.openclaw/workspace-dash',
    atlas: '/home/openclaw/.openclaw/workspace-atlas',
    amber: '/home/openclaw/.openclaw/workspace-amber',
    pixel: '/home/openclaw/.openclaw/workspace-pixel',
  },
  configFile: 'openclaw.json',
} as const
