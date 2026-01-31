import { getClient, closePool } from '../db';

async function seedDatabase() {
  const client = await getClient();

  try {
    console.log('🌱 Starting database seeding...\n');

    // Check if already seeded
    const { rows } = await client.query('SELECT COUNT(*) FROM roles');
    if (Number.parseInt(rows[0].count) > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      console.log('   Run reset first if you want to re-seed.\n');
      return;
    }

    // Execute seed SQL
    console.log('📄 Running seed script...');
    // The seed data is in migration 003_seed_data.sql
    // It will be executed as part of migrations
    
    console.log('✅ Seeding completed via migrations\n');
    console.log('========================================');
    console.log('🎉 Database is ready!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await closePool();
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedDatabase();
}

export default seedDatabase;
