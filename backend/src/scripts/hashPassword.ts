import { hashPassword } from '../utils/auth';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password <password>');
  process.exit(1);
}

hashPassword(password).then(hash => {
  console.log('\nPassword:', password);
  console.log('Hash:', hash);
  console.log('\nUse este hash no banco de dados na coluna senha_usuario');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
