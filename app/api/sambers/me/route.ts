import { NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'

export async function GET() {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }
  return NextResponse.json({ userId: auth.userId, role: auth.role })
}
