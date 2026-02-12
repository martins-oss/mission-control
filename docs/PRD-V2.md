# Mission Control v2 — Complete Redesign PRD

> **Project:** Mission Control Dashboard  
> **URL:** mission.dothework.fit  
> **Author:** Martin (via Claude) → Iris review → Max implementation  
> **Priority:** HIGH — this is the command center for the entire OpenClaw operation  
> **Model:** Max on Opus 4.6  
> **Date:** 2026-02-12

---

## 1. VISION

Redesign Mission Control from a functional-but-generic dark dashboard into an **80s arcade / retro command center** that makes checking on the AI team feel like playing a game. Every visit should feel like sitting down at a sci-fi command console from WarGames, Tron, or Blade Runner.

This isn't just a reskin. The current dashboard is missing critical features. This PRD covers both the **aesthetic overhaul** and the **feature gaps**.

---

## 2. DESIGN SYSTEM — "ARCADE COMMAND CENTER"

### 2.1 Visual Identity

| Element | Spec |
|---------|------|
| **Background** | Deep black (#0A0A0F) with subtle CRT scanline overlay |
| **Primary font** | `"Press Start 2P"` (Google Fonts) for headers, stats, nav labels |
| **Body font** | `"JetBrains Mono"` or `"IBM Plex Mono"` for data, tables, descriptions |
| **Accent palette** | Neon green (#39FF14), hot pink (#FF2D7B), electric blue (#00D4FF), amber (#FFB800), purple (#B24BF3) |
| **Agent colors** | Iris: purple (#B24BF3), Max: amber (#FFB800), Dash: hot pink (#FF2D7B), Atlas: electric blue (#00D4FF), Amber: neon green (#39FF14), Pixel: rainbow gradient |
| **Cards** | Dark surface (#111118) with 1px neon border glow on hover |
| **Glow effects** | CSS box-shadow with agent color at 30% opacity, text-shadow on active stats |
| **Scanlines** | repeating-linear-gradient overlay, 2px lines at 10% opacity |
| **Screen flicker** | 0.5s "boot up" effect on page load |
| **Status indicators** | Animated pixel-style health bars (green=active, yellow=idle, red=error, gray=offline) |

### 2.2 Interaction Patterns

- **Page transitions:** Quick fade-in with "screen power-on" effect
- **Hover states:** Neon border glow intensifies
- **Loading states:** "LOADING..." with blinking cursor in pixel font
- **Empty states:** "INSERT COIN TO CONTINUE" or "NO DATA — AWAITING TRANSMISSION"
- **Notifications:** "ACHIEVEMENT UNLOCKED" style toast banners
- **Numbers/counters:** Animated count-up effect (arcade scoreboard style)

---

## 3. NAVIGATION (6 → 8 pages)

### Current:
```
Dashboard | Usage | Cron | Improvements | Network | LinkedIn
```

### New:
```
🕹️ HQ | 👾 Agents | 📊 Usage | ⚡ Tasks | 🔧 Cron | 💡 Ideas | 🧩 Skills | 📣 LinkedIn
```

| Page | Route | Status |
|------|-------|--------|
| **HQ** | `/` | REDESIGN — system overview attract screen |
| **Agents** | `/agents` | NEW — character select with stats/loadout |
| **Usage** | `/usage` | REDESIGN — high scores leaderboard + charts |
| **Tasks** | `/tasks` | NEW — mission select project boards |
| **Cron** | `/cron` | REDESIGN — power-ups style |
| **Ideas** | `/ideas` | REDESIGN — rename, add tabs |
| **Skills** | `/skills` | NEW — RPG inventory |
| **LinkedIn** | `/linkedin` | RESTYLE only |

**Remove:** `/network` (fold into Agents as toggle), `/login`

---

## 4. PAGE SPECIFICATIONS

### 4.1 HQ (Home) — `/`

"Attract screen." Shows system health at a glance in 5 seconds.

**Layout:** 4 stat cards (agents online, tasks active, cost today, cron health) → agent health bars → recent activity feed + blockers sidebar → pending decisions

**Data:** All existing tables (agent_status, tasks, blockers, improvements, agent_usage, cron_jobs)

**New vs current:** Health bars replace avatar circles, cost + cron stats added, recent activity feed (parse agent daily logs), better density

### 4.2 Agents — `/agents` (NEW)

"CHARACTER SELECT." Each agent as a game character with stats.

**Agent card shows:** Status health bar, model, messages/tokens/cost today, skills loadout, workspace size, owned projects, links to view memory/workspace/message

**Toggle:** Network graph view (moved from /network)

**Data:** agent_status, agent_usage, agent_workspaces tables + constants

### 4.3 Usage — `/usage` (REDESIGN)

"HIGH SCORES." Leaderboard + charts.

**Layout:** Total spend cards (lifetime, week, today) → leaderboard ranking with visual bars → stacked area chart (30 days, Recharts) → model breakdown (Opus vs Sonnet) → budget tracker with coin counter

**New dep:** `npm install recharts`

### 4.4 Tasks — `/tasks` (NEW)

"MISSION SELECT." Kanban-style project board.

**Layout:** Project filter tabs → In Progress / Blocked / Backlog / Done columns → each task shows owner, priority, project, notes

**Data:** Existing tasks + blockers tables

### 4.5 Cron — `/cron` (REDESIGN)

"POWER-UPS." Each job as a power-up card with colored glow (green=healthy, yellow=pending, red=failed, gray=disabled)

### 4.6 Ideas — `/ideas` (REDESIGN)

Rename from "Improvements." Add tabs: Proposed | Approved | Implemented | Rejected. Add discoveries section.

### 4.7 Skills — `/skills` (NEW)

"INVENTORY." Grid of installed skills (14) with agent assignments. Below: community browser with 700+ skills by category from awesome-openclaw-skills data.

**Data:** Static JSON for v1 (compile from skills reference doc)

### 4.8 LinkedIn — `/linkedin` (RESTYLE)

Keep all functionality. Just restyle to match 80s theme.

---

## 5. TECHNICAL APPROACH

### Stack (unchanged)
Next.js 14, Tailwind, Supabase, Vercel

### New Dependencies
```bash
npm install recharts
# Google Fonts: "Press Start 2P" + "JetBrains Mono"
```

### Global CSS Additions
- CRT scanline overlay (repeating-gradient, pointer-events: none)
- Boot-up animation (keyframes: brightness oscillation)
- Neon glow utilities (.glow-green, .glow-pink, etc.)
- .font-arcade class for pixel font

### Build Order
1. Design system + global styles + layout.tsx fonts
2. AppShell redesign (new nav, 8 items, status bar)
3. HQ page redesign
4. Agents page (new)
5. Tasks page (new)
6. Usage page + Recharts
7. Skills page (new)
8. Cron + Ideas restyle
9. LinkedIn restyle

---

## 6. WHAT EXISTS (for Max's reference)

### Current: 6 pages, 2036 lines total
- page.tsx (395), usage (230), cron (288), improvements (290), network (219), linkedin (614)

### Components: AppShell, StatusBadge, HeroStatCard, EmptyState, LinkedInCalendar, NetworkGraph

### Supabase: 9 tables with RLS, all populated with real data

### 14 API endpoints working

---

## 7. NOT IN SCOPE
- Real-time WebSocket (polling is fine)
- In-dashboard agent chat (use Telegram)
- Task creation from dashboard
- Sound effects
- Custom pixel art avatars (emoji + colors for v1)
- Light mode

---

## 8. TIMELINE
~7-8 Max sessions, each producing a deployable increment.

---

*PRD ready for Iris review → route to Max for implementation.*
