'use client'

import { useOpportunities, useUpdateOpportunity } from '../hooks/useOpportunities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

export function OpportunityPipeline() {
  const { data: opportunities, isLoading } = useOpportunities()
  const { mutate: updateOpportunity } = useUpdateOpportunity()

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('opportunityId', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('opportunityId')
    if (id) {
      updateOpportunity({ id, stage })
    }
  }

  if (isLoading) return <div className="text-slate-400 animate-pulse">Loading pipeline...</div>

  const columns = STAGES.map(stage => ({
    stage,
    items: opportunities?.filter((opp: any) => opp.stage === stage) || []
  }))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <div
          key={column.stage}
          className="flex-1 min-w-[300px] bg-slate-900/50 rounded-xl border border-slate-800/80 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.stage)}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-300 capitalize">{column.stage.toLowerCase()}</h3>
            <Badge variant="secondary" className="bg-slate-800 text-slate-400">
              {column.items.length}
            </Badge>
          </div>
          
          <div className="space-y-3 min-h-[500px]">
            {column.items.map((opp: any) => (
              <Card
                key={opp.id}
                draggable
                onDragStart={(e) => handleDragStart(e, opp.id)}
                className="bg-slate-950/80 border-slate-800 cursor-move hover:border-cyan-500/50 transition-colors shadow-lg"
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">
                    {opp.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs text-slate-500">{opp.contact?.firstName} {opp.contact?.lastName}</p>
                    <p className="text-sm font-semibold text-cyan-400">
                      ${Number(opp.value).toLocaleString()}
                    </p>
                  </div>
                  {opp.probability > 0 && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" 
                        style={{ width: `${opp.probability}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
