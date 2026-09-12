import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await logActivity({
        userId: user.id,
        action: 'USER_LOGOUT',
        entity: 'profiles',
        entityId: user.id,
      })
    }

    await supabase.auth.signOut()

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
