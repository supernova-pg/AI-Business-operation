import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useNotes(params: { contactId?: string; opportunityId?: string }) {
  return useQuery({
    queryKey: ['crm', 'notes', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.contactId) searchParams.append('contactId', params.contactId)
      if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId)

      const res = await fetch(`/api/crm/notes?${searchParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch notes')
      return res.json()
    },
    enabled: !!(params.contactId || params.opportunityId)
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'notes'] })
    }
  })
}
