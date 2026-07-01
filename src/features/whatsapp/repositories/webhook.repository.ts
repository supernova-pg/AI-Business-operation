// Fix #12 & #17: Import WhatsappPayload from the canonical models file, not a duplicate schema definition.
import { WhatsappPayloadModel } from '@/features/ai/repositories/models'
import { ensureMongoConnected } from '@/features/ai/repositories/models'
import type { IWhatsappPayload } from '@/features/ai/repositories/models'

export class WebhookRepository {
  static async create(data: Pick<IWhatsappPayload, 'payload' | 'processed'>) {
    await ensureMongoConnected()
    return WhatsappPayloadModel.create(data)
  }
}
