import { Queue, Worker } from 'bullmq'
import { env } from '../env.js'

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
}

export const submissionQueue = new Queue('submissions', { connection })

export type SubmissionJobData = {
  submissionId: string
  formId: string
  schema: import('@formforge/schema-core').FormSchema
  data: Record<string, unknown>
}

let worker: Worker | null = null

export function startWorkers(): void {
  worker = new Worker<SubmissionJobData>(
    'submissions',
    async (job) => {
      const { submissionId, schema, data } = job.data

      // Dispatch webhooks
      if (schema.settings?.webhooks) {
        await Promise.allSettled(
          schema.settings.webhooks.map(async (webhook) => {
            if (!webhook.events.includes('submitted')) return

            const response = await fetch(webhook.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...webhook.headers,
              },
              body: JSON.stringify({
                event: 'submitted',
                submissionId,
                formSlug: schema.slug,
                data,
                submittedAt: new Date().toISOString(),
              }),
            })

            if (!response.ok) {
              throw new Error(`Webhook ${webhook.url} returned ${response.status}`)
            }
          })
        )
      }

      // Send email notifications
      if (schema.settings?.notifications?.email?.length) {
        // Email integration placeholder — connect to SendGrid/Postmark/etc.
        console.log(
          `[queue] Email notification for submission ${submissionId} to:`,
          schema.settings.notifications.email
        )
      }

      // Slack notification
      if (schema.settings?.notifications?.slack) {
        await fetch(schema.settings.notifications.slack, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `New submission for *${schema.name}* (ID: ${submissionId})`,
          }),
        })
      }
    },
    {
      connection,
      concurrency: 5,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[queue] Job ${job?.id} failed:`, err.message)
  })

  console.log('[queue] Submission worker started')
}

export async function closeWorkers(): Promise<void> {
  if (worker) {
    await worker.close()
    worker = null
  }
  await submissionQueue.close()
}
