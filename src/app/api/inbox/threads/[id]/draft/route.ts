import { NextRequest, NextResponse } from 'next/server'
import { InboxMessageModel, InboxThreadModel } from '@/features/inbox/repositories/models'
import { connectToMongo } from '@/core/database/mongo'
import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ai) {
    return NextResponse.json({ draft: "I'm sorry, AI features are not configured in this environment." })
  }

  try {
    await connectToMongo()
    const threadId = params.id

    const thread = await InboxThreadModel.findOne({ _id: threadId, tenantId })
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    const messages = await InboxMessageModel.find({ threadId, tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    messages.reverse()
    const chatText = messages.map(m => `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.content}`).join('\n')

    const prompt = `
      You are an expert customer support agent.
      Write a concise, professional, and helpful reply to the customer based on this conversation.
      DO NOT include placeholders like [Your Name]. Just provide the exact text that should be sent.
      Keep it brief and conversational.

      Conversation:
      ${chatText}
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    const draft = response.text?.trim() || "Thank you for reaching out. How can I assist you further?"
    return NextResponse.json({ draft })

  } catch (err: any) {
    console.error('AI Draft Error:', err)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
