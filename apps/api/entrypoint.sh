#!/bin/sh
set -e

echo "==> FormForge API starting..."

# Wait for PostgreSQL to be ready
echo "==> Waiting for PostgreSQL..."
until nc -z "${DB_HOST:-localhost}" "${DB_PORT:-5432}" 2>/dev/null; do
  echo "  PostgreSQL is not ready — retrying in 2s..."
  sleep 2
done
echo "==> PostgreSQL is ready"

# Run database migrations
echo "==> Running database migrations..."
node dist/db/migrate.js
echo "==> Migrations complete"

# Start the API server
echo "==> Starting API server on port ${PORT:-3001}..."
exec node dist/index.js
