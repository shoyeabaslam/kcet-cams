import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file FIRST before importing db
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Debug: Check if DATABASE_URL is loaded
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded ✓' : 'NOT FOUND ✗');
console.log('Connection string:', process.env.DATABASE_URL?.substring(0, 30) + '...\n');

interface Migration {
  file: string;
  order: number;
}

const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  // Dynamic import AFTER environment is loaded
  const { getClient, closePool } = await import('../db.js');
  const client = await getClient();

  try {
    console.log('🚀 Starting database migrations...\n');

    // Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get list of migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    // Get already executed migrations
    const { rows: executedMigrations } = await client.query(
      'SELECT migration_name FROM schema_migrations'
    );
    const executedSet = new Set(executedMigrations.map(m => m.migration_name));

    let successCount = 0;
    let skippedCount = 0;

    // Execute each migration
    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        skippedCount++;
        continue;
      }

      console.log(`📄 Executing ${file}...`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        
        console.log(`✅ Successfully executed ${file}\n`);
        successCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error executing ${file}:`, error);
        throw error;
      }
    }

    console.log('\n========================================');
    console.log('🎉 Migration completed!');
    console.log(`✅ Executed: ${successCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await closePool();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await runMigrations();
}

export default runMigrations;
