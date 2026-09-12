import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { messageSchema } from '@/lib/validation'

// GET /api/messages — conversation thread
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const withUserId = searchParams.get('with')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id ( full_name, avatar_url ),
      receiver:receiver_id ( full_name, avatar_url )
    `)
    .order('created_at', { ascending: true })

  if (profile?.role === 'admin' && withUserId) {
    // Admin viewing thread with specific user
    query = query.or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${user.id})`
    )
  } else {
    // User views their own thread
    query = query.or(
      `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ data })
}

// POST /api/messages — send message
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { receiverId, content, bookingId } = parsed.data

  const { data, error } = await supabase.from('messages').insert({
    sender_id: user.id,
    receiver_id: receiverId,
    content,
    booking_id: bookingId ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create notification for receiver
  await supabase.from('notifications').insert({
    user_id: receiverId,
    title: 'New Message',
    body: content.slice(0, 80),
    link: '/dashboard/messages',
  })

  return NextResponse.json({ data }, { status: 201 })
}
