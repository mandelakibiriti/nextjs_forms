import type { FastifyInstance } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export async function openApiPlugin(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'FormForge API',
        description: 'JSON-driven form builder REST API',
        version: '0.1.0',
        contact: {
          name: 'FormForge',
          url: 'https://formforge.io',
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Use format: ApiKey <your-key>',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Authentication and API key management' },
        { name: 'Forms', description: 'Form schema CRUD operations' },
        { name: 'Submissions', description: 'Form submission management' },
      ],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
}
