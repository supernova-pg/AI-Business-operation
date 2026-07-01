import mongoose, { Schema, Document, Model } from 'mongoose'
import { connectToMongo } from '@/core/database/mongo'

export interface IWorkflowStepLog {
  stepId: string
  stepName: string
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED'
  input: any
  output: any
  error?: string
  startedAt: Date
  completedAt: Date
}

export interface IWorkflowExecutionLog extends Document {
  tenantId: string
  workflowId: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
  triggerPayload: any
  steps: IWorkflowStepLog[]
  createdAt: Date
  updatedAt: Date
}

const WorkflowExecutionLogSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  workflowId: { type: String, required: true, index: true },
  status: { type: String, enum: ['RUNNING', 'SUCCESS', 'FAILED'], required: true },
  triggerPayload: { type: Schema.Types.Mixed, required: true },
  steps: [
    {
      stepId: { type: String, required: true },
      stepName: { type: String, required: true },
      status: { type: String, enum: ['COMPLETED', 'FAILED', 'SKIPPED'], required: true },
      input: { type: Schema.Types.Mixed },
      output: { type: Schema.Types.Mixed },
      error: { type: String },
      startedAt: { type: Date, required: true },
      completedAt: { type: Date, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

export const WorkflowExecutionLogModel: Model<IWorkflowExecutionLog> = 
  mongoose.models.WorkflowExecutionLog || mongoose.model<IWorkflowExecutionLog>('WorkflowExecutionLog', WorkflowExecutionLogSchema)

export class WorkflowLogRepository {
  static async create(data: Partial<IWorkflowExecutionLog>) {
    await connectToMongo()
    return WorkflowExecutionLogModel.create(data)
  }
}
