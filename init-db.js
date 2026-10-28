// Rebuilds data.db from schema.sql (only if the file doesn't exist; delete data.db first to reset).
const fs = require('fs'), Database = require('better-sqlite3');
const file = process.env.DB_PATH || 'data.db';
if (fs.existsSync(file)) { console.log(file + ' already exists. Delete it first to reset.'); process.exit(0); }
const db = new Database(file); db.exec(fs.readFileSync('schema.sql', 'utf8')); db.close(); console.log('Created ' + file);
