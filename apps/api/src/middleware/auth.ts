import type { FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../db/index.js'
import { apiKeys, users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

// Extend @fastify/jwt so request.jwtVerify() sets the typed payload
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string }
    user: { id: string; email: string }
  }
}

async function hashApiKey(key: string): Promise<string> {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    return reply.status(401).send({ error: 'Missing Authorization header' })
  }

  // JWT Bearer token
  if (authHeader.startsWith('Bearer ')) {
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' })
    }
    return
  }

  // API Key
  if (authHeader.startsWith('ApiKey ')) {
    const key = authHeader.slice(7)
    const keyHash = await hashApiKey(key)

    const [apiKey] = await db
      .select({ id: apiKeys.id, userId: apiKeys.userId })
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1)

    if (!apiKey) {
      return reply.status(401).send({ error: 'Invalid API key' })
    }

    void db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, apiKey.userId))
      .limit(1)

    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    // Manually populate the jwt user slot for API key auth
    request.user = { id: user.id, email: user.email }
    return
  }

  return reply.status(401).send({ error: 'Invalid authorization format' })
}
