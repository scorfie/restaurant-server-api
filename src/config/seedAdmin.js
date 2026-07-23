import 'dotenv/config';
import { hashPassword } from '../utils/password.js';
import { pool } from './db.js';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed an admin');
    process.exitCode = 1;
    return;
  }

  const [existing] = await pool.query('SELECT id FROM staff WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.log(`Staff account already exists for ${email}, skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await pool.query('INSERT INTO staff (branch_id, name, email, password, role) VALUES (NULL, ?, ?, ?, ?)', [
    name,
    email,
    passwordHash,
    'admin',
  ]);

  console.log(`Admin staff account created for ${email}`);
}

seedAdmin()
  .catch((err) => {
    console.error('Failed to seed admin:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
