'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, MessageSquarePlus, MessageSquare, Loader2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Conversation {
  _id: string
  title: string
  updatedAt: string
}

export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch past conversations on load
  useEffect(() => {
    fetchConversations()
  }, [])

  // When active conversation changes, fetch its history
  useEffect(() => {
    if (activeConversationId) {
      fetchHistory(activeConversationId)
    } else {
      // New conversation selected
      setMessages([{ role: 'assistant', content: 'Hello! I am your AI Agent for Business Operations. I can query contacts, update deals, and act on your behalf. What can I do for you today?' }])
      setIsInitializing(false)
    }
  }, [activeConversationId])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/ai/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
        if (data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0]._id)
        } else if (data.length === 0) {
          setIsInitializing(false)
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err)
      setIsInitializing(false)
    }
  }

  const fetchHistory = async (id: string) => {
    setIsInitializing(true)
    try {
      const res = await fetch(`/api/ai/chat/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.length > 0 ? data : [{ role: 'assistant', content: 'Ready to help.' }])
      }
    } catch (err) {
      console.error('Failed to load history', err)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleNewChat = () => {
    setActiveConversationId(null)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // If there's no active conversation, generate a new ID
    const currentConvId = activeConversationId || uuidv4()
    if (!activeConversationId) {
      setActiveConversationId(currentConvId)
    }

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Add empty placeholder assistant message that will be populated by chunks
    const placeholderAssistant: Message = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, placeholderAssistant])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: currentConvId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to stream AI response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            // Once stream is done, refresh conversations list so the new title shows up
            fetchConversations()
            break
          }

          const chunk = decoder.decode(value)
          assistantText += chunk

          // Update the last assistant message content in state
          setMessages((prev) => {
            const updated = [...prev]
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                role: 'assistant',
                content: assistantText,
              }
            }
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Error during AI streaming:', error)
      setMessages((prev) => {
        const updated = [...prev]
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Error: Failed to fetch stream from server. Check your connection or API keys.',
          }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-950 font-sans border border-slate-900 rounded-2xl overflow-hidden">
      
      {/* Sidebar: Conversations */}
      <div className="w-64 bg-slate-950/50 border-r border-slate-900 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-slate-900">
          <Button onClick={handleNewChat} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white flex gap-2">
            <MessageSquarePlus className="w-4 h-4" />
            New Agent Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <button
              key={conv._id}
              onClick={() => setActiveConversationId(conv._id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center gap-2 ${
                activeConversationId === conv._id
                  ? 'bg-slate-900 text-cyan-400 font-medium'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
              {conv.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/20 backdrop-blur-xl">
        {/* Top Header */}
        <div className="h-14 border-b border-slate-900 bg-slate-950 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-slate-200 tracking-wide">Antigravity AI Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 2.5 Flash
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {isInitializing ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] lg:max-w-[75%] p-5 rounded-2xl text-sm leading-relaxed border shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 border-cyan-500/30 text-white rounded-br-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200 rounded-bl-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 max-w-none'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-widest block font-bold mb-2 ${msg.role === 'user' ? 'text-cyan-100' : 'text-slate-500'}`}>
                    {msg.role === 'user' ? 'You' : 'Agent'}
                  </span>
                  
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      {msg.content === '' && isLoading && index === messages.length - 1 ? (
                        <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                          <Sparkles className="w-4 h-4" /> Thinking and executing tools...
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-900 bg-slate-950/80 shrink-0">
          <div className="relative flex items-center max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., 'Search for contacts at Acme Corp' or 'Update the Acme Deal to Won'..."
              className="w-full h-14 pl-5 pr-16 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 transition-all shadow-inner"
              disabled={isLoading || isInitializing}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim() || isInitializing}
              className="absolute right-2 w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <div className="text-center mt-2 text-[10px] text-slate-500 font-medium">
            The Agent can automatically query databases, update pipelines, and send WhatsApp messages.
          </div>
        </form>
      </div>
    </div>
  )
}
