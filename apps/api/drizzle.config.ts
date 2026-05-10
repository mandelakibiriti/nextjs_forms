import { defineConfig } from 'drizzle-kit'
import { env } from './src/env.js'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
