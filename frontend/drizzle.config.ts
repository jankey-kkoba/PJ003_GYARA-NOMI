import { defineConfig } from 'drizzle-kit'
import { DATABASE_URL } from '@/libs/constants/env'

export default defineConfig({
  schema: './src/libs/db/schema',
  out: '../supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
})
