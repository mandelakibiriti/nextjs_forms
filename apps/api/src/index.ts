import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { env } from './env.js'
import { openApiPlugin } from './plugins/openapi.js'
import { authRoutes } from './routes/auth.js'
import { formsRoutes } from './routes/forms.js'
import { submissionsRoutes } from './routes/submissions.js'
import { startWorkers, closeWorkers } from './queue/index.js'

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

async function bootstrap(): Promise<void> {
  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disabled for API
  })
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  })
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // Auth
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })

  // OpenAPI docs
  await openApiPlugin(app)

  // Routes
  await app.register(authRoutes)
  await app.register(formsRoutes)
  await app.register(submissionsRoutes)

  // Health check
  app.get('/health', {
    schema: { tags: ['Health'], summary: 'Health check' },
    handler: async () => ({ status: 'ok', timestamp: new Date().toISOString() }),
  })

  // Start BullMQ workers
  startWorkers()

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down...`)
      await closeWorkers()
      await app.close()
      process.exit(0)
    })
  }

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`FormForge API running on port ${env.PORT}`)
  app.log.info(`API docs: http://localhost:${env.PORT}/docs`)
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
