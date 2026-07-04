/**
 * 🪐 KEPLER432B — Generate database.sql with REAL bcrypt hashes
 * 
 * Usage:
 *   cd server
 *   npx ts-node generate-sql.ts
 * 
 * This reads .env and generates a working database.sql with
 * properly hashed admin credentials.
 */

import bcrypt from 'bcrypt';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

async function main() {
  console.log('🔑 Generating bcrypt hashes...');

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPin = process.env.ADMIN_PIN || '1234';
  const adminPin1 = process.env.ADMIN_PIN1 || 'pin1';
  const adminPin2 = process.env.ADMIN_PIN2 || 'pin2';
  const adminPin3 = process.env.ADMIN_PIN3 || 'pin3';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kepler432b.com';
  const adminName = process.env.ADMIN_NAME || 'System Admin';

  const [pwHash, pinHash, p1Hash, p2Hash, p3Hash] = await Promise.all([
    bcrypt.hash(adminPassword, ROUNDS),
    bcrypt.hash(adminPin, ROUNDS),
    bcrypt.hash(adminPin1, ROUNDS),
    bcrypt.hash(adminPin2, ROUNDS),
    bcrypt.hash(adminPin3, ROUNDS),
  ]);

  console.log('✅ Hashes generated');
  console.log(`   Password (${adminPassword}): ${pwHash}`);
  console.log(`   PIN (${adminPin}): ${pinHash}`);
  console.log(`   Admin PIN1 (${adminPin1}): ${p1Hash}`);
  console.log(`   Admin PIN2 (${adminPin2}): ${p2Hash}`);
  console.log(`   Admin PIN3 (${adminPin3}): ${p3Hash}`);

  // Read template and replace placeholders
  let sql = fs.readFileSync('database.sql', 'utf8');

  // Replace the entire admin INSERT block with real hashes
  const adminInsert = `INSERT INTO users (name, email, password, login_pin, referral_code, kyc_status, is_admin, admin_pin1, admin_pin2, admin_pin3)
SELECT
    '${adminName}',
    '${adminEmail}',
    '${pwHash}',
    '${pinHash}',
    'ADMIN01',
    'verified',
    TRUE,
    '${p1Hash}',
    '${p2Hash}',
    '${p3Hash}'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '${adminEmail}');`;

  // Replace from "INSERT INTO users" to the WHERE NOT EXISTS line
  sql = sql.replace(
    /INSERT INTO users \(name, email, password, login_pin, referral_code, kyc_status, is_admin, admin_pin1, admin_pin2, admin_pin3\)\nSELECT[\s\S]*?WHERE NOT EXISTS \(SELECT 1 FROM users WHERE email = 'admin@kepler432b\.com'\);/,
    adminInsert
  );

  const outFile = 'database-ready.sql';
  fs.writeFileSync(outFile, sql);
  console.log(`\n📄 Written to: ${outFile}`);
  console.log(`\n🚀 Run it with:`);
  console.log(`   psql -U postgres -d kepler432b -f ${outFile}`);
  console.log(`\n🔑 Admin credentials:`);
  console.log(`   Email:      ${adminEmail}`);
  console.log(`   Password:   ${adminPassword}`);
  console.log(`   Login PIN:  ${adminPin}`);
  console.log(`   Admin PIN1: ${adminPin1}`);
  console.log(`   Admin PIN2: ${adminPin2}`);
  console.log(`   Admin PIN3: ${adminPin3}`);
}

main().catch(console.error);
