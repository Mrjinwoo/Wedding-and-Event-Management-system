import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  // Supabase sent back an explicit error (e.g. otp_expired, access_denied)
  // Surface it on the reset-password page instead of the login page
  if (error) {
    const isResetFlow = next === '/reset-password'
    if (isResetFlow) {
      return NextResponse.redirect(`${origin}/reset-password?error=auth_callback_failed`)
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message)
  }

  // Fallback — redirect to appropriate error page
  const isResetFlow = next === '/reset-password'
  if (isResetFlow) {
    return NextResponse.redirect(`${origin}/reset-password?error=auth_callback_failed`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
