import { z } from 'zod'

export const BusinessSettingsSchema = z.object({
  companyName: z.string().optional(),
  timezone: z.string().default('UTC'),
  webhookSecret: z.string().optional(),
  aiModelDefault: z.string().default('gemini-2.5-flash')
})
