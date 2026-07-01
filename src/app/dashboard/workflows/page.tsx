'use client'

import { useState, useEffect } from 'react'
import { Activity, CheckCircle2, XCircle, ArrowRight, Brain, UserPlus, Phone, CheckSquare, ShieldCheck } from 'lucide-react'

export default function WorkflowsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/workflows/logs', {
        headers: { 'x-tenant-id': 'demo-tenant-1' }
      })
      const data = await res.json()
      setLogs(data.data || [])
      setLoading(false)
    } catch (err) {
      console.error(err)
    }
  }

  // DAG Visualizer Nodes definition
  const nodes = [
    { id: 'start', title: 'Lead Created', icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'ai-qualify', title: 'AI Qualification', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'score-condition', title: 'Score > 80?', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'send-whatsapp', title: 'Send WhatsApp Alert', icon: Phone, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 'create-task', title: 'Create Follow-up Task', icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'audit-log', title: 'Audit Log', icon: ShieldCheck, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ]

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8">
      {/* Visual DAG Editor/Viewer */}
      <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 p-8 overflow-y-auto">
        <h2 className="text-xl font-semibold text-slate-100 mb-8">Active Workflow: Lead Qualification (v1)</h2>
        
        <div className="flex flex-col items-center max-w-xl mx-auto space-y-4 py-8 relative">
          {nodes.map((node, index) => {
            const Icon = node.icon
            return (
              <div key={node.id} className="flex flex-col items-center w-full">
                <div className={`w-full p-4 rounded-xl border border-slate-700/50 flex items-center gap-4 transition-all hover:border-slate-600 bg-slate-900 shadow-lg shadow-black/20`}>
                  <div className={`p-3 rounded-lg ${node.bg} ${node.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{node.title}</h3>
                    <p className="text-xs text-slate-400">Step {index + 1}</p>
                  </div>
                </div>
                {index < nodes.length - 1 && (
                  <div className="flex justify-center h-12 relative w-full">
                     <div className="w-0.5 h-full bg-slate-700 absolute"></div>
                     <ArrowRight className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Execution Logs Sidebar */}
      <div className="w-[450px] bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">Live Executions</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-400 font-medium tracking-wider">POLLING</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-lg">
              No executions yet.<br/>Create a new Lead to trigger the engine.
            </div>
          ) : (
            logs.map(log => (
              <div key={log._id} className="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-mono text-slate-500 truncate w-32 block">{log._id}</span>
                    <span className="text-sm font-medium text-slate-300 mt-1 block">
                      Lead: {log.triggerPayload?.contactName || 'Unknown'}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                    log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    log.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {log.status}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4 border-t border-slate-800 pt-3">
                  {log.steps.map((step: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-2">
                        {step.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                         step.status === 'SKIPPED' ? <Activity className="w-3 h-3 text-amber-400" /> :
                         step.status === 'FAILED' ? <XCircle className="w-3 h-3 text-red-400" /> :
                         <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        }
                        {step.stepName}
                      </span>
                      {step.output?.score && (
                         <span className="text-purple-400 font-mono">Score: {step.output.score}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
