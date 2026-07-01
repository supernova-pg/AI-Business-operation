import { NextRequest, NextResponse } from 'next/server'
import { OpportunityService } from '@/features/crm/services/opportunity.service'
import { CreateOpportunitySchema } from '@/features/crm/validation'
import { withApiHandler } from '@/core/api/api-handler'
import { AppError } from '@/core/errors/AppError'

export const GET = withApiHandler(async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) throw new AppError('Unauthorized', 401)

  const result = await OpportunityService.getOpportunities(tenantId)
  return NextResponse.json(result)
})

export const POST = withApiHandler(async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) throw new AppError('Unauthorized', 401)

  const body = await req.json()
  const parsed = CreateOpportunitySchema.parse(body)

  const opportunity = await OpportunityService.createOpportunity(tenantId, parsed)
  return NextResponse.json(opportunity, { status: 201 })
})
