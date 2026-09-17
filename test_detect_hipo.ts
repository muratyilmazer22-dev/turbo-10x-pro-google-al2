import fs from 'fs';

const serverTs = fs.readFileSync('./server.ts', 'utf8');

const s = serverTs.indexOf('function detectHipodromFromText(');
const e = serverTs.indexOf('\n}', s);
const func = serverTs.substring(s, e + 2);

console.log('detectHipodromFromText:\n', func);
