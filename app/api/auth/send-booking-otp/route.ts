import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendOtpSchema } from '@/lib/validation'

// POST /api/auth/send-booking-otp
// Sends a passwordless 6-digit OTP to a client email so they can unlock
// the booking form. Uses signInWithOtp so the code arrives via the
// "Magic Link" email template — make sure that template uses {{ .Token }}
// instead of {{ .ConfirmationURL }} in the Supabase dashboard.
//
// Clients who already have a session are allowed through without a new send
// (their email is already verified). The booking page should still call
// /api/auth/verify-otp once the user submits the code to upgrade the session.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = sendOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data
    const supabase = await createClient()

    // If the caller is already logged in and their email matches, skip the send.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email === email) {
      return NextResponse.json({
        message: 'Email already verified.',
        alreadyVerified: true,
      })
    }

    // signInWithOtp sends a 6-digit code when the email template uses {{ .Token }}.
    // shouldCreateUser: true lets first-time clients self-verify without a
    // separate registration step.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // No emailRedirectTo — we want a code, not a magic link.
      },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('rate limit') || error.status === 429) {
        return NextResponse.json(
          { error: 'Please wait 60 seconds before requesting another code.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'A 6-digit verification code has been sent to your email.',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
