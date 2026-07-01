import { ContactRepository, ContactQueryParams } from '../repositories/contact.repository'
import { Prisma } from '@prisma/client'
import { AppError } from '@/core/errors/AppError'

export class ContactService {
  static async createContact(tenantId: string, data: Omit<Prisma.ContactUncheckedCreateInput, 'tenantId'>) {
    return ContactRepository.create({
      ...data,
      tenantId,
    })
  }

  static async getContacts(params: ContactQueryParams) {
    return ContactRepository.findAll(params)
  }

  static async getContactById(id: string, tenantId: string) {
    return ContactRepository.findById(id, tenantId)
  }

  static async updateContact(id: string, tenantId: string, data: Prisma.ContactUpdateInput) {
    const result = await ContactRepository.update(id, tenantId, data)
    if (result.count === 0) {
      throw new AppError('Contact not found', 404)
    }
    return ContactRepository.findById(id, tenantId)
  }

  static async deleteContact(id: string, tenantId: string) {
    const result = await ContactRepository.softDelete(id, tenantId)
    if (result.count === 0) {
      throw new AppError('Contact not found', 404)
    }
    return true
  }
}
