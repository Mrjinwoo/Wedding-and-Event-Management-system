import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookingSchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

// GET /api/bookings — user's own bookings
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''

  let query = supabase
    .from('bookings')
    .select(`*, venues:venue_id ( name, location, image_url, price )`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/bookings — create booking
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { venueId, packageId, eventType, eventDate, guestCount, notes } = parsed.data

  // Get venue price
  const { data: venue } = await supabase
    .from('venues').select('price, is_active').eq('id', venueId).single()

  if (!venue?.is_active) {
    return NextResponse.json({ error: 'Venue is not available' }, { status: 400 })
  }

  const { data, error } = await supabase.from('bookings').insert({
    user_id: user.id,
    venue_id: venueId,
    package_id: packageId ?? null,
    event_type: eventType,
    event_date: eventDate,
    guest_count: guestCount,
    total_price: venue.price,
    notes: notes ?? '',
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({
    userId: user.id,
    action: 'CREATE_BOOKING',
    entity: 'bookings',
    entityId: data.id,
    details: { venueId, eventType, eventDate },
  })

  return NextResponse.json({ data }, { status: 201 })
}

// PATCH /api/bookings — user cancels own booking
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { bookingId } = body
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

  // Ensure user owns this booking
  const { data: booking } = await supabase
    .from('bookings').select('user_id, status').eq('id', bookingId).single()

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending bookings can be cancelled' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({
    userId: user.id, action: 'CANCEL_BOOKING', entity: 'bookings', entityId: bookingId,
  })

  return NextResponse.json({ message: 'Booking cancelled' })
}
