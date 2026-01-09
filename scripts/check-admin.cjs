const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./edumaster.db');

db.get('SELECT id, phone, role, permissions FROM users WHERE phone = "admin"', [], (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else if (row) {
    console.log('超级管理员信息:');
    console.log('  ID:', row.id);
    console.log('  Phone:', row.phone);
    console.log('  Role:', row.role);
    console.log('  Permissions (raw):', row.permissions);
    console.log('  Permissions (type):', typeof row.permissions);
    
    if (row.permissions) {
      try {
        const parsed = JSON.parse(row.permissions);
        console.log('  Permissions (parsed):', parsed);
        console.log('  Is Array:', Array.isArray(parsed));
      } catch (e) {
        console.log('  Parse error:', e.message);
      }
    }
  } else {
    console.log('未找到超级管理员账号 (phone = "admin")');
  }
  db.close();
});
