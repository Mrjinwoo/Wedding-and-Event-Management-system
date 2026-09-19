import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const { email, token, type } = await req.json()

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      )
    }

    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type ?? 'email', // 'email' for signup OTP
    })

    if (error) {
      // Provide user-friendly messages
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'OTP has expired. Please request a new one.' },
          { status: 400 }
        )
      }
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'Invalid OTP code. Please check and try again.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Mark profile as active now that email is verified
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', data.user.id)

      await logActivity({
        userId: data.user.id,
        action: 'EMAIL_VERIFIED',
        entity: 'profiles',
        entityId: data.user.id,
        details: { email },
      })
    }

    return NextResponse.json({
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
