import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/features/crm/services/contact.service'
import { UpdateContactSchema } from '@/features/crm/validation'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contact = await ContactService.getContactById(params.id, tenantId)
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(contact)
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await ContactService.updateContact(params.id, tenantId, parsed.data)
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ContactService.deleteContact(params.id, tenantId)
  return NextResponse.json({ success: true })
}
