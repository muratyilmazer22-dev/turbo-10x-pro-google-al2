import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./dist/data.json', 'utf8') || '{}');

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

const targetHipodrom = "ELAZIĞ";
const targetDate = "2026-09-17";
const targetProgram = "1. Altılı Ganyan";
const normTargetHipodrom = normalizeText(targetHipodrom);
const dateKey = `${normTargetHipodrom}_${targetDate}`;

console.log('dateKey:', dateKey);
console.log('in db:', Boolean(db.bulletins[dateKey]));

let storedRaces: any[] = [];
if ((db.bulletins[dateKey] as any)?.allRaces && (db.bulletins[dateKey] as any).allRaces.length > 0) {
  storedRaces = (db.bulletins[dateKey] as any).allRaces;
} else if ((db.bulletins[dateKey] as any)?.races && (db.bulletins[dateKey] as any).races.length > 0) {
  storedRaces = (db.bulletins[dateKey] as any).races;
}
console.log('Initial storedRaces count:', storedRaces.length);

// Check lines 11245-11325
const hasUserProvidedRaces = storedRaces.some(r => (r as any).isUserProvided);
console.log('hasUserProvidedRaces:', hasUserProvidedRaces);

// Let's check lines 11335-11395 in server.ts
console.log('Is targetProgram 1. Altılı:', targetProgram.includes("1. Altılı"));
console.log('Does storedRaces have race 1:', storedRaces.some(r => Number(r.raceNo) === 1));
