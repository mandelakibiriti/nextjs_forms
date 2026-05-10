import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { forms, submissions } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth.js'
import { FormSchemaSchema } from '@formforge/schema-core'
import { submissionQueue } from '../queue/index.js'

const SlugParams = z.object({ slug: z.string() })
const FormIdParams = z.object({ id: z.string().uuid() })

export async function submissionsRoutes(app: FastifyInstance): Promise<void> {
  // Submit form data
  app.post('/forms/:slug/submit', {
    schema: {
      tags: ['Submissions'],
      summary: 'Submit form data',
      params: {
        type: 'object',
        properties: { slug: { type: 'string' } },
        required: ['slug'],
      },
    },
    handler: async (request, reply) => {
      const { slug } = SlugParams.parse(request.params)

      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.slug, slug), eq(forms.isPublished, true)))
        .limit(1)

      if (!form) {
        return reply.status(404).send({ error: 'Form not found or not published' })
      }

      const submissionData = request.body as Record<string, unknown>

      // Basic type validation using schema
      const parsedSchema = FormSchemaSchema.safeParse(form.schema)
      if (!parsedSchema.success) {
        return reply.status(500).send({ error: 'Invalid form schema on server' })
      }

      const [submission] = await db
        .insert(submissions)
        .values({
          formId: form.id,
          data: submissionData,
          metadata: {
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          },
        })
        .returning()

      if (!submission) throw new Error('Failed to create submission')

      // Enqueue async processing (webhooks, notifications)
      if (form.schema.settings?.webhooks?.length || form.schema.settings?.notifications) {
        await submissionQueue.add('process-submission', {
          submissionId: submission.id,
          formId: form.id,
          schema: form.schema,
          data: submissionData,
        })
      }

      return reply.status(201).send({
        id: submission.id,
        message: form.schema.settings?.successMessage ?? 'Form submitted successfully',
        redirectUrl: form.schema.settings?.redirectUrl,
      })
    },
  })

  // List submissions for a form
  app.get('/forms/:id/submissions', {
    schema: {
      tags: ['Submissions'],
      summary: 'List submissions for a form',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id } = FormIdParams.parse(request.params)
      const { page, limit } = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(100).default(20),
        })
        .parse(request.query)

      // Verify form ownership
      const [form] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.userId, request.user.id)))
        .limit(1)

      if (!form) {
        return reply.status(404).send({ error: 'Form not found' })
      }

      const rows = await db
        .select()
        .from(submissions)
        .where(eq(submissions.formId, id))
        .orderBy(desc(submissions.submittedAt))
        .limit(limit)
        .offset((page - 1) * limit)

      return { submissions: rows, page, limit }
    },
  })

  // Get single submission
  app.get('/submissions/:id', {
    schema: {
      tags: ['Submissions'],
      summary: 'Get a submission by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const [submission] = await db
        .select({
          submission: submissions,
          form: {
            id: forms.id,
            userId: forms.userId,
          },
        })
        .from(submissions)
        .innerJoin(forms, eq(submissions.formId, forms.id))
        .where(and(eq(submissions.id, id), eq(forms.userId, request.user.id)))
        .limit(1)

      if (!submission) {
        return reply.status(404).send({ error: 'Submission not found' })
      }

      return submission.submission
    },
  })
}
