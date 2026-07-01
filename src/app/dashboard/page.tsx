'use client'

import React, { useMemo } from 'react'
import { Activity, DollarSign, Target, BellRing, Filter, Clock } from 'lucide-react'
import { useDashboardMetrics, DashboardPeriod } from '@/features/dashboard/hooks/useDashboardMetrics'

export default function DashboardOverview() {
  const { metrics, isLoading, period, setPeriod } = useDashboardMetrics()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  // Pre-calculate derived data so memoized components don't re-render unnecessarily
  const maxDistributionCount = useMemo(() => {
    return metrics?.opportunityDistribution.length 
      ? Math.max(...metrics.opportunityDistribution.map(d => d.count)) 
      : 1
  }, [metrics?.opportunityDistribution])

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            SaaS Overview
          </h2>
          <p className="text-sm text-slate-400 mt-1">Real-time telemetry and revenue metrics</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800" role="group" aria-label="Date range filter">
          <Filter className="w-4 h-4 text-slate-500 ml-2" aria-hidden="true" />
          <span className="sr-only">Filter by date</span>
          {(['7d', '30d', '90d'] as DashboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === p 
                  ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Revenue Pipeline" 
          value={isLoading ? '...' : formatCurrency(metrics?.pipelineValue || 0)} 
          icon={DollarSign} 
          color="from-emerald-400 to-teal-500" 
          loading={isLoading}
        />
        <StatCard 
          title="Lead Conversion" 
          value={isLoading ? '...' : `${(metrics?.leadConversionRate || 0).toFixed(1)}%`} 
          icon={Target} 
          color="from-cyan-400 to-blue-500" 
          loading={isLoading}
        />
        <StatCard 
          title="Pending Follow Ups" 
          value={isLoading ? '...' : String(metrics?.pendingTasks || 0)} 
          icon={Clock} 
          color="from-amber-400 to-orange-500" 
          loading={isLoading}
        />
        <StatCard 
          title="AI Workflow Alerts" 
          value={isLoading ? '...' : String(metrics?.aiAlerts || 0)} 
          icon={BellRing} 
          color={metrics?.aiAlerts && metrics.aiAlerts > 0 ? "from-red-400 to-rose-500" : "from-slate-400 to-slate-500"} 
          loading={isLoading}
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PipelineDistributionChart 
          distribution={metrics?.opportunityDistribution} 
          maxCount={maxDistributionCount}
          loading={isLoading} 
        />
        <ActivityTimeline 
          activities={metrics?.recentActivities} 
          loading={isLoading} 
        />
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Memoized UI Components for Render Optimization
// -----------------------------------------------------------------------------

const StatCard = React.memo(function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  loading 
}: { 
  title: string, 
  value: string, 
  icon: any, 
  color: string, 
  loading: boolean 
}) {
  return (
    <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 hover:bg-slate-900/40 transition-all duration-300 flex items-center justify-between group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
      <div className="space-y-1 relative z-10 w-full">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-slate-800/80 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-3xl font-extrabold text-white tracking-tight mt-1 truncate">{value}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-300 shrink-0`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
    </div>
  )
})

const PipelineDistributionChart = React.memo(function PipelineDistributionChart({
  distribution,
  maxCount,
  loading
}: {
  distribution?: { stage: string; count: number }[]
  maxCount: number
  loading: boolean
}) {
  return (
    <div className="lg:col-span-2 p-6 rounded-xl border border-slate-900 bg-slate-900/20 shadow-xl flex flex-col">
      <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-500" aria-hidden="true" /> Pipeline Distribution
      </h4>
      
      {loading ? (
        <div className="flex-1 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-800/80 rounded animate-pulse" />
                <div className="h-3 w-6 bg-slate-800/80 rounded animate-pulse" />
              </div>
              <div className="h-3 w-full bg-slate-800/50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : !distribution || distribution.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg p-8">
          <Activity className="w-8 h-8 mb-3 opacity-20" aria-hidden="true" />
          <p>No active opportunities in this period.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-5">
          {distribution.map((dist, i) => {
            const percentage = (dist.count / maxCount) * 100
            return (
              <div key={dist.stage} className="relative">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">{dist.stage}</span>
                  <span className="text-cyan-400">{dist.count}</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%`, transitionDelay: `${i * 100}ms` }}
                    role="progressbar"
                    aria-valuenow={dist.count}
                    aria-valuemin={0}
                    aria-valuemax={maxCount}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

const ActivityTimeline = React.memo(function ActivityTimeline({
  activities,
  loading
}: {
  activities?: { id: string; action: string; createdAt: string }[]
  loading: boolean
}) {
  return (
    <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 shadow-xl flex flex-col">
      <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-500" aria-hidden="true" /> Recent Activity
      </h4>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
               <div className="w-6 h-6 rounded bg-slate-800/80 animate-pulse shrink-0" />
               <div className="space-y-2 flex-1 pt-1">
                 <div className="h-3 w-2/3 bg-slate-800/80 rounded animate-pulse" />
                 <div className="h-2 w-1/3 bg-slate-800/50 rounded animate-pulse" />
               </div>
            </div>
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg p-8">
          <p>No recent activity.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
              <div className="mt-0.5 p-1.5 rounded bg-slate-800 text-slate-400 shrink-0">
                <Activity className="w-3 h-3" aria-hidden="true" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-slate-200 truncate">{activity.action.replace(/_/g, ' ')}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
