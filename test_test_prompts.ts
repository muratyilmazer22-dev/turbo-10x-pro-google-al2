import { ProgramDetector } from './src/services/ProgramDetector';

const prompts = [
  "Birinci altılı hala oluşturmuyor hata devam ediyor",
  "Tüm hipodromlarda birinci altılıyı yapmıyor sistem metin olarak belirttiğimde birinci altılıyı şu bütçede yap diye sadece direk ikinci altılı veriyor düzeltelim bu durumu",
  "birinci altılıyı 80 tl yap",
  "1. altılı yap 80 tl",
  "elazığ 1. altılı yap 80 tl",
  "adana 1. altılı yap 80 tl",
  "adana birinci altılı kuponu oluştur"
];

for (const p of prompts) {
  console.log(`[PROMPT]: "${p}" -> DETECTED: "${ProgramDetector.detectProgramFromText(p)}"`);
}
