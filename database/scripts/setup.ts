#!/usr/bin/env tsx

import { getClient, closePool } from '../db';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  const client = await getClient();

  try {
    console.log('🚀 Starting complete database setup...\n');

    // Step 1: Check connection
    console.log('1️⃣  Checking database connection...');
    await client.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    // Step 2: Create migrations table
    console.log('2️⃣  Creating migrations tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Migrations table ready\n');

    // Step 3: Run migrations
    console.log('3️⃣  Running migrations...');
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const { rows: executedMigrations } = await client.query(
      'SELECT migration_name FROM schema_migrations'
    );
    const executedSet = new Set(executedMigrations.map((m: { migration_name: string }) => m.migration_name));

    let successCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`   ⏭️  ${file} (already executed)`);
        skippedCount++;
        continue;
      }

      console.log(`   📄 Executing ${file}...`);
      
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
        
        console.log(`   ✅ ${file} completed`);
        successCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Error in ${file}:`, error);
        throw error;
      }
    }

    console.log(`\n   📊 Migrations: ${successCount} executed, ${skippedCount} skipped\n`);

    // Step 4: Verify setup
    console.log('4️⃣  Verifying setup...');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name NOT IN ('schema_migrations')
      ORDER BY table_name
    `);
    
    console.log(`✅ Created ${tables.rows.length} tables\n`);

    // Step 5: Show summary
    console.log('\n========================================');
    console.log('🎉 Database setup completed successfully!');
    console.log('========================================\n');
    
    console.log('📊 Database Summary:');
    console.log(`   • Tables: ${tables.rows.length}`);
    
    const { rows: roleCount } = await client.query('SELECT COUNT(*) FROM roles');
    console.log(`   • Roles: ${roleCount[0].count}`);
    
    const { rows: userCount } = await client.query('SELECT COUNT(*) FROM users');
    console.log(`   • Users: ${userCount[0].count}`);
    
    const { rows: courseCount } = await client.query('SELECT COUNT(*) FROM courses');
    console.log(`   • Courses: ${courseCount[0].count}`);
    
    const { rows: docTypeCount } = await client.query('SELECT COUNT(*) FROM document_types');
    console.log(`   • Document Types: ${docTypeCount[0].count}`);
    
    console.log('\n📝 Default Login Credentials (password: password123):');
    console.log('   • superadmin@college.edu (SuperAdmin)');
    console.log('   • admin@college.edu (Admin)');
    console.log('   • admission@college.edu (AdmissionStaff)');
    console.log('   • documents@college.edu (DocumentOfficer)');
    console.log('   • accounts@college.edu (AccountsOfficer)');
    console.log('   • principal@college.edu (Principal)');
    console.log('   • director@college.edu (Director)');
    
    console.log('\n⚠️  IMPORTANT: Change default passwords in production!');
    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure PostgreSQL is running');
    console.error('   2. Check .env.local configuration');
    console.error('   3. Verify database exists: createdb ams_db');
    console.error('   4. Check user permissions\n');
    process.exit(1);
  } finally {
    client.release();
    await closePool();
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await setupDatabase();
}

export default setupDatabase;
