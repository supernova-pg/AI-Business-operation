'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOpportunities } from '../hooks/useOpportunities'
import { useContacts } from '../hooks/useContacts'
import { Users, DollarSign, Activity, Target } from 'lucide-react'

export function CrmDashboard() {
  const { data: opportunities } = useOpportunities()
  const { data: contactsData } = useContacts({ page: 1, limit: 1 }) // Just for total count

  const activeDeals = opportunities?.filter((o: any) => !['WON', 'LOST'].includes(o.stage)) || []
  const wonDeals = opportunities?.filter((o: any) => o.stage === 'WON') || []
  
  const pipelineValue = activeDeals.reduce((sum: number, opp: any) => sum + Number(opp.value), 0)
  const wonValue = wonDeals.reduce((sum: number, opp: any) => sum + Number(opp.value), 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-400">Total Contacts</CardTitle>
          <Users className="w-4 h-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100">{contactsData?.total || 0}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-400">Active Deals</CardTitle>
          <Activity className="w-4 h-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100">{activeDeals.length}</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-400">Pipeline Value</CardTitle>
          <Target className="w-4 h-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100">${pipelineValue.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-400">Closed Won</CardTitle>
          <DollarSign className="w-4 h-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-400">${wonValue.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  )
}
