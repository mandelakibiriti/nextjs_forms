import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { apiKeys, users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

async function hashApiKey(key: string): Promise<string> {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    reply.status(401).send({ error: 'Missing Authorization header' })
    return
  }

  // Support both JWT Bearer and API key formats
  if (authHeader.startsWith('Bearer ')) {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Invalid or expired token' })
    }
    return
  }

  if (authHeader.startsWith('ApiKey ')) {
    const key = authHeader.slice(7)
    const keyHash = await hashApiKey(key)

    const [apiKey] = await db
      .select({ id: apiKeys.id, userId: apiKeys.userId })
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1)

    if (!apiKey) {
      reply.status(401).send({ error: 'Invalid API key' })
      return
    }

    // Update last used timestamp (fire and forget)
    void db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, apiKey.userId))
      .limit(1)

    if (!user) {
      reply.status(401).send({ error: 'User not found' })
      return
    }

    request.user = { id: user.id, email: user.email }
    return
  }

  reply.status(401).send({ error: 'Invalid authorization format' })
}

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; email: string }
  }
}
