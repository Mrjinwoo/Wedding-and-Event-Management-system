import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyOtpSchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

// POST /api/auth/verify-otp
// Used by:
//   - /verify-email page (signup email confirmation)
//   - /book/verify  page (booking gate — same shape, type='email')
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = verifyOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, token, type } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type, // 'email' | 'magiclink' | 'email_change'
    })

    if (error) {
      const msg = error.message.toLowerCase()

      if (msg.includes('expired') || msg.includes('otp has expired')) {
        return NextResponse.json(
          { error: 'This code has expired. Please request a new one.' },
          { status: 400 }
        )
      }
      if (
        msg.includes('invalid') ||
        msg.includes('incorrect') ||
        msg.includes('token not found')
      ) {
        return NextResponse.json(
          { error: 'Incorrect code. Please check and try again.' },
          { status: 400 }
        )
      }
      if (msg.includes('rate limit') || error.status === 429) {
        return NextResponse.json(
          { error: 'Too many attempts. Please wait before trying again.' },
          { status: 429 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Verification failed. Please try again.' },
        { status: 400 }
      )
    }

    // Activate profile row now the email is confirmed
    await supabase
      .from('profiles')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', data.user.id)

    await logActivity({
      userId: data.user.id,
      action: 'EMAIL_VERIFIED',
      entity: 'profiles',
      entityId: data.user.id,
      details: { email, type },
    }).catch(() => null)

    return NextResponse.json({
      message: 'Email verified successfully.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
