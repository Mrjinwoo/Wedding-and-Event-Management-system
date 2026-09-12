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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone ?? '', role: 'user' },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logActivity({
      userId: data.user?.id ?? null,
      action: 'USER_REGISTERED',
      entity: 'profiles',
      entityId: data.user?.id,
      details: { email, fullName },
    })

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: data.user?.id,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
