import { WorkflowLogRepository, IWorkflowExecutionLog, WorkflowExecutionLogModel } from '../repositories/workflow-log.repository'
import { WhatsappFactory } from '@/features/whatsapp/services/whatsapp.adapter'
import { GoogleGenAI } from '@google/genai'
import { prisma } from '@/core/database/prisma'
import { logger } from '@/core/logger/logger'

function getWorkflowAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY
  return key ? new GoogleGenAI({ apiKey: key }) : null
}

interface WorkflowPayload {
  contactId: string
  contactName: string
  contactPhone?: string
  opportunityId: string
  opportunityTitle: string
  context?: string
}

export class WorkflowEngine {
  /**
   * Pushes a job to the in-memory queue for background execution.
   */
  static async triggerLeadWorkflow(tenantId: string, payload: WorkflowPayload) {
    // 1. Create a persistent execution log in MongoDB
    const execution = await WorkflowLogRepository.create({
      tenantId,
      workflowId: 'lead-qualification-v1',
      status: 'RUNNING',
      triggerPayload: payload,
      steps: []
    })

    // 2. Fire and forget the background execution
    this.executeLoop(execution._id as string, tenantId, payload).catch(err => {
      logger.error('Workflow background execution hard failed:', err)
    })

    return execution._id
  }

