import fs from 'fs';
const db = JSON.parse(fs.readFileSync('./dist/data.json', 'utf8') || '{}');
const b = db.bulletins['ANKARA_2026-09-17'];
const lines = b.content.split('\n');
lines.forEach((line: string, i: number) => {
  if (line.includes("6'LI GANYAN") || line.includes("Koşu")) {
    console.log(`Line ${i}: ${line.slice(0, 100)}`);
  }
});
