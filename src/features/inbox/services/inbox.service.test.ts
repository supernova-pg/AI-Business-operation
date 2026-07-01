import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InboxService } from './inbox.service'
import { InboxThreadModel, InboxMessageModel } from '../repositories/models'
import { AiEnrichmentService } from './ai-enrichment.service'

vi.mock('../repositories/models', () => ({
  InboxThreadModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    updateOne: vi.fn(),
  },
  InboxMessageModel: {
    find: vi.fn(),
    create: vi.fn(),
  }
}))

vi.mock('./ai-enrichment.service', () => ({
  AiEnrichmentService: {
    enrichThread: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/core/database/mongo', () => ({
  connectToMongo: vi.fn().mockResolvedValue(undefined)
}))

describe('InboxService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getThreads', () => {
    it('should fetch paginated threads', async () => {
      const mockThreads = [{ _id: 'thread-1', snippet: 'Hello' }]
      
      const mockLimit = vi.fn().mockReturnThis()
      const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit, lean: vi.fn().mockResolvedValue(mockThreads) })
      const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
      
      vi.mocked(InboxThreadModel.find).mockReturnValue({ sort: mockSort } as any)
      vi.mocked(InboxThreadModel.countDocuments).mockResolvedValue(1)

      const result = await InboxService.getThreads('tenant-1')

      expect(InboxThreadModel.find).toHaveBeenCalledWith({ tenantId: 'tenant-1' })
      expect(result.data).toEqual(mockThreads)
      expect(result.meta.total).toBe(1)
    })
  })

  describe('appendMessage', () => {
    it('should append a message and trigger AI enrichment', async () => {
      vi.mocked(InboxThreadModel.findOne).mockResolvedValue({ _id: 'thread-1' } as any)
      vi.mocked(InboxMessageModel.create).mockResolvedValue({ _id: 'msg-1' } as any)
      vi.mocked(InboxThreadModel.updateOne).mockResolvedValue({} as any)

      await InboxService.appendMessage('tenant-1', 'thread-1', 'INBOUND', 'Test message')

      expect(InboxMessageModel.create).toHaveBeenCalledWith(expect.objectContaining({
        direction: 'INBOUND',
        content: 'Test message'
      }))
      
      expect(InboxThreadModel.updateOne).toHaveBeenCalledWith(
        { _id: 'thread-1', tenantId: 'tenant-1' },
        expect.objectContaining({ $inc: { unreadCount: 1 } }) // Inbound increases unread count
      )

      expect(AiEnrichmentService.enrichThread).toHaveBeenCalledWith('thread-1', 'tenant-1')
    })
  })
})
