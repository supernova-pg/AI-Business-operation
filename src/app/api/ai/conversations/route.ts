import { NextRequest, NextResponse } from 'next/server'
import { ConversationModel } from '@/features/ai/repositories/models'
import { connectToMongo } from '@/core/database/mongo'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id')
  const userId = req.headers.get('x-user-id')

  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectToMongo()
  
  const conversations = await ConversationModel.find({ tenantId, userId })
    .sort({ updatedAt: -1 })
    .lean()

  return NextResponse.json(conversations)
}
