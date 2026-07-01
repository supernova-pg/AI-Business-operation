import { NextRequest } from 'next/server'
import { ChatService } from '@/features/ai/services/chat.service'
import { AppError } from '@/core/errors/AppError'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id')
    const userId = req.headers.get('x-user-id')

    if (!tenantId || !userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized context' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { message, conversationId } = await req.json()

    if (!message || !conversationId) {
      return new Response(JSON.stringify({ error: 'Message and conversationId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = await ChatService.streamResponse(tenantId, userId, conversationId, message)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('AI chat endpoint error:', error)
    if (error instanceof AppError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
