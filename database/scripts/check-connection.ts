import pool, { closePool } from '../db'

async function checkDatabaseHealth() {
  console.log('🔍 Checking database connection...\n')

  try {
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version')
    const { current_time, db_version } = result.rows[0]

    console.log('✅ Database connection successful!')
    console.log(`📅 Current Time: ${current_time}`)
    console.log(`🗄️  PostgreSQL Version: ${db_version.split(',')[0]}\n`)

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    if (tablesResult.rows.length > 0) {
      console.log('📋 Existing tables:')
      tablesResult.rows.forEach((row: { table_name: string }) => {
        console.log(`   - ${row.table_name}`)
      })
      console.log('')
    } else {
      console.log('⚠️  No tables found. Run migration first.\n')
    }

    // Check row counts for key tables
    const keyTables = ['packages', 'fruits', 'orders', 'settings']
    
    console.log('📊 Table row counts:')
    for (const table of keyTables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
        const count = countResult.rows[0].count
        console.log(`   - ${table}: ${count} rows`)
      } catch {
        console.log(`   - ${table}: Table not found`)
      }
    }

    console.log('\n✨ Database health check completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection failed!')
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
      console.error(`Stack: ${error.stack}`)
    } else {
      console.error('Error:', error)
    }
    console.error('\n💡 Make sure:')
    console.error('   1. PostgreSQL is running')
    console.error('   2. DATABASE_URL is set in .env.local')
    console.error('   3. Database credentials are correct\n')
    process.exit(1)
  } finally {
    await closePool()
  }
}

await checkDatabaseHealth()
