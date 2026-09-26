import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const protectedRoutes = ['/dashboard', '/admin']
  const adminRoutes = ['/admin']
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

  // Not logged in → redirect to login for protected routes
  if (!user && protectedRoutes.some(r => path.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // Logged in → redirect away from auth pages
  if (user && authRoutes.some(r => path === r)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Admin-only routes — check role AND aal2
  if (user && adminRoutes.some(r => path.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // MFA enrollment and challenge pages are exempt — staff must reach them
    // at aal1 to complete the step-up. All other /admin/* pages require aal2.
    const mfaExempt =
      path.startsWith('/admin/mfa/enroll') ||
      path.startsWith('/admin/mfa/challenge')

    if (!mfaExempt) {
      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      const currentLevel = aalData?.currentLevel ?? 'aal1'
      const nextLevel    = aalData?.nextLevel    ?? 'aal1'

      // nextLevel === 'aal2' means the user HAS an enrolled factor but
      // hasn't completed the challenge yet in this session.
      if (nextLevel === 'aal2' && currentLevel !== 'aal2') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/mfa/challenge'
        url.searchParams.set('next', path)
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
