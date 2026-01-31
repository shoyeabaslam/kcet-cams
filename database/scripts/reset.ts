import { getClient, closePool } from '../db';

async function resetDatabase() {
  const client = await getClient();

  try {
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('🗑️  Dropping all tables...\n');

    await client.query('BEGIN');

    // Drop all tables in reverse dependency order
    const tables = [
      'audit_logs',
      'status_history',
      'student_fee_summary',
      'fee_payments',
      'student_documents',
      'document_types',
      'fee_structures',
      'course_offerings',
      'courses',
      'academic_years',
      'students',
      'users',
      'roles',
      'schema_migrations'
    ];

    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✅ Dropped table: ${table}`);
    }

    // Drop all functions
    await client.query(`
      DROP FUNCTION IF EXISTS update_student_document_status() CASCADE;
      DROP FUNCTION IF EXISTS update_fee_summary_after_payment() CASCADE;
      DROP FUNCTION IF EXISTS log_status_change() CASCADE;
      DROP FUNCTION IF EXISTS create_audit_log() CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `);
    console.log('✅ Dropped all functions');

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('🎉 Database reset completed!');
    console.log('Run migrations to recreate the schema.');
    console.log('========================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await closePool();
  }
}

// Run reset if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await resetDatabase();
}

export default resetDatabase;
