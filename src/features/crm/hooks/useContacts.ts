import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useContacts(params: { page: number; limit: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
  return useQuery({
    queryKey: ['crm', 'contacts', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.append('page', params.page.toString())
      searchParams.append('limit', params.limit.toString())
      if (params.search) searchParams.append('search', params.search)
      if (params.sortBy) searchParams.append('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)

      const res = await fetch(`/api/crm/contacts?${searchParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch contacts')
      return res.json()
    }
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create contact')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts'] })
    }
  })
}
