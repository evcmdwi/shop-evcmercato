import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import * as crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function ensureMigrationsTable(): Promise<void> {
  const { error } = await supabase.rpc('exec_ddl', {
    sql: `CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      checksum VARCHAR(64)
    )`
  })

  if (error && !error.message.includes('already exists')) {
    // Table might already exist, check
    const { data } = await supabase.from('_migrations').select('id').limit(1)
    if (data === null) {
      console.warn('Warning: Could not create _migrations table:', error.message)
      console.warn('Migrations will still run but tracking may be skipped')
    }
  }
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('_migrations')
    .select('filename')

  if (error) {
    console.warn('Could not fetch applied migrations:', error.message)
    return new Set()
  }

  return new Set(data?.map(r => r.filename) ?? [])
}

async function recordMigration(filename: string, checksum: string): Promise<void> {
  const { error } = await supabase
    .from('_migrations')
    .upsert({ filename, checksum }, { onConflict: 'filename' })

  if (error) {
    console.warn(`Warning: Could not record migration ${filename}:`, error.message)
  }
}

async function runMigrations(): Promise<void> {
  console.log('🗃️  Running Supabase migrations...')
  console.log(`   URL: ${SUPABASE_URL}`)

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

  // Get all SQL files sorted by filename (timestamp order)
  const files = (await readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`   Found ${files.length} migration file(s)`)

  await ensureMigrationsTable()
  const applied = await getAppliedMigrations()

  let appliedCount = 0
  let skippedCount = 0

  for (const filename of files) {
    if (applied.has(filename)) {
      console.log(`   ⏭  Skipping (already applied): ${filename}`)
      skippedCount++
      continue
    }

    const filePath = join(migrationsDir, filename)
    const sql = await readFile(filePath, 'utf-8')
    const checksum = crypto.createHash('sha256').update(sql).digest('hex').slice(0, 16)

    console.log(`   ▶  Applying: ${filename}`)

    try {
      // Try via Supabase RPC if available
      const { error: rpcError } = await supabase.rpc('exec_ddl', { sql })

      if (rpcError) {
        console.warn(`   ⚠  RPC exec_ddl not available. Migration ${filename} needs manual execution.`)
        console.log(`   📋 SQL to run manually:\n${sql}\n`)
        // Skip recording — let Dwi run manually
        continue
      }

      await recordMigration(filename, checksum)
      console.log(`   ✅ Applied: ${filename}`)
      appliedCount++
    } catch (err) {
      console.error(`   ❌ Failed: ${filename}:`, err)
      console.log(`   📋 SQL to run manually:\n${sql}\n`)
      // Continue with other migrations
    }
  }

  console.log(`\n✅ Migration complete: ${appliedCount} applied, ${skippedCount} skipped`)

  if (appliedCount === 0 && skippedCount < files.length) {
    console.log('\n⚠️  Note: Some migrations could not be auto-applied.')
    console.log('   The exec_ddl RPC function may not be available in your Supabase project.')
    console.log('   Run migrations manually via Supabase Dashboard → SQL Editor.')
  }
}

runMigrations().catch(err => {
  console.error('Migration script error:', err)
  process.exit(1)
})
