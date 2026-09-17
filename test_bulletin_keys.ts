import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./dist/data.json', 'utf8') || '{}');
console.log('Bulletin keys:', Object.keys(db.bulletins || {}));

for (const k of Object.keys(db.bulletins || {})) {
  const b = db.bulletins[k];
  console.log(`${k}: content length ${b?.content?.length}, races: ${b?.races?.length}, allRaces: ${b?.allRaces?.length}`);
}
