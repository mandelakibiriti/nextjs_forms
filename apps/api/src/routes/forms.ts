import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { forms } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth.js'
import {
  CreateFormSchema,
  UpdateFormSchema,
  createFormSchema,
  generateId,
} from '@formforge/schema-core'

const FormIdParams = z.object({ id: z.string().uuid() })
const FormSlugParams = z.object({ slug: z.string() })
const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export async function formsRoutes(app: FastifyInstance): Promise<void> {
  // List user forms
  app.get('/forms', {
    schema: {
      tags: ['Forms'],
      summary: 'List all forms for the authenticated user',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
    preHandler: authMiddleware,
    handler: async (request) => {
      const { page, limit } = ListQuerySchema.parse(request.query)
      const offset = (page - 1) * limit

      const rows = await db
        .select({
          id: forms.id,
          slug: forms.slug,
          name: forms.name,
          description: forms.description,
          version: forms.version,
          isPublished: forms.isPublished,
          publishedAt: forms.publishedAt,
          createdAt: forms.createdAt,
          updatedAt: forms.updatedAt,
        })
        .from(forms)
        .where(eq(forms.userId, request.user.id))
        .orderBy(desc(forms.updatedAt))
        .limit(limit)
        .offset(offset)

      return { forms: rows, page, limit }
    },
  })

  // Create form
  app.post('/forms', {
    schema: {
      tags: ['Forms'],
      summary: 'Create a new form',
      security: [{ bearerAuth: [] }],
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = CreateFormSchema.parse(request.body)
      const now = new Date().toISOString()
      const schema = createFormSchema(body.name, {
        ...body,
        steps: body.steps ?? undefined,
      })

      const [form] = await db
        .insert(forms)
        .values({
          id: generateId(),
          userId: request.user.id,
          slug: schema.slug,
          name: schema.name,
          description: schema.description,
          schema,
          version: 1,
        })
        .returning()

      if (!form) throw new Error('Failed to create form')
      return reply.status(201).send(form)
    },
  })

  // Get form by slug (public — for rendering)
  app.get('/forms/:slug', {
    schema: {
      tags: ['Forms'],
      summary: 'Get a published form schema by slug',
      params: {
        type: 'object',
        properties: { slug: { type: 'string' } },
        required: ['slug'],
      },
    },
    handler: async (request, reply) => {
      const { slug } = FormSlugParams.parse(request.params)

      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.slug, slug), eq(forms.isPublished, true)))
        .limit(1)

      if (!form) {
        return reply.status(404).send({ error: 'Form not found or not published' })
      }

      return { schema: form.schema, name: form.name, slug: form.slug }
    },
  })

  // Get form by ID (authenticated — for editing)
  app.get('/forms/id/:id', {
    schema: {
      tags: ['Forms'],
      summary: 'Get a form by ID (owner only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id } = FormIdParams.parse(request.params)

      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.userId, request.user.id)))
        .limit(1)

      if (!form) {
        return reply.status(404).send({ error: 'Form not found' })
      }

      return form
    },
  })

  // Update form
  app.put('/forms/:id', {
    schema: {
      tags: ['Forms'],
      summary: 'Update a form',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id } = FormIdParams.parse(request.params)
      const updates = UpdateFormSchema.parse(request.body)

      const [existing] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.userId, request.user.id)))
        .limit(1)

      if (!existing) {
        return reply.status(404).send({ error: 'Form not found' })
      }

      const updatedSchema = {
        ...existing.schema,
        ...updates,
        updatedAt: new Date().toISOString(),
        version: existing.version + 1,
      }

      const [updated] = await db
        .update(forms)
        .set({
          name: updates.name ?? existing.name,
          description: updates.description ?? existing.description,
          slug: updates.slug ?? existing.slug,
          schema: updatedSchema,
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(forms.id, id))
        .returning()

      return updated
    },
  })

  // Publish form
  app.post('/forms/:id/publish', {
    schema: {
      tags: ['Forms'],
      summary: 'Publish a form (makes it publicly accessible)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id } = FormIdParams.parse(request.params)

      const [existing] = await db
        .select({ id: forms.id, userId: forms.userId })
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.userId, request.user.id)))
        .limit(1)

      if (!existing) {
        return reply.status(404).send({ error: 'Form not found' })
      }

      const now = new Date()
      const [updated] = await db
        .update(forms)
        .set({ isPublished: true, publishedAt: now, updatedAt: now })
        .where(eq(forms.id, id))
        .returning()

      return updated
    },
  })

  // Unpublish form
  app.post('/forms/:id/unpublish', {
    schema: {
      tags: ['Forms'],
      summary: 'Unpublish a form',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id } = FormIdParams.parse(request.params)

      const [existing] = await db
        .select({ id: forms.id, userId: forms.userId })
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.userId, request.user.id)))
        .limit(1)

      if (!existing) {
        return reply.status(404).send({ error: 'Form not found' })
      }

      const [updated] = await db
        .update(forms)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(eq(forms.id, id))
        .returning()

      return updated
    },
  })

  // Delete form
  app.delete('/forms/:id', {
    schema: {
      tags: ['Forms'],
      summary: 'Delete a form',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id } = FormIdParams.parse(request.params)

      const [existing] = await db
        .select({ id: forms.id, userId: forms.userId })
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.userId, request.user.id)))
        .limit(1)

      if (!existing) {
        return reply.status(404).send({ error: 'Form not found' })
      }

      await db.delete(forms).where(eq(forms.id, id))
      return reply.status(204).send()
    },
  })
}
