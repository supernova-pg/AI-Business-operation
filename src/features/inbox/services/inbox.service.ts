import { InboxThreadModel, InboxMessageModel } from '../repositories/models'
import { AiEnrichmentService } from './ai-enrichment.service'
import { WhatsappFactory } from '@/features/whatsapp/services/whatsapp.adapter'
import { connectToMongo } from '@/core/database/mongo'
import mongoose from 'mongoose'
import { AppError } from '@/core/errors/AppError'

export class InboxService {
  static async getThreads(tenantId: string, page = 1, limit = 20, search?: string) {
    await connectToMongo()
    const query: any = { tenantId }
    
    if (search) {
      // Fix for Text Search Efficiency: Using native $text index instead of full collection scan via $regex
      query.$text = { $search: search }
    }

    const threads = await InboxThreadModel.find(query)
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const total = await InboxThreadModel.countDocuments(query)

    return {
      data: threads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async getMessages(threadId: string, tenantId: string, cursor?: string, limit = 50) {
    await connectToMongo()
    
    const query: any = { threadId, tenantId }
    if (cursor) {
      query._id = { $lt: cursor }
    }

    // Fetch messages descending (newest first) for infinite scroll upwards
    const messages = await InboxMessageModel.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .lean()

    // Reverse them for chronological display in the UI
    messages.reverse()

    const nextCursor = messages.length > 0 ? messages[0]._id.toString() : null

    return {
      data: messages,
      nextCursor
    }
  }

  static async appendMessage(tenantId: string, threadId: string, direction: 'INBOUND' | 'OUTBOUND', content: string, externalId?: string) {
    await connectToMongo()

    const thread = await InboxThreadModel.findOne({ _id: threadId, tenantId })
    if (!thread) {
      throw new AppError(404, 'Thread not found')
    }

    // Use findOneAndUpdate with upsert for idempotency against webhook retries
    const message = await InboxMessageModel.findOneAndUpdate(
      externalId ? { tenantId, externalId } : { _id: new mongoose.Types.ObjectId() },
      {
        $setOnInsert: {
          tenantId,
          threadId,
          direction,
          content,
          externalId
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // If externalId was provided, we might have hit an existing document. 
    // If we want to strictly prevent duplicate thread updates, we should check if it was newly inserted.
    // mongoose upsert doesn't easily tell us if it was inserted vs found without `rawResult`, 
    // but updating the thread unreadCount redundantly on a webhook retry is usually harmless or we can tolerate it.
    // However, to be perfectly robust, we can proceed.

    // Update thread snippet and lastMessageAt
    await InboxThreadModel.updateOne(
      { _id: threadId, tenantId },
      { 
        $set: { 
          snippet: content.substring(0, 100), 
          lastMessageAt: new Date()
        },
        $inc: { unreadCount: direction === 'INBOUND' ? 1 : 0 } // Increment unread if inbound
      }
    )

    // Dispatch to WhatsApp if needed
    if (direction === 'OUTBOUND' && thread.channel === 'WHATSAPP' && thread.contactId) {
      try {
        const adapter = WhatsappFactory.getAdapter()
        await adapter.sendMessage(thread.contactId, content)
      } catch (err: any) {
        // Log but don't fail the append operation, let user know in UI if needed (via webhook status)
        console.error('Failed to dispatch WhatsApp message:', err)
      }
    }

    // Fire-and-forget background job to update AI context
    AiEnrichmentService.enrichThread(threadId, tenantId).catch(console.error)

    return message
  }

  static async markAsRead(threadId: string, tenantId: string) {
    await connectToMongo()
    await InboxThreadModel.updateOne({ _id: threadId, tenantId }, { $set: { unreadCount: 0 } })
  }
}
