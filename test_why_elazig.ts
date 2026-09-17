import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./dist/data.json', 'utf8'));

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

const req = {
  body: {
    message: "Elazığ 1. altılı kuponu oluştur 80 tl",
    hipodrom: "ELAZIĞ",
    date: "2026-09-17",
    programType: "1. Altılı Ganyan",
    unitPrice: 1.25,
    targetBudget: 80
  }
};

const userMessage = req.body.message;
const targetHipodrom = req.body.hipodrom;
const targetDate = req.body.date;
const targetProgram = req.body.programType;
const normTargetHipodrom = normalizeText(targetHipodrom);
const dateKey = `${normTargetHipodrom}_${targetDate}`;

console.log({ targetHipodrom, normTargetHipodrom, dateKey });

console.log('db.bulletins[dateKey] present?', Boolean(db.bulletins[dateKey]));
console.log('races in db.bulletins[dateKey]?', db.bulletins[dateKey]?.races?.length);
console.log('allRaces in db.bulletins[dateKey]?', db.bulletins[dateKey]?.allRaces?.length);
console.log('content in db.bulletins[dateKey]?', Boolean(db.bulletins[dateKey]?.content));

// Why did the server return "BÜLTEN VERİSİ EKSİK"?
// Let's check what happened in server.ts:
// Line 10264: let normTargetHipodrom = normalizeText(targetHipodrom);
// DateKey: ELAZIG_2026-09-17
