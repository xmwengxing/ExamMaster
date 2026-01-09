const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./edumaster.db');

db.all('SELECT id, phone, realName, allowedBankIds FROM users WHERE role = "STUDENT" LIMIT 5', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Student bank permissions:');
    rows.forEach(row => {
      console.log(`\n${row.realName} (${row.phone}):`);
      console.log(`  allowedBankIds (raw): ${row.allowedBankIds}`);
      try {
        const parsed = JSON.parse(row.allowedBankIds || '[]');
        console.log(`  allowedBankIds (parsed): ${JSON.stringify(parsed)}`);
        console.log(`  Count: ${parsed.length}`);
      } catch (e) {
        console.log(`  Parse error: ${e.message}`);
      }
    });
  }
  db.close();
});
