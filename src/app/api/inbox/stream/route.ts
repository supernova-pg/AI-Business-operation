import { NextRequest } from 'next/server'
import { InboxThreadModel } from '@/features/inbox/repositories/models'
import { connectToMongo } from '@/core/database/mongo'

// A simple SSE implementation that polls MongoDB for changes on the thread list
// This simulates real-time updates for threads (like unreadCount or aiSummary changes)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) {
    return new Response('Unauthorized', { status: 401 })
  }

  await connectToMongo()

  let isClosed = false
  let lastUpdate = new Date()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval)
          return
        }

        try {
          // Poll for any threads updated since last check
          const updatedThreads = await InboxThreadModel.find({
            tenantId,
            updatedAt: { $gt: lastUpdate }
          }).lean()

          if (updatedThreads.length > 0) {
            lastUpdate = new Date()
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'threads_updated', payload: updatedThreads })}\n\n`)
            )
          }
        } catch (error) {
          console.error('SSE polling error:', error)
        }
      }, 3000) // Poll every 3 seconds

      req.signal.addEventListener('abort', () => {
        isClosed = true
        clearInterval(interval)
        controller.close()
      })
    },
    cancel() {
      isClosed = true
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
