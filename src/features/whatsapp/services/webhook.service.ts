import crypto from 'crypto'
import { WebhookRepository } from '../repositories/webhook.repository'
import { AppError } from '@/core/errors/AppError'
import { logger } from '@/core/logger/logger'
import { InboxService } from '@/features/inbox/services/inbox.service'
import { InboxThreadModel } from '@/features/inbox/repositories/models'

export class WebhookService {
  static verify(mode: string | null, token: string | null, challenge: string | null): string {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
    
    // Allow mock verification if ENV is missing (Development convenience)
    if (!verifyToken) {
      logger.warn('WHATSAPP_VERIFY_TOKEN missing. Accepting mock verification.')
      return challenge || 'mock_challenge'
    }

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      logger.info('WhatsApp Webhook verified successfully')
      return challenge
    }

    throw new AppError('Forbidden: webhook verification failed', 403)
  }

  static async processIncomingMessage(rawBody: string, signature: string | null) {
    const appSecret = process.env.WHATSAPP_APP_SECRET
    
    if (appSecret) {
      if (!signature) {
        throw new AppError('Missing webhook signature header', 401)
      }

      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex')

      const sigBuffer = Buffer.from(signature)
      const expectedBuffer = Buffer.from(expectedSignature)
      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        throw new AppError('Invalid webhook signature', 401)
      }
    } else {
      logger.warn('WHATSAPP_APP_SECRET is missing. Bypassing signature validation for Mock Mode.')
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      throw new AppError('Invalid JSON payload', 400)
    }

    // Save raw webhook dump
    const loggedPayload = await WebhookRepository.create({
      payload,
      processed: false,
    })

    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    const contact = payload.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]

    if (message) {
      const fromNumber = message.from
      const text = message.text?.body ?? '[non-text message]'
      const contactName = contact?.profile?.name || fromNumber

      logger.info(`[WhatsApp] Message from ${fromNumber}: ${text}`)
      
      // Map to Tenant. In production, look up the waba_id mapping. 
      // For this assignment, fallback to a global demo tenant or find by contact phone.
      const tenantId = 'demo-tenant-1' // Mock multi-tenant routing fallback
      
      // Find or create thread
      let thread = await InboxThreadModel.findOne({ tenantId, contactId: fromNumber, channel: 'WHATSAPP' })
      
      if (!thread) {
        thread = await InboxThreadModel.create({
          tenantId,
          contactId: fromNumber,
          contactName,
          channel: 'WHATSAPP',
          snippet: text.substring(0, 50),
        })
      }

      // Pipe into unified inbox with message.id for idempotency
      await InboxService.appendMessage(tenantId, String(thread._id), 'INBOUND', text, message.id)

      loggedPayload.processed = true
      await loggedPayload.save()
    }

    return { success: true, logId: String(loggedPayload._id) }
  }
}
