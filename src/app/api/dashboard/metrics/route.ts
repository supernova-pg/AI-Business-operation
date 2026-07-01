import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/core/database/prisma'
import { connectToMongo } from '@/core/database/mongo'
import { WorkflowExecutionLogModel } from '@/features/workflows/repositories/workflow-log.repository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d' // '7d', '30d', '90d'

    let days = 30
    if (period === '7d') days = 7
    if (period === '90d') days = 90
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 1. Pipeline Revenue (Active Opportunities)
    const activeOpportunities = await prisma.opportunity.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        stage: { notIn: ['WON', 'LOST'] },
        createdAt: { gte: startDate }
      },
      _sum: { value: true }
    })
    const pipelineValue = Number(activeOpportunities._sum.value || 0)

    // 2. Pending Tasks
    const pendingTasks = await prisma.task.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: 'DONE' },
        createdAt: { gte: startDate }
      }
    })

    // 3. Lead Conversion
    const totalOpps = await prisma.opportunity.count({
      where: { tenantId, deletedAt: null, createdAt: { gte: startDate } }
    })
    const wonOpps = await prisma.opportunity.count({
      where: { tenantId, deletedAt: null, stage: 'WON', createdAt: { gte: startDate } }
    })
    const leadConversionRate = totalOpps > 0 ? (wonOpps / totalOpps) * 100 : 0

    // 4. Opportunity Distribution
    const distributionGroups = await prisma.opportunity.groupBy({
      by: ['stage'],
      where: { tenantId, deletedAt: null, createdAt: { gte: startDate } },
      _count: { id: true }
    })
    const opportunityDistribution = distributionGroups.map(g => ({
      stage: g.stage,
      count: g._count.id
    }))

    // 5. Recent Activities
    const recentActivities = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // 6. AI Alerts (from MongoDB Workflows)
    await connectToMongo()
    const aiAlerts = await WorkflowExecutionLogModel.countDocuments({
      tenantId,
      status: 'FAILED',
      createdAt: { $gte: startDate }
    })

    return NextResponse.json({
      data: {
        pipelineValue,
        pendingTasks,
        leadConversionRate,
        opportunityDistribution,
        aiAlerts,
        recentActivities
      }
    })
  } catch (err: any) {
    console.error('Failed to fetch dashboard metrics:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