  /**
   * Recovers and re-triggers workflows that crashed mid-execution.
   * Can be called via a cron job or manually.
   */
  static async recoverOrphanedWorkflows() {
    // Find RUNNING workflows where updatedAt is older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const orphans = await WorkflowExecutionLogModel.find({
      status: 'RUNNING',
      updatedAt: { $lt: fiveMinutesAgo }
    })

    logger.info(`[Workflow Engine] Found ${orphans.length} orphaned workflows. Recovering...`)

    for (const orphan of orphans) {
      // Re-trigger execution without resetting state
      this.executeLoop(orphan._id as string, orphan.tenantId, orphan.triggerPayload).catch(err => {
        logger.error(`[Workflow Engine] Failed to recover orphan ${orphan._id}:`, err)
      })
    }
  }

  /**
   * The autonomous background runner.
   * Executes steps sequentially, hydrating state and applying retries.
   */
  private static async executeLoop(executionId: string, tenantId: string, payload: WorkflowPayload) {
    const context: any = { ...payload }
    
    // DAG Definition
    const steps = [
      { id: 'ai-qualify', name: 'AI Qualification', run: this.stepAiQualification },
      { id: 'score-condition', name: 'Lead Score > 80 Condition', run: this.stepScoreCondition },
      { id: 'send-whatsapp', name: 'Send WhatsApp Alert', run: this.stepSendWhatsapp },
      { id: 'create-task', name: 'Create Follow-up Task', run: this.stepCreateTask },
      { id: 'audit-log', name: 'Create Audit Log', run: this.stepAuditLog }
    ]

    // 1. Hydrate state for idempotency
    const executionDoc = await WorkflowExecutionLogModel.findById(executionId)
    if (!executionDoc) return

    const completedStepIds = new Set(
      executionDoc.steps
        .filter(s => s.status === 'COMPLETED' || s.status === 'SKIPPED')
        .map(s => s.stepId)
    )

    // Replay context from completed steps
    for (const s of executionDoc.steps) {
      if (s.status === 'COMPLETED' && s.output) {
         Object.assign(context, s.output)
      }
    }

    for (const step of steps) {
      // Idempotency check: Skip if already done
      if (completedStepIds.has(step.id)) {
        continue
      }

      const stepLog = {
        stepId: step.id,
        stepName: step.name,
        status: 'RUNNING' as any,
        input: { ...context },
        output: null,
        error: '',
        startedAt: new Date(),
        completedAt: new Date()
      }

      try {
        // Retry Loop (up to 3 times)
        let attempts = 0
        let success = false
        while (attempts < 3 && !success) {
          attempts++
          try {
            const result = await step.run(tenantId, context)
            
            // Apply result to context for next step
            Object.assign(context, result?.stateUpdates || {})
            
            stepLog.status = result?.skip ? 'SKIPPED' : 'COMPLETED'
            stepLog.output = result?.output || null
            stepLog.completedAt = new Date()
            success = true
          } catch (err: any) {
            if (attempts >= 3) throw err
            logger.warn(`[Workflow Engine] Step ${step.id} failed, retrying... (${attempts}/3)`)
            await new Promise(r => setTimeout(r, 1000 * attempts)) // Exponential backoff
          }
        }

        // Commit step success to MongoDB
        await WorkflowExecutionLogModel.findByIdAndUpdate(executionId, { $push: { steps: stepLog } })

        // Stop workflow if condition skipped
        if (stepLog.status === 'SKIPPED') {
          await WorkflowExecutionLogModel.findByIdAndUpdate(executionId, { status: 'SUCCESS' })
          return // Terminate workflow gracefully
        }

      } catch (err: any) {
        stepLog.status = 'FAILED'
        stepLog.error = err.message
        stepLog.completedAt = new Date()
        
        // Commit step failure and execution failure
        await WorkflowExecutionLogModel.findByIdAndUpdate(executionId, { 
          $push: { steps: stepLog },
          $set: { status: 'FAILED' }
        })
        
        logger.error(`[Workflow Engine] Execution ${executionId} failed at ${step.id}:`, err)
        return // Terminate execution
      }
    }

    // Workflow finished completely
    await WorkflowExecutionLogModel.findByIdAndUpdate(executionId, { status: 'SUCCESS' })
  }

  // --- Step Implementations ---

  private static async stepAiQualification(tenantId: string, context: WorkflowPayload) {
    const ai = getWorkflowAI()
    if (!ai) {
      // Mock score if no AI configured
      return { output: { score: 85, reasoning: 'AI not configured, defaulting to high score.' }, stateUpdates: { score: 85 } }
    }

    const prompt = `
      Analyze this lead and assign a lead score from 0 to 100 based on their likelihood to close.
      Be realistic. High value is > 80.
      Contact: ${context.contactName}
      Opportunity: ${context.opportunityTitle}
      Notes: ${context.context || 'No specific notes.'}
      
      Output ONLY a valid JSON object:
      {
        "score": 85,
        "reasoning": "Brief reason here"
      }
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    })

    // Robust JSON extraction to prevent markdown crashes
    const text = response.text || '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const rawJson = jsonMatch ? jsonMatch[0] : '{}'
    
    let data: any = {}
    try {
      data = JSON.parse(rawJson)
    } catch {
      data = {}
    }

    const score = Number(data.score) || 50

    return { 
      output: { score, reasoning: data.reasoning },
      stateUpdates: { score }
    }
  }

  private static async stepScoreCondition(tenantId: string, context: any) {
    const passed = context.score > 80
    if (!passed) {
      return { skip: true, output: { message: `Lead score ${context.score} is <= 80. Stopping workflow.` } }
    }
    return { output: { message: `Lead score ${context.score} > 80. Proceeding.` } }
  }

  private static async stepSendWhatsapp(tenantId: string, context: any) {
    if (!context.contactPhone) {
       return { skip: true, output: { error: 'No phone number provided. Skipping.' } }
    }

    const adapter = WhatsappFactory.getAdapter()
    const message = `Hi ${context.contactName}, thank you for your interest in ${context.opportunityTitle}! An agent will be in touch shortly.`
    const res = await adapter.sendMessage(context.contactPhone, message)
    
    return { output: { messageId: res.messageId } }
  }

  private static async stepCreateTask(tenantId: string, context: any) {
    const task = await prisma.task.create({
      data: {
        tenantId,
        title: `High Priority Follow-up: ${context.contactName}`,
        description: `Lead scored ${context.score}. Follow up immediately.`,
        contactId: context.contactId,
        opportunityId: context.opportunityId,
        status: 'TODO'
      }
    })

    return { output: { taskId: task.id } }
  }

  private static async stepAuditLog(tenantId: string, context: any) {
    const audit = await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'WORKFLOW_LEAD_QUALIFIED',
        entityType: 'Opportunity',
        entityId: context.opportunityId,
        metadata: { score: context.score, workflow: 'lead-qualification-v1' }
      }
    })

    return { output: { auditId: audit.id } }
  }
}
