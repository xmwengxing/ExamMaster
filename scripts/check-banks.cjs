const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./edumaster.db');

db.all('SELECT id, name FROM banks LIMIT 10', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Banks:');
    rows.forEach(row => {
      console.log(`  ${row.id}: ${row.name}`);
    });
  }
  db.close();
});
