import { logger } from '@/core/logger/logger'
import { AppError } from '@/core/errors/AppError'

async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try {
    return await operation()
  } catch (err: any) {
    if (retries > 0 && (err.statusCode === 429 || err.statusCode >= 500)) {
      logger.warn(`[WhatsApp Retry] Attempt failed. Retrying in ${delay}ms... (${retries} left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return withRetry(operation, retries - 1, delay * 2)
    }
    throw err
  }
}

export interface IWhatsappAdapter {
  sendMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string }>
}

export class MockWhatsappAdapter implements IWhatsappAdapter {
  async sendMessage(to: string, message: string) {
    logger.info(`[Mock WhatsApp] Message sent to ${to}: ${message}`)
    return {
      success: true,
      messageId: `mock-wa-${Date.now()}`
    }
  }
}

export class MetaWhatsappAdapter implements IWhatsappAdapter {
  private accessToken: string
  private phoneId: string

  constructor(accessToken: string, phoneId: string) {
    this.accessToken = accessToken
    this.phoneId = phoneId
  }

  async sendMessage(to: string, message: string) {
    const url = `https://graph.facebook.com/v17.0/${this.phoneId}/messages`
    
    const operation = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        logger.error('[Meta WhatsApp API Error]', data)
        throw new AppError(`WhatsApp API Error: ${data.error?.message || 'Unknown error'}`, response.status)
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id
      }
    }

    try {
      return await withRetry(operation)
    } catch (err: any) {
      logger.error('[Meta WhatsApp Fetch Error Final]', err)
      throw new AppError(err.message || 'Failed to send WhatsApp message after retries', err.statusCode || 500)
    }
  }
}

export class WhatsappFactory {
  static getAdapter(): IWhatsappAdapter {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_ID

    if (accessToken && phoneId) {
      return new MetaWhatsappAdapter(accessToken, phoneId)
    }
    
    logger.warn('WhatsApp credentials missing (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID). Falling back to MockAdapter.')
    return new MockWhatsappAdapter()
  }
}
