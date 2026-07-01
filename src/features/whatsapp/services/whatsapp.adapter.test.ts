import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WhatsappFactory, MockWhatsappAdapter, MetaWhatsappAdapter } from './whatsapp.adapter'

describe('WhatsappFactory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  it('should return MockWhatsappAdapter when credentials are missing', () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN
    delete process.env.WHATSAPP_PHONE_ID

    const adapter = WhatsappFactory.getAdapter()
    expect(adapter).toBeInstanceOf(MockWhatsappAdapter)
  })

  it('should return MetaWhatsappAdapter when credentials are provided', () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
    process.env.WHATSAPP_PHONE_ID = '12345'

    const adapter = WhatsappFactory.getAdapter()
    expect(adapter).toBeInstanceOf(MetaWhatsappAdapter)
  })
})

describe('MockWhatsappAdapter', () => {
  it('should return a success response with a mock messageId', async () => {
    const adapter = new MockWhatsappAdapter()
    const result = await adapter.sendMessage('123', 'hello')
    
    expect(result.success).toBe(true)
    expect(result.messageId).toContain('mock-wa-')
  })
})

describe('MetaWhatsappAdapter', () => {
  it('should retry on 429 errors and eventually succeed', async () => {
    const adapter = new MetaWhatsappAdapter('token', 'phoneId')
    
    // Mock global fetch to fail twice with 429, then succeed
    let attempts = 0
    global.fetch = vi.fn().mockImplementation(async () => {
      attempts++
      if (attempts <= 2) {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Too many requests' } })
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ messages: [{ id: 'success-id' }] })
      }
    })

    const result = await adapter.sendMessage('123', 'hello')
    
    expect(attempts).toBe(3)
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('success-id')
  })
})

