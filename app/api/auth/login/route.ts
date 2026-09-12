import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Fetch profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, is_active')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_active) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact admin.' },
        { status: 403 }
      )
    }

    await logActivity({
      userId: data.user.id,
      action: 'USER_LOGIN',
      entity: 'profiles',
      entityId: data.user.id,
      details: { email },
    })

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role ?? 'user',
        fullName: profile?.full_name,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
