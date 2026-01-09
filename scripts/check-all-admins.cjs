const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./edumaster.db');

db.all('SELECT id, phone, role, permissions FROM users WHERE role = "ADMIN"', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`找到 ${rows.length} 个管理员账号:\n`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.phone} (${row.id})`);
      console.log(`   Permissions (raw): ${row.permissions}`);
      console.log(`   Permissions (type): ${typeof row.permissions}`);
      
      if (row.permissions) {
        try {
          const parsed = JSON.parse(row.permissions);
          console.log(`   Permissions (parsed): ${JSON.stringify(parsed)}`);
          console.log(`   Is Array: ${Array.isArray(parsed)}`);
        } catch (e) {
          console.log(`   Parse error: ${e.message}`);
        }
      }
      console.log('');
    });
  }
  db.close();
});
