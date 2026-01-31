import { query, closePool } from '../db';

async function checkConnection() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    const result = await query('SELECT NOW() as current_time, version() as postgres_version');
    
    console.log('✅ Database connection successful!');
    console.log(`📅 Server time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].postgres_version}\n`);
    
    // Check if tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('📊 Existing tables:');
      tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️  No tables found. Run migrations to create schema.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('\n💡 Make sure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database credentials in .env.local are correct');
    console.error('   3. Database "ams_db" exists\n');
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run check if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await checkConnection();
}

export default checkConnection;
