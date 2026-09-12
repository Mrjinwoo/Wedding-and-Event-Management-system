import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns the admin user ID so users can address messages to them
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  return NextResponse.json({ adminId: admin?.id ?? null, myId: user.id })
}
