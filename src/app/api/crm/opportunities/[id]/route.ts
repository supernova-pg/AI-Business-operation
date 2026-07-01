import { NextRequest, NextResponse } from 'next/server'
import { OpportunityService } from '@/features/crm/services/opportunity.service'
import { UpdateOpportunitySchema } from '@/features/crm/validation'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const opportunity = await OpportunityService.getOpportunityById(params.id, tenantId)
  if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(opportunity)
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateOpportunitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await OpportunityService.updateOpportunity(params.id, tenantId, parsed.data)
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await OpportunityService.deleteOpportunity(params.id, tenantId)
  return NextResponse.json({ success: true })
}
