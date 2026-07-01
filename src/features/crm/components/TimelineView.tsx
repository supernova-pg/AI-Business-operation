'use client'

import { useNotes, useCreateNote } from '../hooks/useNotes'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'

export function TimelineView({ contactId, opportunityId }: { contactId?: string, opportunityId?: string }) {
  const { data: notes, isLoading } = useNotes({ contactId, opportunityId })
  const { mutate: createNote, isPending } = useCreateNote()
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    createNote({ content, contactId, opportunityId }, {
      onSuccess: () => setContent('')
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a note or log an activity..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500"
          rows={3}
        />
        <Button 
          type="submit" 
          disabled={isPending || !content.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          {isPending ? 'Saving...' : 'Add Note'}
        </Button>
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-slate-500 text-sm">Loading timeline...</div>
        ) : notes?.length === 0 ? (
          <div className="text-slate-500 text-sm">No activity recorded yet.</div>
        ) : (
          notes?.map((note: any) => (
            <div key={note.id} className="relative pl-6 border-l border-slate-800 pb-4 last:border-0 last:pb-0">
              <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-lg shadow-sm">
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.content}</p>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                  <span>{note.author?.name || 'Unknown User'}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(note.createdAt))} ago</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
