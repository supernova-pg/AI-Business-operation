import { GoogleGenAI } from '@google/genai'
import { InboxThreadModel, InboxMessageModel } from '../repositories/models'
import { logger } from '@/core/logger/logger'

const apiKey = process.env.GEMINI_API_KEY
// Fallback gracefully if no key is provided in dev
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export class AiEnrichmentService {
  static async enrichThread(threadId: string, tenantId: string) {
    if (!ai) {
      logger.warn('Skipping AI enrichment - GEMINI_API_KEY not set.')
      return
    }

    try {
      // 1. Fetch recent messages
      const messages = await InboxMessageModel.find({ threadId, tenantId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
      
      if (messages.length === 0) return

      // Reverse to chronological order
      messages.reverse()
      const chatText = messages.map(m => `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.content}`).join('\n')

      const prompt = `
        Analyze the following conversation thread between a Customer and an Agent.
        Provide a JSON response with exactly these fields:
        - summary: A very brief 1-sentence summary of the conversation state.
        - sentiment: Exactly one of "POSITIVE", "NEUTRAL", or "NEGATIVE".
        - intent: A 2-4 word description of the customer's intent (e.g. "Pricing Inquiry", "Support Request").
        - nextAction: A short, 1-sentence recommendation for what the Agent should do next.

        Conversation:
        ${chatText}
      `

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      })

      const rawText = response.text || '{}'
      const parsed = JSON.parse(rawText)

      // 2. Update the Thread
      await InboxThreadModel.updateOne(
        { _id: threadId, tenantId },
        { 
          $set: {
            aiSummary: parsed.summary || 'Summary unavailable',
            sentiment: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(parsed.sentiment) ? parsed.sentiment : 'NEUTRAL',
            intent: parsed.intent || 'Unknown',
            nextAction: parsed.nextAction || 'Reply to customer'
          }
        }
      )
    } catch (error) {
      logger.error('Failed to enrich thread with AI:', error)
    }
  }
}
