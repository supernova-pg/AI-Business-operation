import { OpportunityRepository } from '../repositories/opportunity.repository'
import { ContactRepository } from '../repositories/contact.repository'
import { Prisma } from '@prisma/client'
import { AppError } from '@/core/errors/AppError'
import { WorkflowEngine } from '@/features/workflows/services/workflow-engine.service'

export class OpportunityService {
  static async createOpportunity(tenantId: string, data: Omit<Prisma.OpportunityUncheckedCreateInput, 'tenantId'>) {
    // Prevent Cross-Tenant IDOR: Verify the contact actually belongs to this tenant
    const contact = await ContactRepository.findById(data.contactId, tenantId)
    if (!contact) {
      throw new AppError('Contact not found or does not belong to your workspace', 404)
    }

    const opportunity = await OpportunityRepository.create({
      ...data,
      tenantId,
    })

    // Phase 2: Trigger AI Qualification Workflow automatically
    if (opportunity.stage === 'LEAD') {
      WorkflowEngine.triggerLeadWorkflow(tenantId, {
        contactId: contact.id,
        contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
        contactPhone: contact.phone || undefined,
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
      }).catch(err => console.error('Workflow trigger failed:', err))
    }

    return opportunity
  }

  static async getOpportunities(tenantId: string) {
    return OpportunityRepository.findAllByTenant(tenantId)
  }

  static async getOpportunityById(id: string, tenantId: string) {
    return OpportunityRepository.findById(id, tenantId)
  }

  static async updateOpportunity(id: string, tenantId: string, data: Prisma.OpportunityUpdateInput) {
    const updated = await OpportunityRepository.update(id, tenantId, data)
    if (!updated) {
      throw new AppError('Opportunity not found', 404)
    }
    return updated
  }

  static async deleteOpportunity(id: string, tenantId: string) {
    const result = await OpportunityRepository.softDelete(id, tenantId)
    if (result.count === 0) {
      throw new AppError('Opportunity not found', 404)
    }
    return true
  }
}
