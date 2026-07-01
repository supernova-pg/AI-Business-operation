import { create } from 'zustand'

interface CrmState {
  // Active View State
  activeView: 'contacts' | 'opportunities' | 'dashboard'
  setActiveView: (view: 'contacts' | 'opportunities' | 'dashboard') => void

  // Contacts Table State
  contactsSearch: string
  setContactsSearch: (search: string) => void
  contactsPage: number
  setContactsPage: (page: number) => void

  // Kanban Pipeline State
  isDraggingOpportunity: boolean
  setIsDraggingOpportunity: (isDragging: boolean) => void
}

export const useCrmStore = create<CrmState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  contactsSearch: '',
  setContactsSearch: (search) => set({ contactsSearch: search, contactsPage: 1 }), // Reset page on search
  contactsPage: 1,
  setContactsPage: (page) => set({ contactsPage: page }),

  isDraggingOpportunity: false,
  setIsDraggingOpportunity: (isDragging) => set({ isDraggingOpportunity: isDragging }),
}))
