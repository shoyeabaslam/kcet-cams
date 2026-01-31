import bcrypt from 'bcryptjs';

const password = 'password123';
const hash = await bcrypt.hash(password, 10);
console.log('\n✅ Generated bcrypt hash for "password123":');
console.log(hash);
console.log('\n');
