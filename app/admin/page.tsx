import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch reports in parallel
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports`, {
    headers: { cookie: '' }, // Server-side fetch; auth handled by Supabase session
    cache: 'no-store',
  }).catch(() => null)

  // Fallback: query directly
  const [
    { count: totalUsers },
    { count: totalBookings },
    { count: pendingBookings },
    { count: confirmedBookings },
    { data: recentBookings },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('bookings')
      .select('*, profiles:user_id(full_name), venues:venue_id(name)')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('profiles')
      .select('*').order('created_at', { ascending: false }).limit(6),
  ])

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    completed: 'bg-blue-100 text-blue-700',
  }

  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <div className="bg-[#1a1a1a] py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-display text-2xl font-bold">Admin Panel</h1>
            <p className="text-white/50 text-xs mt-0.5">Welcome, {profile?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="text-white/70 hover:text-white text-sm transition-colors">Users</Link>
            <Link href="/admin/bookings" className="text-white/70 hover:text-white text-sm transition-colors">Bookings</Link>
            <Link href="/admin/venues" className="text-white/70 hover:text-white text-sm transition-colors">Venues</Link>
            <Link href="/admin/messages" className="text-white/70 hover:text-white text-sm transition-colors">Messages</Link>
            <LogoutButton className="text-sm font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: totalUsers ?? 0, icon: '👥', color: 'bg-white' },
            { label: 'Total Bookings', value: totalBookings ?? 0, icon: '📋', color: 'bg-white' },
            { label: 'Pending', value: pendingBookings ?? 0, icon: '⏳', color: 'bg-yellow-50' },
            { label: 'Confirmed', value: confirmedBookings ?? 0, icon: '✅', color: 'bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-5 shadow-sm border border-gray-100`}>
              <span className="text-2xl">{stat.icon}</span>
              <p className="font-display text-3xl font-bold text-[#1a1a1a] mt-2">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-[#1a1a1a]">Recent Bookings</h2>
              <Link href="/admin/bookings" className="text-xs text-[#9B2C4A] hover:underline font-medium">Manage →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentBookings?.map(b => (
                <div key={b.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#1a1a1a] truncate">{b.event_type}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {(b.profiles as {full_name:string}|null)?.full_name} · {(b.venues as {name:string}|null)?.name}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.status}
                  </span>
                </div>
              )) ?? <p className="px-6 py-8 text-center text-gray-400 text-sm">No bookings yet.</p>}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-[#1a1a1a]">Recent Users</h2>
              <Link href="/admin/users" className="text-xs text-[#9B2C4A] hover:underline font-medium">Manage →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentUsers?.map(u => (
                <div key={u.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#1a1a1a] truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.phone ?? 'No phone'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    {!u.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                </div>
              )) ?? <p className="px-6 py-8 text-center text-gray-400 text-sm">No users yet.</p>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Manage Users', href: '/admin/users', icon: '👥' },
            { label: 'Manage Bookings', href: '/admin/bookings', icon: '📋' },
            { label: 'Manage Venues', href: '/admin/venues', icon: '🏛️' },
            { label: 'View Reports', href: '/admin/reports', icon: '📊' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="bg-white hover:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-gray-100 text-center transition-colors group">
              <span className="text-3xl block mb-2">{a.icon}</span>
              <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-white transition-colors">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
