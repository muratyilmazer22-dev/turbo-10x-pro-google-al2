import fs from 'fs';

const serverTs = fs.readFileSync('./server.ts', 'utf8');

const s = serverTs.indexOf('class ProgramDetector');
const e = serverTs.indexOf('\n}', s);
const func = serverTs.substring(s, e + 2);

console.log('ProgramDetector:\n', func);
