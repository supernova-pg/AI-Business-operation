import { PrismaClient } from '@prisma/client'
// We use the base client for seeding to bypass soft-delete logic if necessary, though it shouldn't matter for inserts
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Create a dummy Tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'demo.com' },
    update: {},
    create: {
      name: 'Demo Corp',
      domain: 'demo.com'
    }
  })
  console.log(`Created Tenant: ${tenant.name}`)

  // 2. Create Business Settings
  await prisma.businessSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      companyName: 'Demo Corporation',
      timezone: 'America/New_York'
    }
  })

  // 3. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'System Admin',
      role: 'ADMIN',
      tenantId: tenant.id
    }
  })
  console.log(`Created User: ${admin.email}`)

  // 4. Generate Mock Contacts and Opportunities
  const contacts = []
  for (let i = 1; i <= 10; i++) {
    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        firstName: `John${i}`,
        lastName: `Doe${i}`,
        email: `john.doe${i}@example.com`,
        company: `Company ${i}`
      }
    })
    contacts.push(contact)

    // 5. Create an opportunity for half of them
    if (i % 2 === 0) {
      await prisma.opportunity.create({
        data: {
          tenantId: tenant.id,
          contactId: contact.id,
          title: `Deal with Company ${i}`,
          value: i * 1000,
          stage: i > 5 ? 'PROPOSAL' : 'QUALIFIED'
        }
      })
    }
  }
  console.log(`Created ${contacts.length} Contacts and related Opportunities`)

  // 6. Create a Task
  await prisma.task.create({
    data: {
      tenantId: tenant.id,
      title: 'Review quarterly goals',
      assigneeId: admin.id,
      status: 'TODO'
    }
  })
  console.log('Created Tasks')

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
