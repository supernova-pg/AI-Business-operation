import { Type, FunctionDeclaration } from '@google/genai'

export const SearchContactsTool: FunctionDeclaration = {
  name: 'SearchContacts',
  description: 'Search for contacts by name, email, or company in the CRM.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Search term for first name, last name, email, or company' },
      limit: { type: Type.INTEGER, description: 'Number of results to return (max 10)' }
    }
  }
}

export const CreateTaskTool: FunctionDeclaration = {
  name: 'CreateTask',
  description: 'Create a new task in the CRM.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Task title' },
      status: { type: Type.STRING, description: 'Status: TODO, IN_PROGRESS, or DONE', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
      assigneeId: { type: Type.STRING, description: 'Optional UUID of the user to assign the task to' }
    },
    required: ['title']
  }
}

export const UpdateOpportunityTool: FunctionDeclaration = {
  name: 'UpdateOpportunity',
  description: 'Update the stage of a sales opportunity in the CRM pipeline.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      opportunityId: { type: Type.STRING, description: 'The UUID of the opportunity to update' },
      stage: { type: Type.STRING, description: 'New stage: LEAD, QUALIFIED, PROPOSAL, WON, or LOST', enum: ['LEAD', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] }
    },
    required: ['opportunityId', 'stage']
  }
}

export const SendWhatsAppTool: FunctionDeclaration = {
  name: 'SendWhatsApp',
  description: 'Send a WhatsApp message to a customer.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      to: { type: Type.STRING, description: 'Phone number of the recipient' },
      message: { type: Type.STRING, description: 'The message content' }
    },
    required: ['to', 'message']
  }
}

export const FetchBusinessMetricsTool: FunctionDeclaration = {
  name: 'FetchBusinessMetrics',
  description: 'Fetch high-level business metrics including total opportunities, total contacts, and pipeline value.',
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
}

export const CreateAuditLogTool: FunctionDeclaration = {
  name: 'CreateAuditLog',
  description: 'Create an audit log entry for a specific entity action.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: 'The action performed (e.g., REVIEWED_DEAL)' },
      entityType: { type: Type.STRING, description: 'Type of entity (e.g., Opportunity, Contact)' },
      entityId: { type: Type.STRING, description: 'UUID of the entity' }
    },
    required: ['action', 'entityType', 'entityId']
  }
}

export const SummarizeConversationTool: FunctionDeclaration = {
  name: 'SummarizeConversation',
  description: 'Summarize the current conversation.',
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
}

export const tools = [
  SearchContactsTool,
  CreateTaskTool,
  UpdateOpportunityTool,
  SendWhatsAppTool,
  FetchBusinessMetricsTool,
  CreateAuditLogTool,
  SummarizeConversationTool
]
