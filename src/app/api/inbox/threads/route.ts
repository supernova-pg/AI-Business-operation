import { NextRequest, NextResponse } from 'next/server'
import { InboxService } from '@/features/inbox/services/inbox.service'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const search = searchParams.get('search') || undefined

  const result = await InboxService.getThreads(tenantId, page, limit, search)
  return NextResponse.json(result)
}
