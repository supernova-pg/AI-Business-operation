'use client'

import { useCrmStore } from '@/features/crm/store/crm.store'
import { CrmDashboard } from '@/features/crm/components/CrmDashboard'
import { ContactsTable } from '@/features/crm/components/ContactsTable'
import { OpportunityPipeline } from '@/features/crm/components/OpportunityPipeline'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CrmPage() {
  const { activeView, setActiveView } = useCrmStore()

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-950 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
            CRM Hub
          </h1>
          <p className="text-slate-400 mt-2">Manage your contacts, pipelines, and insights.</p>
        </div>
      </div>

      <CrmDashboard />

      <Tabs value={activeView} onValueChange={(val: any) => setActiveView(val)} className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400">Overview</TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400">Contacts</TabsTrigger>
          <TabsTrigger value="opportunities" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400">Pipeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <div className="text-slate-400 text-center py-12 border border-dashed border-slate-800 rounded-xl">
            Select Contacts or Pipeline above to dive deeper.
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTable />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunityPipeline />
        </TabsContent>
      </Tabs>
    </div>
  )
}
