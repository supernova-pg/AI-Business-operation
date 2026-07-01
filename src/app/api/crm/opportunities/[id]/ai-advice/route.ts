import { NextRequest, NextResponse } from 'next/server'
import { OpportunityService } from '@/features/crm/services/opportunity.service'
import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY
// Use a fallback or throw if missing in a real environment
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null


export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const opportunity = await OpportunityService.getOpportunityById(params.id, tenantId)
  if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!ai) {
    // Fallback if no API key is provided
    return NextResponse.json({ 
      advice: `(Mock) Given the current stage of this opportunity (${opportunity.stage}) and its value ($${opportunity.value}), the AI suggests reaching out to ${opportunity.contact.firstName}.` 
    })
  }

  try {
    const prompt = `
      You are an expert CRM AI Assistant. Analyze the following sales opportunity and provide a short, actionable "Next Best Action" (max 3 sentences) for the sales rep.
      
      Opportunity Details:
      - Title: ${opportunity.title}
      - Value: $${opportunity.value}
      - Stage: ${opportunity.stage}
      - Probability: ${opportunity.probability}%
      - Expected Close: ${opportunity.expectedClose ? new Date(opportunity.expectedClose).toLocaleDateString() : 'Unknown'}
      
      Contact Details:
      - Name: ${opportunity.contact.firstName} ${opportunity.contact.lastName || ''}
      - Company: ${opportunity.contact.company || 'Unknown'}
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    return NextResponse.json({ advice: response.text })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate AI advice', details: err.message }, { status: 500 })
  }
}
