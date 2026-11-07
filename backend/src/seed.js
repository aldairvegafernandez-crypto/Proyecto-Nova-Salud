require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  await db.query(`INSERT INTO users(username,password_hash,full_name,role)
    VALUES('admin',?,?, 'admin') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
    [hash,'Administrador Nova Salud']);
  console.log('Usuario creado: admin / admin123');
  await db.end();
})().catch(e => { console.error(e); process.exit(1); });
