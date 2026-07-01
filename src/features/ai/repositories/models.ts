/**
 * Fix #17: connectToMongo is not called per-method. Models are registered at module import time.
 * The connection is established lazily via connectToMongo() once per app lifecycle.
 * All models are exported from this single canonical file.
 * Fix #12: Schema definitions and model factories are co-located here; repositories import from this file.
 */
import mongoose, { Schema, Document, Model } from 'mongoose'
import { connectToMongo } from '@/core/database/mongo'

// Ensure connection is established when this module is first imported
let connectionPromise: Promise<void> | null = null

export async function ensureMongoConnected(): Promise<void> {
  if (!connectionPromise) {
    connectionPromise = connectToMongo().then(() => undefined)
  }
  return connectionPromise
}

// --- Conversation Model ---
export interface IConversation extends Document {
  tenantId: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    tenantId: { type: String, required: true },
    userId: { type: String, required: true },
    title: { type: String, default: 'New Conversation' },
    deletedAt: { type: Date },
  },
  { timestamps: true }
)
ConversationSchema.index({ tenantId: 1, userId: 1, deletedAt: 1 })

export const ConversationModel: Model<IConversation> =
  mongoose.models.Conversation ?? mongoose.model<IConversation>('Conversation', ConversationSchema)


// --- Message Model ---
export interface IMessage extends Document {
  tenantId: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens?: number
  createdAt: Date
  deletedAt?: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    tenantId: { type: String, required: true },
    conversationId: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    tokens: { type: Number },
    deletedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)
MessageSchema.index({ conversationId: 1, createdAt: 1 })
MessageSchema.index({ tenantId: 1, deletedAt: 1 })

export const MessageModel: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>('Message', MessageSchema)


// --- AI Context Model ---
export interface IAIContext extends Document {
  tenantId: string
  conversationId: string
  type: 'TOOL_OUTPUT' | 'RAG_SNIPPET' | 'SYSTEM_PROMPT'
  data: unknown
  expiresAt?: Date
  createdAt: Date
}

const AIContextSchema = new Schema<IAIContext>(
  {
    tenantId: { type: String, required: true },
    conversationId: { type: String, required: true },
    type: { type: String, enum: ['TOOL_OUTPUT', 'RAG_SNIPPET', 'SYSTEM_PROMPT'], required: true },
    data: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)
AIContextSchema.index({ tenantId: 1, conversationId: 1 })
AIContextSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

export const AIContextModel: Model<IAIContext> =
  mongoose.models.AIContext ?? mongoose.model<IAIContext>('AIContext', AIContextSchema)


// --- Streaming Cache Model (Ephemeral) ---
export interface IStreamingCache extends Document {
  tenantId: string
  streamId: string
  partialChunk: string
  createdAt: Date
}

const StreamingCacheSchema = new Schema<IStreamingCache>({
  tenantId: { type: String, required: true },
  streamId: { type: String, required: true, unique: true },
  partialChunk: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // Auto-prune after 1 hour
})

export const StreamingCacheModel: Model<IStreamingCache> =
  mongoose.models.StreamingCache ?? mongoose.model<IStreamingCache>('StreamingCache', StreamingCacheSchema)


// --- WhatsApp Payload Model ---
export interface IWhatsappPayload extends Document {
  tenantId?: string
  payload: unknown
  processed: boolean
  createdAt: Date
}

const WhatsappPayloadSchema = new Schema<IWhatsappPayload>({
  tenantId: { type: String },
  payload: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})
WhatsappPayloadSchema.index({ tenantId: 1 })
WhatsappPayloadSchema.index({ processed: 1, createdAt: 1 }) // for background job polling

export const WhatsappPayloadModel: Model<IWhatsappPayload> =
  mongoose.models.WhatsappPayload ?? mongoose.model<IWhatsappPayload>('WhatsappPayload', WhatsappPayloadSchema)
