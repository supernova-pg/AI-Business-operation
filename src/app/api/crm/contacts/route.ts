import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/features/crm/services/contact.service'
import { CreateContactSchema, ContactQuerySchema } from '@/features/crm/validation'
import { withApiHandler } from '@/core/api/api-handler'
import { AppError } from '@/core/errors/AppError'

export const GET = withApiHandler(async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) throw new AppError('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const queryObj = Object.fromEntries(searchParams.entries())

  const parsed = ContactQuerySchema.parse(queryObj)

  const result = await ContactService.getContacts({
    tenantId,
    ...parsed
  })

  return NextResponse.json(result)
})

export const POST = withApiHandler(async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) throw new AppError('Unauthorized', 401)

  const body = await req.json() // Automatically sanitized by withApiHandler
  const parsed = CreateContactSchema.parse(body)

  const contact = await ContactService.createContact(tenantId, parsed)
  return NextResponse.json(contact, { status: 201 })
})
