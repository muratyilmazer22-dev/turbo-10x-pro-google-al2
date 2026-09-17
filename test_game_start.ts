import fs from 'fs';
import * as esbuild from 'esbuild';

const db = JSON.parse(fs.readFileSync('./dist/data.json', 'utf8') || '{}');
const b = db.bulletins['ANKARA_2026-09-17'];

const serverTs = fs.readFileSync('./server.ts', 'utf8');

const startIdx = serverTs.indexOf('function determineGameStartRaceAndLegs(');
const endIdx = serverTs.indexOf('function parseRaces(', startIdx);
const funcCode = serverTs.substring(startIdx, endIdx);

const jsCode = esbuild.transformSync(funcCode, { loader: 'ts' }).code;

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/İ/g, "I")
    .replace(/ı/g, "I")
    .replace(/i̇/g, "i")
    .replace(/i\u0307/g, "i")
    .replace(/I\u0307/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "C")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

const fn = new Function('normalizeText', 'isBursaCard', 'TODAYS_ACTUAL_TJK_BULLETIN_TEXT', jsCode + '\nreturn determineGameStartRaceAndLegs;');

const determineGameStartRaceAndLegs = fn(normalizeText, false, '');

const res1 = determineGameStartRaceAndLegs(b.content, b.races, '1. Altılı Ganyan', undefined, 'ANKARA');
console.log('Result for 1. Altılı Ganyan:', res1);

const res2 = determineGameStartRaceAndLegs(b.content, b.races, '2. Altılı Ganyan', undefined, 'ANKARA');
console.log('Result for 2. Altılı Ganyan:', res2);
