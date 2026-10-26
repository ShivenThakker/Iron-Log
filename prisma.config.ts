import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
})
