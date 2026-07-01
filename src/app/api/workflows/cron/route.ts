import { NextRequest, NextResponse } from 'next/server'
import { WorkflowEngine } from '@/features/workflows/services/workflow-engine.service'
import { logger } from '@/core/logger/logger'

// Vercel Cron sends a Bearer token matching CRON_SECRET if configured.
// Alternatively, any cron service can pass ?secret=XYZ or Header Authorization: Bearer XYZ
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret) {
    if (authHeader !== `Bearer ${expectedSecret}`) {
      logger.warn('Unauthorized cron invocation attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    logger.warn('CRON_SECRET is not set. Cron endpoint is unprotected.')
  }

  try {
    logger.info('Cron triggered: recoverOrphanedWorkflows')
    await WorkflowEngine.recoverOrphanedWorkflows()
    return NextResponse.json({ success: true, message: 'Orphan recovery initiated' })
  } catch (error: any) {
    logger.error('Cron failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
