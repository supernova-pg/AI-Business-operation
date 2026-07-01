import { NextRequest, NextResponse } from 'next/server'
import { MessageModel, ConversationModel } from '@/features/ai/repositories/models'
import { connectToMongo } from '@/core/database/mongo'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  const userId = req.headers.get('x-user-id')

  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectToMongo()

  const conversation = await ConversationModel.findOne({ _id: params.id, tenantId, userId }).lean()
  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const messages = await MessageModel.find({ conversationId: params.id, tenantId })
    .sort({ createdAt: 1 })
    .lean()

  return NextResponse.json(messages)
}
