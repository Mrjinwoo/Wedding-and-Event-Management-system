import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mfaVerifySchema } from '@/lib/validation'
import { logActivity } from '@/lib/activity'

// POST /api/auth/mfa/verify
// Step-up: elevates an aal1 staff session to aal2 by verifying a live TOTP code.
// The client (admin/mfa/challenge page) obtains a challengeId from
// GET /api/auth/mfa/challenge, then POSTs here with the factorId + challengeId + code.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = mfaVerifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { factorId, challengeId, code } = parsed.data
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('incorrect')) {
        return NextResponse.json(
          { error: 'Incorrect code. Check your authenticator and try again.' },
          { status: 400 }
        )
      }
      if (msg.includes('expired')) {
        return NextResponse.json(
          {
            error:
              'Challenge expired. Please go back and try again.',
          },
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

    await logActivity({
      userId: user.id,
      action: 'MFA_VERIFIED',
      entity: 'profiles',
      entityId: user.id,
      details: { factorId, aal: data.currentLevel },
    }).catch(() => null)

    return NextResponse.json({
      message: 'MFA verified. You now have full admin access.',
      aal: data.currentLevel, // should be 'aal2'
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/auth/mfa/verify
// Issues a fresh challenge for a given factorId and returns the challengeId.
// The challenge page calls this first, then POSTs with the TOTP code.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const factorId = searchParams.get('factorId')

    if (!factorId) {
      return NextResponse.json(
        { error: 'factorId query param required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.auth.mfa.challenge({ factorId })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      challengeId: data.id,
      expiresAt: data.expires_at,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
