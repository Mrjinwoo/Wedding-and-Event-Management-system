import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/reports — admin analytics
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Run all queries in parallel
  const [
    { count: totalUsers },
    { count: totalBookings },
    { count: pendingBookings },
    { count: confirmedBookings },
    { count: cancelledBookings },
    { count: completedBookings },
    { data: revenueData },
    { data: recentBookings },
    { data: venueStats },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('bookings').select('total_price').in('status', ['confirmed', 'completed']),
    supabase.from('bookings')
      .select('*, profiles:user_id(full_name), venues:venue_id(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('bookings')
      .select('venue_id, venues:venue_id(name)')
      .eq('status', 'confirmed'),
  ])

  const totalRevenue = revenueData?.reduce((sum, b) => sum + Number(b.total_price), 0) ?? 0

  // Count bookings per venue
  const venueBookingMap: Record<string, { name: string; count: number }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  venueStats?.forEach((b: any) => {
    const vid = b.venue_id as string
    const venueName = Array.isArray(b.venues) ? b.venues[0]?.name : b.venues?.name
    if (!venueBookingMap[vid]) venueBookingMap[vid] = { name: venueName ?? 'Unknown', count: 0 }
    venueBookingMap[vid].count++
  })
  const topVenues = Object.values(venueBookingMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return NextResponse.json({
    stats: {
      totalUsers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
    },
    recentBookings,
    topVenues,
  })
}
