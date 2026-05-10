import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const migrationsFolder = path.resolve(__dirname, '../../drizzle/migrations')

console.log(`[migrate] Running migrations from ${migrationsFolder}`)
console.log(`[migrate] Connecting to database...`)

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client)

try {
  await migrate(db, { migrationsFolder })
  console.log('[migrate] All migrations applied successfully')
} catch (err) {
  console.error('[migrate] Migration failed:', err)
  process.exit(1)
} finally {
  await client.end()
}
