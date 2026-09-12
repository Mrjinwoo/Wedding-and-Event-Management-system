import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resetPasswordSchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { password } = parsed.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logActivity({
      userId: user.id,
      action: 'PASSWORD_RESET',
      entity: 'profiles',
      entityId: user.id,
    })

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
