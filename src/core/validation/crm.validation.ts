import { z } from 'zod'

export const ContactCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional()
})

export const ContactUpdateSchema = ContactCreateSchema.partial()

export const OpportunityCreateSchema = z.object({
  contactId: z.string().uuid("Invalid Contact ID"),
  title: z.string().min(1, "Title is required"),
  value: z.number().min(0).default(0.0),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).default('LEAD'),
  expectedClose: z.string().datetime().optional()
})

export const OpportunityUpdateSchema = OpportunityCreateSchema.partial()

export const TaskCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
})

export const TaskUpdateSchema = TaskCreateSchema.partial()
