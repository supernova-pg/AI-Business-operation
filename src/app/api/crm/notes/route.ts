import { NextRequest, NextResponse } from 'next/server'
import { NoteService } from '@/features/crm/services/note.service'
import { CreateNoteSchema, NoteQuerySchema } from '@/features/crm/validation'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const queryObj = Object.fromEntries(searchParams.entries())

  const parsed = NoteQuerySchema.safeParse(queryObj)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
  }

  const { contactId, opportunityId } = parsed.data

  if (contactId) {
    const notes = await NoteService.getContactNotes(contactId, tenantId)
    return NextResponse.json(notes)
  }

  if (opportunityId) {
    const notes = await NoteService.getOpportunityNotes(opportunityId, tenantId)
    return NextResponse.json(notes)
  }

  return NextResponse.json({ error: 'Must provide contactId or opportunityId' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id')
  const userId = req.headers.get('x-user-id')
  if (!tenantId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const note = await NoteService.createNote(tenantId, userId, parsed.data)
  return NextResponse.json(note, { status: 201 })
}
