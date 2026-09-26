import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/auth/mfa/status
// Returns the first verified TOTP factorId for the current user, plus the
// current AAL level. Used by the MFA challenge page to know which factor to
// challenge and whether step-up has already been completed.
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [factorsResult, aalResult] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ])

    const verifiedTotp = (factorsResult.data?.totp ?? []).find(
      f => f.status === 'verified'
    )

    return NextResponse.json({
      factorId: verifiedTotp?.id ?? null,
      factorName: verifiedTotp?.friendly_name ?? null,
      enrolled: !!verifiedTotp,
      currentLevel: aalResult.data?.currentLevel ?? 'aal1',
      nextLevel: aalResult.data?.nextLevel ?? 'aal1',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
