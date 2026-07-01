'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { TimelineView } from '@/features/crm/components/TimelineView'
import { AiInsightCard } from '@/features/crm/components/AiInsightCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, Building } from 'lucide-react'

export default function ContactDetailPage() {
  const params = useParams()
  const contactId = params.id as string

  const { data: contact, isLoading } = useQuery({
    queryKey: ['crm', 'contacts', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/contacts/${contactId}`)
      if (!res.ok) throw new Error('Failed to fetch contact')
      return res.json()
    }
  })

  // We can also fetch the contact's opportunities directly here or via the API, 
  // but let's assume the API returns opportunities if we join them, or we can fetch separately.
  // For simplicity, we just render the timeline and AI card if an opportunity exists.

  if (isLoading) return <div className="p-8 text-slate-400 animate-pulse">Loading profile...</div>
  if (!contact) return <div className="p-8 text-red-400">Contact not found</div>

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-950 font-sans max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
          {contact.firstName.charAt(0)}{contact.lastName?.charAt(0) || ''}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            {contact.firstName} {contact.lastName}
          </h1>
          <div className="flex gap-4 mt-2 text-sm text-slate-400">
            {contact.email && (
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {contact.email}</span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {contact.phone}</span>
            )}
            {contact.company && (
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {contact.company}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineView contactId={contactId} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {/* In a real app, map over contact.opportunities */}
              <div className="text-sm text-slate-400 text-center py-4">
                No active opportunities.
              </div>
            </CardContent>
          </Card>

          {/* Example of AI insight if we had a specific opportunity ID to pass */}
          {/* <AiInsightCard opportunityId="some-id" /> */}
        </div>
      </div>
    </div>
  )
}
