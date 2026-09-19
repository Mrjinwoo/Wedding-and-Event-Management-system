import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { fullName, email, phone, password } = parsed.data
    const supabase = await createClient()

    console.log('[register] attempting signup for:', email)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone ?? '',
          role: 'user',
        },
      },
    })

    if (signUpError) {
      // Log full error details server-side
      console.error('[register] signUp error:', {
        message: signUpError.message,
        status: signUpError.status,
        name: signUpError.name,
      })

      // User-friendly messages
      const msg = signUpError.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Try logging in.' },
          { status: 400 }
        )
      }
      if (msg.includes('password')) {
        return NextResponse.json(
          { error: 'Password is too weak. Use at least 6 characters.' },
          { status: 400 }
        )
      }
      if (msg.includes('database')) {
        return NextResponse.json(
          { error: 'Database error — please run the profiles trigger fix in Supabase SQL Editor.' },
          { status: 400 }
        )
      }
      // Return raw message so you can see exactly what Supabase says
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    console.log('[register] signUp result:', {
      userId: data.user?.id,
      email: data.user?.email,
      confirmed: data.user?.email_confirmed_at,
    })

    if (!data.user) {
      return NextResponse.json(
        { error: 'Could not create account. Please try again.' },
        { status: 400 }
      )
    }

    await logActivity({
      userId: data.user.id,
      action: 'USER_REGISTERED',
      entity: 'profiles',
      entityId: data.user.id,
      details: { email, fullName },
    }).catch(() => null)

    return NextResponse.json({
      message: 'Registration successful. A verification code has been sent to your email.',
      userId: data.user.id,
    })
  } catch (err) {
    console.error('[register] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
