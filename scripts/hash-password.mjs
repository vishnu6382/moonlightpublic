import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/hash-password.mjs <your_password>');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\nGenerated Bcrypt Password Hash:');
console.log(hash);
console.log('\nCopy and paste this value into your .env.local as:');
console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
