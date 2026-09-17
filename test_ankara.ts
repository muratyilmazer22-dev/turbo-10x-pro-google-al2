import fs from 'fs';

// Read server.ts content to extract determineGameStartRaceAndLegs and run it
const serverCode = fs.readFileSync('./server.ts', 'utf8');

const db = JSON.parse(fs.readFileSync('./dist/data.json', 'utf8') || '{}');
const b = db.bulletins['ANKARA_2026-09-17'];

console.log('Testing with Ankara bulletin:');
// Let's test ProgramDetector.detectProgramFromText on the user prompt:
const prompt1 = "Ankara birinci altılı ganyan kuponu oluştur 80 TL'lik";
const prompt2 = "Tüm hipodromlarda birinci altılıyı yapmıyor sistem metin olarak belirttiğimde birinci altılıyı şu bütçede yap diye sadece direk ikinci altılı veriyor düzeltelim bu durumu";
const prompt3 = "Birinci altılı hala oluşturmuyor hata devam ediyor";

console.log('Prompt 1 detect:', prompt1);
console.log('Prompt 2 detect:', prompt2);
console.log('Prompt 3 detect:', prompt3);
