'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MessageSquare, Phone, Mail, Sparkles, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnifiedInboxPage() {
  const [threads, setThreads] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [search, setSearch] = useState('')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isDrafting, setIsDrafting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  // Fetch threads initially and when search changes
  useEffect(() => {
    fetchThreads()
  }, [search])

  // Setup SSE stream for realtime updates (Zero-Network Dom Patching)
  useEffect(() => {
    const eventSource = new EventSource('/api/inbox/stream')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'threads_updated' && Array.isArray(data.payload)) {
          // Fix for React Rendering Optimization: Zero-network functional state update
          setThreads(prevThreads => {
            const updated = [...prevThreads]
            data.payload.forEach((incomingThread: any) => {
              const idx = updated.findIndex(t => t._id === incomingThread._id)
              if (idx !== -1) {
                updated[idx] = { ...updated[idx], ...incomingThread }
              } else {
                // If it's a completely new thread, add it to the top
                updated.unshift(incomingThread)
              }
            })
            // Sort by lastMessageAt descending
            return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
          })
          
          // If the active thread was updated, we should fetch new messages silently
          // (In a real app, SSE would push the message directly, but here we just fetch)
          if (activeThreadId && data.payload.some((t: any) => t._id === activeThreadId)) {
            fetchMessages(activeThreadId, true)
          }
        }
      } catch (err) {}
    }

    return () => eventSource.close()
  }, [activeThreadId])

  // Fetch messages when active thread changes
  useEffect(() => {
    if (activeThreadId) {
      isFirstLoad.current = true
      setMessages([])
      setHasMoreMessages(true)
      fetchMessages(activeThreadId)
    }
  }, [activeThreadId])

  // Scroll to bottom on first load or when sending
  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView()
      isFirstLoad.current = false
    }
  }, [messages])

  const fetchThreads = async () => {
    try {
      const url = search ? `/api/inbox/threads?search=${encodeURIComponent(search)}` : '/api/inbox/threads'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setThreads(json.data || [])
        setIsLoading(false)
      }
    } catch (err) {
      console.error(err)
      setIsLoading(false)
    }
  }

  const fetchMessages = async (threadId: string, isSilentUpdate = false, cursor?: string) => {
    if (!isSilentUpdate && !cursor) setIsLoadingMore(true)
    try {
      const url = cursor 
        ? `/api/inbox/threads/${threadId}/messages?cursor=${cursor}` 
        : `/api/inbox/threads/${threadId}/messages`
        
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        const newMessages = json.data || []
        
        if (newMessages.length < 50) {
          setHasMoreMessages(false)
        }

        if (cursor) {
          // Prepend older messages for infinite scroll
          setMessages(prev => {
            // deduplicate
            const existingIds = new Set(prev.map(m => m._id))
            const uniqueNew = newMessages.filter((m: any) => !existingIds.has(m._id))
            return [...uniqueNew, ...prev]
          })
        } else if (isSilentUpdate) {
          // Append newer messages silently, filtering out optimistic temporary IDs
          setMessages(prev => {
            const existingContent = new Set(prev.map(m => m.content))
            const uniqueNew = newMessages.filter((m: any) => !existingContent.has(m.content))
            // Remove optimistic messages that have temporary IDs if they match content
            const cleanedPrev = prev.filter(m => !m.isOptimistic)
            return [...cleanedPrev, ...uniqueNew]
          })
        } else {
          setMessages(newMessages)
        }
        
        // Optimistically clear unread badge locally
        setThreads(prev => prev.map(t => t._id === threadId ? { ...t, unreadCount: 0 } : t))
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (!isSilentUpdate) setIsLoadingMore(false)
    }
  }

  // Handle true infinite scroll upwards
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    if (target.scrollTop === 0 && hasMoreMessages && !isLoadingMore && messages.length > 0) {
      const oldestMessageId = messages[0]._id
      if (oldestMessageId && !messages[0].isOptimistic) {
        // Save current scroll height to adjust after prepend
        const prevHeight = target.scrollHeight
        fetchMessages(activeThreadId!, false, oldestMessageId).then(() => {
          // Adjust scroll position to prevent jumping
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight - prevHeight
          }
        })
      }
    }
  }, [hasMoreMessages, isLoadingMore, messages, activeThreadId])

  const generateDraft = async () => {
    if (!activeThreadId || isDrafting) return
    setIsDrafting(true)
    try {
      const res = await fetch(`/api/inbox/threads/${activeThreadId}/draft`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.draft) setInput(data.draft)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDrafting(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeThreadId || isSending) return

    setIsSending(true)
    const content = input
    setInput('')

    // Fix for Race Conditions: Use temporary optimistic IDs
    const optimisticMessage = { 
      _id: `temp-${Date.now()}`, 
      isOptimistic: true,
      direction: 'OUTBOUND', 
      content, 
      createdAt: new Date().toISOString() 
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    
    // Auto scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    try {
      await fetch(`/api/inbox/threads/${activeThreadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      // SSE will trigger re-fetch to ensure sync and AI update
    } catch (err) {
      console.error(err)
      // In production, we would remove the optimistic message on failure
    } finally {
      setIsSending(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'WHATSAPP': return <MessageSquare className="w-4 h-4 text-emerald-400" />
      case 'EMAIL': return <Mail className="w-4 h-4 text-blue-400" />
      case 'CALL': return <Phone className="w-4 h-4 text-purple-400" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const activeThread = threads.find(t => t._id === activeThreadId)

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-950 font-sans border border-slate-900 rounded-2xl overflow-hidden">
      
      {/* Sidebar: Threads */}
      <div className="w-80 bg-slate-950/50 border-r border-slate-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-900 bg-slate-950">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : threads.length === 0 ? (
            <div className="text-center p-8 text-sm text-slate-500">No conversations found.</div>
          ) : (
            threads.map(thread => (
              <button
                key={thread._id}
                onClick={() => setActiveThreadId(thread._id)}
                className={`w-full text-left p-4 border-b border-slate-900/50 transition-all hover:bg-slate-900/40 relative ${
                  activeThreadId === thread._id ? 'bg-slate-900' : ''
                }`}
              >
                {thread.unreadCount > 0 && (
                  <span className="absolute right-4 top-4 bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-cyan-500/20">
                    {thread.unreadCount}
                  </span>
                )}
                
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(thread.channel)}
                    <span className="font-semibold text-sm text-slate-200 truncate pr-4">{thread.contactName}</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 truncate mb-2">{thread.snippet || 'No messages yet'}</p>
                
                {/* AI Metadata Tags */}
                <div className="flex gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    thread.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    thread.sentiment === 'NEGATIVE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {thread.sentiment || 'NEUTRAL'}
                  </span>
                  {thread.intent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {thread.intent}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
        {activeThreadId && activeThread ? (
          <>
            {/* AI Context Header */}
            <div className="p-4 border-b border-slate-900 bg-gradient-to-r from-slate-900 to-slate-950 shrink-0">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">AI Context Thread Enrichment</h3>
                  <p className="text-sm text-slate-200 mb-2">{activeThread.aiSummary || 'Analyzing thread...'}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Suggested Next Action:</span>
                    <span className="text-cyan-400 font-medium">{activeThread.nextAction || 'Wait for customer response'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col relative"
            >
              {isLoadingMore && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 p-2 bg-slate-900/80 rounded-full shadow-lg backdrop-blur-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                </div>
              )}
              {messages.length === 0 && !isLoadingMore ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No messages.</div>
              ) : (
                messages.map((msg, i) => (
                  <div key={msg._id || i} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 px-4 rounded-2xl text-sm ${
                      msg.direction === 'OUTBOUND' 
                        ? 'bg-cyan-600 text-white rounded-br-sm shadow-md' 
                        : 'bg-slate-900 text-slate-200 rounded-bl-sm border border-slate-800'
                    } ${msg.isOptimistic ? 'opacity-70' : ''}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-900 bg-slate-950/80 shrink-0">
              <div className="relative flex items-center max-w-4xl mx-auto gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateDraft}
                  disabled={isDrafting || !activeThreadId}
                  className="w-10 h-10 shrink-0 border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-purple-400 text-slate-400 rounded-xl transition-colors"
                  title="Generate AI Draft"
                >
                  {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message to reply..."
                    className="w-full h-10 pl-4 pr-12 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 transition-all shadow-inner"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSending || !input.trim()}
                    className="absolute right-1 top-1 w-8 h-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-md transition-transform cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-slate-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Select a conversation to view the timeline</p>
          </div>
        )}
      </div>
    </div>
  )
}
