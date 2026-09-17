import { getFullTjkBulletinForHipodrom } from './src/services/DynamicTjkBulletinProvider';

const testCities = ['ELAZIĞ', 'ADANA', 'ANTALYA', 'ŞANLIURFA', 'DİYARBAKIR', 'KOCAELİ', 'BURSA', 'İZMİR', 'ANKARA', 'İSTANBUL'];

for (const city of testCities) {
  const b = getFullTjkBulletinForHipodrom(city, '2026-09-17');
  const hasKoşu1 = b.includes('1. KOŞU');
  const hasKoşu10 = b.includes('10. KOŞU');
  const hasAltili1 = b.includes("1. 6'LI GANYAN BU KOŞUDAN BAŞLAR");
  const hasAltili2 = b.includes("2. 6'LI GANYAN BU KOŞUDAN BAŞLAR");
  console.log(`[${city}] len:${b.length} koşu1:${hasKoşu1} koşu10:${hasKoşu10} altili1:${hasAltili1} altili2:${hasAltili2}`);
}
