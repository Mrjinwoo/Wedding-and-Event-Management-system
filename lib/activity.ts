import { createClient } from '@/lib/supabase/server'

export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId: string | null
  action: string
  entity?: string
  entityId?: string
  details?: Record<string, unknown>
}) {
  try {
    const supabase = await createClient()
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details,
    })
  } catch (err) {
    // Non-blocking — never crash the main flow
    console.error('Activity log error:', err)
  }
}
