const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function seedData() {
  console.log('[Seed] Starting database check and password hash sync...');

  try {
    // Generate valid bcrypt hash for 'Password123!'
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Password123!', salt);
    console.log('[Seed] Generated fresh bcrypt hash for Password123!');

    // Update all seeded users with valid hash
    await db.query('UPDATE users SET password = ?', [hash]);
    console.log('[Seed] All users updated with password "Password123!"');

    const [userRows] = await db.query('SELECT user_id, name, email, role FROM users');
    console.table(userRows);

    const [courseRows] = await db.query('SELECT code, title, credits, prerequisite_code FROM courses LIMIT 8');
    console.table(courseRows);

    console.log('[Seed] Database initialization and seed check completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
}

seedData();
