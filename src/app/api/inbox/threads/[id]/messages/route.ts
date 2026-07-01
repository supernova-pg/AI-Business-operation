import { NextRequest, NextResponse } from 'next/server'
import { InboxService } from '@/features/inbox/services/inbox.service'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') || undefined
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  // Mark as read when fetching messages
  await InboxService.markAsRead(params.id, tenantId)

  const result = await InboxService.getMessages(params.id, tenantId, cursor, limit)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, direction = 'OUTBOUND' } = await req.json()
  if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  const message = await InboxService.appendMessage(tenantId, params.id, direction, content)
  
  return NextResponse.json(message, { status: 201 })
}
