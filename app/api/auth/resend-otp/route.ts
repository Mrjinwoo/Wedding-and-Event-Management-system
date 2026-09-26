import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resendOtpSchema } from '@/lib/validation'

// POST /api/auth/resend-otp
// Rate-limited by Supabase (60 s). We surface the Retry-After header when
// Supabase returns a 429 so the client can count down without guessing.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = resendOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, type } = parsed.data
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
      type,          // 'signup' for email OTP; 'magiclink' for passwordless
      email,
      options: {
        // No emailRedirectTo — we want {{ .Token }} code, not a link.
        // Ensure the Supabase email template uses {{ .Token }} not {{ .ConfirmationURL }}.
      },
    })

    if (error) {
      // Supabase rate-limit returns "Email rate limit exceeded"
      const msg = error.message.toLowerCase()
      if (
        msg.includes('rate limit') ||
        msg.includes('too many') ||
        error.status === 429
      ) {
        return NextResponse.json(
          { error: 'Please wait 60 seconds before requesting another code.' },
          {
            status: 429,
            headers: { 'Retry-After': '60' },
          }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'A new verification code has been sent to your email.',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
