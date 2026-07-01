import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/features/crm/services/task.service'
import { CreateTaskSchema } from '@/features/crm/validation'
import { withApiHandler } from '@/core/api/api-handler'
import { AppError } from '@/core/errors/AppError'

export const GET = withApiHandler(async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) throw new AppError('Unauthorized', 401)

  const result = await TaskService.getTasks(tenantId)
  return NextResponse.json(result)
})

export const POST = withApiHandler(async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) throw new AppError('Unauthorized', 401)

  const body = await req.json()
  const parsed = CreateTaskSchema.parse(body)

  const task = await TaskService.createTask(tenantId, parsed)
  return NextResponse.json(task, { status: 201 })
})
