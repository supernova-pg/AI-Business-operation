import mongoose, { Schema, Document, Model } from 'mongoose'

// --- Inbox Thread Model ---
export interface IInboxThread extends Document {
  tenantId: string
  contactId?: string
  contactName?: string
  channel: 'WHATSAPP' | 'EMAIL' | 'CALL'
  status: 'OPEN' | 'RESOLVED'
  unreadCount: number
  snippet: string
  aiSummary?: string
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  intent?: string
  nextAction?: string
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

const InboxThreadSchema = new Schema<IInboxThread>(
  {
    tenantId: { type: String, required: true },
    contactId: { type: String },
    contactName: { type: String, default: 'Unknown Contact' },
    channel: { type: String, enum: ['WHATSAPP', 'EMAIL', 'CALL'], required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
    unreadCount: { type: Number, default: 0 },
    snippet: { type: String, default: '' },
    aiSummary: { type: String },
    sentiment: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] },
    intent: { type: String },
    nextAction: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)
InboxThreadSchema.index({ tenantId: 1, lastMessageAt: -1 })
InboxThreadSchema.index({ tenantId: 1, channel: 1 })
InboxThreadSchema.index({ tenantId: 1, updatedAt: 1 }) // Fix for SSE Polling CPU usage
InboxThreadSchema.index({ snippet: 'text', contactName: 'text' }) // Fix for Text Search Efficiency

export const InboxThreadModel: Model<IInboxThread> =
  mongoose.models.InboxThread ?? mongoose.model<IInboxThread>('InboxThread', InboxThreadSchema)


// --- Inbox Message Model ---
export interface IInboxMessage extends Document {
  tenantId: string
  threadId: string
  direction: 'INBOUND' | 'OUTBOUND'
  content: string
  externalId?: string
  metadata?: any
  createdAt: Date
}

const InboxMessageSchema = new Schema<IInboxMessage>(
  {
    tenantId: { type: String, required: true },
    threadId: { type: String, required: true },
    direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
    content: { type: String, required: true },
    externalId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)
InboxMessageSchema.index({ threadId: 1, createdAt: 1 })
InboxMessageSchema.index({ tenantId: 1, createdAt: -1 })
InboxMessageSchema.index({ tenantId: 1, externalId: 1 }, { unique: true, sparse: true })

export const InboxMessageModel: Model<IInboxMessage> =
  mongoose.models.InboxMessage ?? mongoose.model<IInboxMessage>('InboxMessage', InboxMessageSchema)
