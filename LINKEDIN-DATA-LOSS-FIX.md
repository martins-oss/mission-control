# LinkedIn Post Data Loss Bug — Root Cause & Fix

## Issue
Martin edited a LinkedIn post draft, pressed "Save", and the entire post content disappeared (data loss).

## Root Cause

**Frontend bug:** The `handleAction` function was not checking if the API call succeeded before refreshing the post list.

```typescript
// OLD CODE (BUGGY)
const handleAction = async (postId: string, updates: Record<string, any>) => {
  setActionLoading(postId)
  try {
    await fetch('/api/linkedin/posts', { ... })
    refresh()  // ❌ Always called, even if API failed
  } catch (err) {
    console.error('Action failed:', err)
  }
  setActionLoading(null)
}
```

**What happened:**
1. User edits post content
2. Presses "Save"
3. API call fails silently (RLS policy issue or missing env var)
4. `refresh()` is called anyway
5. Post list reloads without the edited content
6. User sees their changes disappeared

**Secondary issue:** If `SUPABASE_SERVICE_ROLE_KEY` is not set on Vercel, the API route falls back to `ANON_KEY`, which hits RLS policies that require authenticated @supliful.com users.

## Fix Applied

### 1. Frontend Error Handling ✅

```typescript
// NEW CODE
const handleAction = async (postId: string, updates: Record<string, any>) => {
  setActionLoading(postId)
  try {
    const response = await fetch('/api/linkedin/posts', { ... })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Action failed:', response.status, errorData)
      alert(`Failed to update post: ${errorData.error || response.statusText}`)
      setActionLoading(null)
      return false  // ✅ Signal failure
    }
    
    refresh()  // ✅ Only called on success
    setActionLoading(null)
    return true
  } catch (err) {
    console.error('Action failed:', err)
    alert(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    setActionLoading(null)
    return false
  }
}
```

### 2. Preserve Edit State on Failure ✅

```typescript
// OLD
const saveEdit = async (postId: string) => {
  await handleAction(postId, { content: editContent })
  setEditingId(null)  // ❌ Always cleared
  setEditContent('')
}

// NEW
const saveEdit = async (postId: string) => {
  const success = await handleAction(postId, { content: editContent })
  if (success) {
    setEditingId(null)  // ✅ Only cleared on success
    setEditContent('')
  }
  // If failed, keep editing state so user doesn't lose their changes
}
```

### 3. API Route Logging ✅

Added detailed logging to `/api/linkedin/posts` to help debug future issues:
- Log all update attempts with post ID and fields
- Log Supabase errors with full details
- Warn if `SUPABASE_SERVICE_ROLE_KEY` is not set
- Return 404 if update succeeds but no data returned

### 4. RLS Policy Check

Verified linkedin_posts table has these RLS policies:
- `supliful_read` — SELECT for authenticated @supliful.com users
- `supliful_write` — ALL (UPDATE/INSERT/DELETE) for authenticated @supliful.com users

**Service role key bypasses RLS**, so API should work if the key is set correctly.

## Required Vercel Env Var

Make sure this is set on Vercel:

```
SUPABASE_SERVICE_ROLE_KEY=(value from mission-control/.env.local)
```

Without this, the API falls back to `ANON_KEY` which hits RLS restrictions.

## Testing

1. Edit a post in Mission Control
2. Change the content
3. Press "Save"
4. If the API fails, you'll now see an alert with the error message
5. The editing state will be preserved (you won't lose your changes)
6. Check Vercel function logs for detailed error info

## Prevention

- Always check response.ok before assuming success
- Return success/failure signals from async functions
- Preserve user input state on failures
- Add detailed logging for debugging
- Test error paths, not just happy paths
