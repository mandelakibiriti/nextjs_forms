import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { users, apiKeys } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'
import { authMiddleware } from '../middleware/auth.js'

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const CreateApiKeyBody = z.object({
  name: z.string().min(1).max(100),
})

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const inputHash = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'))
}

function generateApiKey(): string {
  return `ff_${crypto.randomBytes(32).toString('hex')}`
}

async function hashApiKey(key: string): Promise<string> {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const body = RegisterBody.parse(request.body)

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1)

      if (existing) {
        return reply.status(409).send({ error: 'Email already registered' })
      }

      const passwordHash = await hashPassword(body.password)
      const [user] = await db
        .insert(users)
        .values({ email: body.email, passwordHash, name: body.name })
        .returning({ id: users.id, email: users.email, name: users.name })

      if (!user) throw new Error('Failed to create user')

      const token = app.jwt.sign({ id: user.id, email: user.email })
      return reply.status(201).send({ user, token })
    },
  })

  app.post('/auth/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login and get JWT token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const body = LoginBody.parse(request.body)

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1)

      if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
        return reply.status(401).send({ error: 'Invalid email or password' })
      }

      const token = app.jwt.sign({ id: user.id, email: user.email })
      return { user: { id: user.id, email: user.email, name: user.name }, token }
    },
  })

  app.post('/auth/api-keys', {
    schema: {
      tags: ['Auth'],
      summary: 'Create an API key',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    },
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = CreateApiKeyBody.parse(request.body)
      const key = generateApiKey()
      const keyHash = await hashApiKey(key)

      const [apiKey] = await db
        .insert(apiKeys)
        .values({ userId: request.user.id, keyHash, name: body.name })
        .returning({ id: apiKeys.id, name: apiKeys.name, createdAt: apiKeys.createdAt })

      if (!apiKey) throw new Error('Failed to create API key')

      // Return the raw key once — it cannot be retrieved again
      return reply.status(201).send({ ...apiKey, key })
    },
  })

  app.get('/auth/api-keys', {
    schema: {
      tags: ['Auth'],
      summary: 'List API keys for current user',
      security: [{ bearerAuth: [] }],
    },
    preHandler: authMiddleware,
    handler: async (request) => {
      const keys = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          lastUsedAt: apiKeys.lastUsedAt,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, request.user.id))

      return { apiKeys: keys }
    },
  })
}
