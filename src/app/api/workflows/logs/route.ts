import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/core/database/mongo'
import { WorkflowExecutionLogModel } from '@/features/workflows/repositories/workflow-log.repository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectToMongo()
    const logs = await WorkflowExecutionLogModel.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({ data: logs })
  } catch (err: any) {
    console.error('Failed to fetch workflow logs:', err)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
