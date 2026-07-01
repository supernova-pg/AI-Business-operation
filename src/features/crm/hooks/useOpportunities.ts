import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useOpportunities() {
  return useQuery({
    queryKey: ['crm', 'opportunities'],
    queryFn: async () => {
      const res = await fetch(`/api/crm/opportunities`)
      if (!res.ok) throw new Error('Failed to fetch opportunities')
      return res.json()
    }
  })
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/crm/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update opportunity')
      return res.json()
    },
    onMutate: async (newOpp) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['crm', 'opportunities'] })

      // Snapshot the previous value
      const previousOpps = queryClient.getQueryData(['crm', 'opportunities'])

      // Optimistically update to the new value
      queryClient.setQueryData(['crm', 'opportunities'], (old: any) => {
        if (!old) return old
        return old.map((opp: any) => 
          opp.id === newOpp.id ? { ...opp, ...newOpp } : opp
        )
      })

      // Return a context object with the snapshotted value
      return { previousOpps }
    },
    onError: (err, newOpp, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOpps) {
        queryClient.setQueryData(['crm', 'opportunities'], context.previousOpps)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'opportunities'] })
    }
  })
}

export function useAiAdvice(opportunityId: string) {
  return useQuery({
    queryKey: ['crm', 'opportunities', opportunityId, 'ai-advice'],
    queryFn: async () => {
      const res = await fetch(`/api/crm/opportunities/${opportunityId}/ai-advice`)
      if (!res.ok) throw new Error('Failed to fetch AI advice')
      return res.json()
    },
    enabled: !!opportunityId,
  })
}
