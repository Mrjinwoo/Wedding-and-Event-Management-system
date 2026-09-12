import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { venueSchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

// GET /api/venues — public listing with search & filter
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '12')
  const from = (page - 1) * limit

  let query = supabase
    .from('venues')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .range(from, from + limit - 1)
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('name', `%${search}%`)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}

// POST /api/venues — admin only
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = venueSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, description, location, capacity, price, imageUrl, isActive } = parsed.data
  const { data, error } = await supabase.from('venues').insert({
    name, description, location, capacity, price,
    image_url: imageUrl,
    is_active: isActive,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({ userId: user.id, action: 'CREATE_VENUE', entity: 'venues', entityId: data.id })
  return NextResponse.json({ data }, { status: 201 })
}

// PATCH /api/venues — admin only
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('venues')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({ userId: user.id, action: 'UPDATE_VENUE', entity: 'venues', entityId: id })
  return NextResponse.json({ message: 'Venue updated' })
}

// DELETE /api/venues?id=xxx — admin only
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('venues').update({ is_active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({ userId: user.id, action: 'DELETE_VENUE', entity: 'venues', entityId: id })
  return NextResponse.json({ message: 'Venue deactivated' })
}
