import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./dist/data.json', 'utf8') || '{}');
console.log('ELAZIG_2026-09-17:', JSON.stringify(db.bulletins['ELAZIG_2026-09-17'], null, 2));
