import { z } from 'zod'

export const CreateContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
})

export const UpdateContactSchema = CreateContactSchema.partial()

export const CreateOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  value: z.number().min(0).default(0),
  probability: z.number().int().min(0).max(100).default(0),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).default('LEAD'),
  expectedClose: z.string().datetime().optional().nullable(),
  contactId: z.string().uuid('Invalid contact ID'),
})

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial()

export const CreateNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
  contactId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
}).refine(data => data.contactId || data.opportunityId, {
  message: "Note must be attached to either a Contact or an Opportunity",
  path: ["contactId"]
})

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
})

export const ContactQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'company']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const NoteQuerySchema = z.object({
  contactId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable()
}).refine(data => data.contactId || data.opportunityId, {
  message: "Must provide either contactId or opportunityId"
})
