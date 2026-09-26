import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

// POST /api/auth/login
// Step 1 of 2: verify email + password. If correct, send an OTP to the email
// and return { otpSent: true }. The client then shows the OTP input (step 2).
// Step 2 is handled client-side via supabase.auth.verifyOtp().
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const supabase = await createClient()

    // ── 1. Verify the password ───────────────────────────────────────────────
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      const msg = signInError.message.toLowerCase()
      if (msg.includes('email not confirmed')) {
        return NextResponse.json(
          { error: 'Please verify your email before logging in.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // ── 2. Check account is active ───────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', data.user.id)
      .single()

    if (profile?.is_active === false) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact admin.' },
        { status: 403 }
      )
    }

    // ── 3. Sign them out immediately — OTP is the real session gate ──────────
    // We only used signInWithPassword to confirm the password is correct.
    // The actual session will be established after OTP verification.
    await supabase.auth.signOut()

    // ── 4. Send OTP to the verified email ────────────────────────────────────
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (otpError) {
      console.error('[login] signInWithOtp error:', otpError.message)
      return NextResponse.json(
        { error: 'Could not send verification code. Please try again.' },
        { status: 500 }
      )
    }

    await logActivity({
      userId: data.user.id,
      action: 'USER_LOGIN_OTP_SENT',
      entity: 'profiles',
      entityId: data.user.id,
      details: { email },
    }).catch(() => null)

    return NextResponse.json({ otpSent: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
