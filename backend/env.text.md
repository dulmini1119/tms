# Environment variables declared in this file are NOT automatically loaded by Prisma.
# Please add `import "dotenv/config";` to your `prisma.config.ts` file, or use the Prisma CLI with Bun
# to load environment variables from .env files: https://pris.ly/prisma-config-env-vars.

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

# The following `prisma+postgres` URL is similar to the URL produced by running a local Prisma Postgres 
# server with the `prisma dev` CLI command, when not choosing any non-default ports or settings. The API key, unlike the 
# one found in a remote Prisma Postgres URL, does not contain any sensitive information.


# -----------------------------
# Application
# -----------------------------
NODE_ENV=development
PORT=3001
API_VERSION=v1

# -----------------------------
# Database
# -----------------------------
DATABASE_URL="postgresql://postgres:dulmini@localhost:5432/tms?schema=public"

# -----------------------------
# JWT
# -----------------------------
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
JWT_ACCESS_SECRET=your_very_strong_secret_key_here_123456789
# -----------------------------
# CORS
# -----------------------------
ALLOWED_ORIGINS=http://localhost:3000

# -----------------------------
# Rate Limiting
# -----------------------------
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100      # max requests per window for general routes
RATE_LIMIT_AUTH_MAX=10            # max requests per window for auth routes

# -----------------------------
# File Upload
# -----------------------------
MAX_FILE_SIZE=5242880            # 5 MB in bytes
UPLOAD_DIR=./uploads

# -----------------------------
# Logging
# -----------------------------
LOG_LEVEL=info

