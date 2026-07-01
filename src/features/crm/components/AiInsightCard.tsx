'use client'

import { useAiAdvice } from '../hooks/useOpportunities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export function AiInsightCard({ opportunityId }: { opportunityId: string }) {
  const { data, isLoading, error } = useAiAdvice(opportunityId)

  return (
    <Card className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border-indigo-500/20 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          AI Next Best Action
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-slate-400 animate-pulse">Analyzing opportunity...</div>
        ) : error ? (
          <div className="text-sm text-red-400">Failed to generate insights.</div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed">
            {data?.advice}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
