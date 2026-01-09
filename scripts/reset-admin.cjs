const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./edumaster.db');
const newPass = 'admin';
const hash = bcrypt.hashSync(newPass, 10);

db.serialize(() => {
  db.run("UPDATE users SET password = ? WHERE phone = 'admin'", [hash], function(err) {
    if (err) {
      console.error('Error updating admin password:', err);
      process.exit(1);
    }
    console.log('Updated rows:', this.changes);
    db.get("SELECT id, phone, role FROM users WHERE phone = 'admin'", (e, row) => {
      if (e) console.error(e);
      else console.log('Admin record:', row);
      db.close();
    });
  });
});