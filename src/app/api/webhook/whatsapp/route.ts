import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/features/whatsapp/services/webhook.service'
import { connectToMongo } from '@/core/database/mongo'
import { AppError } from '@/core/errors/AppError'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  try {
    const responseChallenge = WebhookService.verify(mode, token, challenge)
    return new NextResponse(responseChallenge, { status: 200 })
  } catch (err: any) {
    const statusCode = err instanceof AppError ? err.statusCode : 500
    return NextResponse.json({ error: err.message }, { status: statusCode })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToMongo()
    
    const signature = req.headers.get('x-hub-signature-256')
    const rawBody = await req.text()

    const result = await WebhookService.processIncomingMessage(rawBody, signature)
    
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]', err)
    const statusCode = err instanceof AppError ? err.statusCode : 500
    // Always return 200 to Meta unless it's a critical infrastructure failure (auth), 
    // otherwise Meta will pause webhooks if they receive too many 4xx/5xx
    if (statusCode === 401 || statusCode === 403) {
      return NextResponse.json({ error: err.message }, { status: statusCode })
    }
    return NextResponse.json({ error: 'Processed with errors' }, { status: 200 })
  }
}
