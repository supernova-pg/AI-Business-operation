import { z } from 'zod'

export const TenantCreateSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  domain: z.string().optional()
})

export const UserCreateSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().optional(),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'MEMBER']).default('MEMBER'),
  tenantId: z.string().uuid("Invalid Tenant ID")
})

export const UserUpdateSchema = UserCreateSchema.partial()

export const LoginSchema = z.object({
  code: z.string().min(1, "Code is required"),
  codeVerifier: z.string().min(1, "Code verifier is required")
})
