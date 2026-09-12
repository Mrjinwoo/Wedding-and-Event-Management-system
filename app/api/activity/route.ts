import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/activity — user sees own logs, admin sees all
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const from = (page - 1) * limit

  let query = supabase
    .from('activity_logs')
    .select(`*, profiles:user_id ( full_name )`, { count: 'exact' })
    .range(from, from + limit - 1)
    .order('created_at', { ascending: false })

  // Non-admins only see own activity
  if (profile?.role !== 'admin') {
    query = query.eq('user_id', user.id)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}
