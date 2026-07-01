import { NoteRepository } from '../repositories/note.repository'
import { ContactRepository } from '../repositories/contact.repository'
import { OpportunityRepository } from '../repositories/opportunity.repository'
import { Prisma } from '@prisma/client'
import { AppError } from '@/core/errors/AppError'

export class NoteService {
  static async createNote(tenantId: string, authorId: string, data: Omit<Prisma.NoteUncheckedCreateInput, 'tenantId' | 'authorId'>) {
    // Prevent Cross-Tenant IDOR
    if (data.contactId) {
      const contact = await ContactRepository.findById(data.contactId, tenantId)
      if (!contact) throw new AppError('Contact not found', 404)
    }
    
    if (data.opportunityId) {
      const opp = await OpportunityRepository.findById(data.opportunityId, tenantId)
      if (!opp) throw new AppError('Opportunity not found', 404)
    }

    return NoteRepository.create({
      ...data,
      tenantId,
      authorId,
    })
  }

  static async getContactNotes(contactId: string, tenantId: string) {
    return NoteRepository.findByContact(contactId, tenantId)
  }

  static async getOpportunityNotes(opportunityId: string, tenantId: string) {
    return NoteRepository.findByOpportunity(opportunityId, tenantId)
  }
}
