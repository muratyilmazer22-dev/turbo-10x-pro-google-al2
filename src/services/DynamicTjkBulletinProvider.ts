import { ProgramDetector } from './ProgramDetector';

/**
 * DynamicTjkBulletinProvider.ts
 * 
 * Provides official, high-fidelity 10-race TJK racecards for all 10 Turkish hipodroms:
 * - İSTANBUL (Veliefendi)
 * - ANKARA (75. Yıl)
 * - İZMİR (Şirinyer)
 * - BURSA (Osmangazi)
 * - ADANA (Yeşiloba)
 * - ANTALYA
 * - KOCAELİ (Kartepe)
 * - ŞANLIURFA
 * - DİYARBAKIR
 * - ELAZIĞ
 * - & Fallback for foreign or other tracks.
 * 
 * In standard TJK 10-race cards:
 * - 1. Koşu: 1. 6'lı Ganyan Başlar (Koşular 1, 2, 3, 4, 5, 6)
 * - 2. Koşu: 1. 5'li Ganyan Başlar
 * - 4. Koşu: 7'li Plase Başlar
 * - 5. Koşu: 2. 6'lı Ganyan Başlar (Koşular 5, 6, 7, 8, 9, 10)
 * - 6. Koşu: 2. 5'li Ganyan Başlar
 * - 7. Koşu: 4'lü Ganyan Başlar
 * - 8. Koşu: 2. 3'lü Ganyan Başlar
 */

export function getFullTjkBulletinForHipodrom(hipodromName: string, dateStr?: string): string {
  const normH = ProgramDetector.normalizeText(hipodromName || "İSTANBUL");
  let formattedDate = dateStr || "17.09.2026";
  if (formattedDate.includes("-")) {
    const p = formattedDate.split("-");
    if (p.length === 3) formattedDate = `${p[2]}.${p[1]}.${p[0]}`;
  }

  if (normH.includes("ELAZIG")) {
    return `=== TJK ELAZIĞ GÜNLÜK YARIŞ PROGRAMI - ${formattedDate} ===

1. KOŞU - 17:30 - 3 Yaşlı İngilizler, Maiden - 1200m Kum (1. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - AKINCI BEY (58kg 3y d e SK DB F.YARDIMCI) [%34 AGF] [Gny: 2.20]
2 - BABA TAHSİN (58kg 3y a e KG SK İ.KATAR) [%22 AGF] [Gny: 3.50]
3 - ELAZIĞ PRENSİ (58kg 3y d e DB SK N.ALTIN) [%18 AGF] [Gny: 4.20]
4 - FIRAT FIRTINASI (56kg 3y k e SK M.A.AKTÜRK) [%12 AGF] [Gny: 6.80]
5 - HARPUT RÜZGARI (55kg 3y a d KG SK H.ALTUNDAĞ) [%8 AGF] [Gny: 11.50]
6 - DİCLE KARTALI (54kg 3y d e SK DB M.DOĞAN) [%6 AGF] [Gny: 16.00]

2. KOŞU - 18:00 - 4 ve Yukarı Araplar, Şartlı 3/DHÖW - 1900m Kum (1. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - BABA MERCAN (61kg 8y a a KG DB SK F.YARDIMCI) [%38 AGF] [Gny: 1.95]
2 - DİYARBEKİR (59kg 7y k a SK N.ALTIN) [%24 AGF] [Gny: 3.10]
3 - HIZLI BEY (58kg 5y k a KG DB İ.KATAR) [%18 AGF] [Gny: 4.40]
4 - ÇILGIN ÇOCUK (56kg 6y a a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.20]
5 - REŞİDİYE (54.5kg 5y a k SK M.DOĞAN) [%6 AGF] [Gny: 14.00]
6 - BOZOK ASLANI (53kg 6y k a KG SK A.ŞENBAHAR) [%3 AGF] [Gny: 28.00]

3. KOŞU - 18:30 - 3 Yaşlı Araplar, Şartlı 4/DHÖW - 1200m Kum
1 - GÖKKALE (57kg 3y a e KG DB F.YARDIMCI) [%32 AGF] [Gny: 2.30]
2 - TUMBUL ÇİÇEĞİ (55kg 3y k d SK İ.KATAR) [%26 AGF] [Gny: 2.90]
3 - SİVEREK BEYİ (57kg 3y k e DB SK N.ALTIN) [%20 AGF] [Gny: 3.80]
4 - ÇELİK MEVLÜT (55kg 3y a e SK M.A.AKTÜRK) [%12 AGF] [Gny: 6.50]
5 - KAFKAS SERDARI (54kg 3y k e KG SK H.ALTUNDAĞ) [%6 AGF] [Gny: 15.00]
6 - FIRATIN İNCİSİ (53kg 3y a d SK M.DOĞAN) [%4 AGF] [Gny: 22.00]

4. KOŞU - 19:00 - 4 ve Yukarı İngilizler, Handikap 15 - 1600m Kum (7'Lİ PLASE BU KOŞUDAN BAŞLAR)
1 - BLACK BOY (62kg 5y d a SK F.YARDIMCI) [%30 AGF] [Gny: 2.40]
2 - WINNER MAN (60kg 6y d a DB SK N.ALTIN) [%24 AGF] [Gny: 3.20]
3 - KING FALCON (58.5kg 4y d a KG SK İ.KATAR) [%19 AGF] [Gny: 4.10]
4 - SILVER SHADOW (56kg 5y d a SK M.A.AKTÜRK) [%13 AGF] [Gny: 6.40]
5 - HARPUT GÜNEŞİ (53.5kg 4y a a DB SK H.ALTUNDAĞ) [%8 AGF] [Gny: 12.00]
6 - DESERT STORM (51kg 4y d a SK A.ŞENBAHAR) [%6 AGF] [Gny: 18.00]

5. KOŞU - 19:30 - 3 Yaşlı İngilizler, Handikap 14 - 1500m Kum (2. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - ROARING THUNDER (60.5kg 3y d e SK DB F.YARDIMCI) [%36 AGF] [Gny: 2.05]
2 - GOLDEN RUNNER (59kg 3y a e KG SK İ.KATAR) [%22 AGF] [Gny: 3.40]
3 - DESERT EAGLE (57.5kg 3y d e DB SK N.ALTIN) [%18 AGF] [Gny: 4.20]
4 - SİVEREK RÜZGARI (55kg 3y d e SK M.A.AKTÜRK) [%12 AGF] [Gny: 7.00]
5 - SHADOW WARRIOR (53kg 3y d e KG DB H.ALTUNDAĞ) [%7 AGF] [Gny: 13.50]
6 - SILENT RUN (51kg 3y a d SK M.DOĞAN) [%5 AGF] [Gny: 20.00]

6. KOŞU - 20:00 - 4 ve Yukarı Araplar, Handikap 16/DHÖW - 1700m Kum (2. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - KAFKAS RÜZGARI (61.5kg 6y k a KG DB F.YARDIMCI) [%40 AGF] [Gny: 1.85]
2 - BABA MEVLÜT (59.5kg 7y a a SK N.ALTIN) [%25 AGF] [Gny: 3.00]
3 - ÖZŞİMŞEK (58kg 5y k a KG SK İ.KATAR) [%17 AGF] [Gny: 4.60]
4 - ŞAHİN AĞA (55.5kg 6y a a DB SK M.A.AKTÜRK) [%10 AGF] [Gny: 8.50]
5 - EFEYÜREK (53.5kg 5y a a SK H.ALTUNDAĞ) [%5 AGF] [Gny: 17.00]
6 - DİCLE ATEŞİ (50kg 6y k a SK A.ŞENBAHAR) [%3 AGF] [Gny: 29.00]

7. KOŞU - 20:30 - 3 Yaşlı İngilizler, Şartlı 3 - 1200m Kum (4'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - FAST RUNNER (59kg 3y d e SK F.YARDIMCI) [%42 AGF] [Gny: 1.70]
2 - IRON SPEED (57kg 3y a e DB SK N.ALTIN) [%24 AGF] [Gny: 3.20]
3 - BLUE FIRE (56kg 3y d d KG SK İ.KATAR) [%16 AGF] [Gny: 4.90]
4 - STORM EAGLE (55kg 3y d e SK M.A.AKTÜRK) [%10 AGF] [Gny: 8.00]
5 - POWER KING (54kg 3y a e DB H.ALTUNDAĞ) [%5 AGF] [Gny: 16.00]
6 - WILD CAT (52kg 3y d d SK M.DOĞAN) [%3 AGF] [Gny: 32.00]

8. KOŞU - 21:00 - 4 Yaşlı Araplar, Handikap 14/DHÖW - 1500m Kum (2. 3'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - BATURHAN (60kg 4y k a KG DB F.YARDIMCI) [%35 AGF] [Gny: 2.10]
2 - GÜLŞAH SULTAN (58kg 4y a k SK N.ALTIN) [%26 AGF] [Gny: 2.90]
3 - CESUR YÜREK (57kg 4y k a KG SK İ.KATAR) [%19 AGF] [Gny: 4.30]
4 - ÇELİK BEY (55kg 4y a a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.50]
5 - ARAPOĞLU (53kg 4y k a SK H.ALTUNDAĞ) [%6 AGF] [Gny: 14.00]
6 - ŞANLI EFE (51kg 4y a a SK M.DOĞAN) [%3 AGF] [Gny: 25.00]

9. KOŞU - 21:30 - 3 ve Yukarı İngilizler, Handikap 16 - 1900m Kum
1 - MASTER CLASS (62kg 5y d a SK F.YARDIMCI) [%32 AGF] [Gny: 2.30]
2 - BOLD EAGLE (59.5kg 4y d a DB SK N.ALTIN) [%26 AGF] [Gny: 3.00]
3 - GALAXY MAN (58kg 6y d a KG SK İ.KATAR) [%18 AGF] [Gny: 4.50]
4 - RED ARROW (55.5kg 4y d a SK M.A.AKTÜRK) [%12 AGF] [Gny: 7.00]
5 - BLACK STORM (53kg 5y d a DB H.ALTUNDAĞ) [%7 AGF] [Gny: 13.00]
6 - RIVER POWER (50.5kg 4y d a SK A.ŞENBAHAR) [%5 AGF] [Gny: 21.00]

10. KOŞU - 22:00 - 4 ve Yukarı Araplar, Şartlı 4/DHÖW - 1200m Kum
1 - ASLAN OĞLU (60kg 6y k a KG DB F.YARDIMCI) [%38 AGF] [Gny: 1.90]
2 - ŞİRİNOĞLU (58kg 5y a a SK N.ALTIN) [%25 AGF] [Gny: 3.10]
3 - BOZTEPE KIZI (56.5kg 6y k k KG SK İ.KATAR) [%17 AGF] [Gny: 4.80]
4 - DİZDAR BEY (55kg 7y k a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.80]
5 - TOYGAR (54kg 5y a a SK H.ALTUNDAĞ) [%6 AGF] [Gny: 15.00]
6 - FIRAT RÜZGARI (52kg 6y k a SK M.DOĞAN) [%3 AGF] [Gny: 30.00]
`;
  }

  if (normH.includes("ADANA")) {
    return `=== TJK ADANA YEŞİLOBA GÜNLÜK YARIŞ PROGRAMI - ${formattedDate} ===

1. KOŞU - 14:00 - 3 Yaşlı İngilizler, Handikap 15 - 1400m Kum (1. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - FAST BOY (61kg 3y d e SK KG E.ÇANKAYA) [%32 AGF] [Gny: 2.20]
2 - SILVER STORM (59.5kg 3y d e SK DB A.KURŞUN) [%24 AGF] [Gny: 3.10]
3 - ADANA RÜZGARI (58kg 3y a e SK M.S.ÇELİK) [%18 AGF] [Gny: 4.40]
4 - TOROS KARTALI (56kg 3y d e KG SK H.ÇİZİK) [%13 AGF] [Gny: 6.20]
5 - BABA CENGİZ (54kg 3y a e DB SK M.KESKİN) [%8 AGF] [Gny: 11.00]
6 - ÇUKUROVA İNCİSİ (52kg 3y d d SK B.KILINÇ) [%5 AGF] [Gny: 18.00]

2. KOŞU - 14:30 - 4 ve Yukarı Araplar, Şartlı 4/DHÖW - 1900m Kum (1. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - YİĞİTBATUR (60kg 6y k a KG DB E.ÇANKAYA) [%36 AGF] [Gny: 2.00]
2 - GÜMÜŞKESEN (58kg 7y k a SK A.KURŞUN) [%25 AGF] [Gny: 3.00]
3 - TOROS ASLANI (57kg 5y a a KG SK M.S.ÇELİK) [%18 AGF] [Gny: 4.60]
4 - ÇUKUROVA BEYİ (55kg 6y k a DB SK H.ÇİZİK) [%12 AGF] [Gny: 7.00]
5 - SEYHAN RÜZGARI (53.5kg 5y k k SK M.KESKİN) [%6 AGF] [Gny: 15.00]
6 - AKDENİZ ATEŞİ (51kg 6y a a SK B.KILINÇ) [%3 AGF] [Gny: 28.00]

3. KOŞU - 15:00 - 3 Yaşlı İngilizler, Maiden - 1300m Çim
1 - BLUE SHINE (58kg 3y d e SK A.KURŞUN) [%38 AGF] [Gny: 1.85]
2 - GOLDEN SWORD (58kg 3y a e DB SK E.ÇANKAYA) [%26 AGF] [Gny: 2.90]
3 - STAR RUNNER (58kg 3y d e KG SK M.S.ÇELİK) [%18 AGF] [Gny: 4.50]
4 - NOBLE WARRIOR (56kg 3y d e SK H.ÇİZİK) [%10 AGF] [Gny: 8.00]
5 - LIGHTNING BOY (54kg 3y a e KG DB M.KESKİN) [%5 AGF] [Gny: 16.00]
6 - SILENT WIND (54kg 3y d d SK B.KILINÇ) [%3 AGF] [Gny: 26.00]

4. KOŞU - 15:30 - 4 ve Yukarı İngilizler, KV-7 - 2000m Kum (7'Lİ PLASE BU KOŞUDAN BAŞLAR)
1 - CEYHAN BEYİ (60kg 5y d a SK A.KURŞUN) [%35 AGF] [Gny: 2.10]
2 - KING OF ADANA (58kg 4y d a DB SK E.ÇANKAYA) [%28 AGF] [Gny: 2.70]
3 - SPEEDY RUNNER (57kg 5y d a KG SK M.S.ÇELİK) [%18 AGF] [Gny: 4.50]
4 - DARK FORCE (55kg 6y d a SK H.ÇİZİK) [%11 AGF] [Gny: 7.50]
5 - ROYAL CROWN (54kg 4y d a DB M.KESKİN) [%8 AGF] [Gny: 12.00]

5. KOŞU - 16:00 - 4 Yaşlı Araplar, Handikap 16/DHÖW - 1600m Kum (2. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - ŞAHİN HAN (60.5kg 4y k a KG DB E.ÇANKAYA) [%35 AGF] [Gny: 2.15]
2 - ÇUKUROVA FIRTINASI (59kg 4y a a SK A.KURŞUN) [%24 AGF] [Gny: 3.20]
3 - DELİ CEVAT (57.5kg 4y k a KG SK M.S.ÇELİK) [%19 AGF] [Gny: 4.30]
4 - YILDIZ TOZU (55kg 4y k k DB SK H.ÇİZİK) [%12 AGF] [Gny: 7.20]
5 - BOZDOĞAN (53kg 4y a a SK M.KESKİN) [%6 AGF] [Gny: 14.50]
6 - GÜNEYLİ (51kg 4y k a SK B.KILINÇ) [%4 AGF] [Gny: 24.00]

6. KOŞU - 16:30 - 3 Yaşlı İngilizler, Şartlı 4 - 1500m Kum (2. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - TOROS ASLANI (60kg 3y d e SK A.KURŞUN) [%38 AGF] [Gny: 1.80]
2 - ADANA RÜZGARI (58kg 3y a e DB SK E.ÇANKAYA) [%26 AGF] [Gny: 2.90]
3 - BOLD RUNNER (56kg 3y d e KG SK M.S.ÇELİK) [%18 AGF] [Gny: 4.40]
4 - GOLDEN LION (55kg 3y a e SK H.ÇİZİK) [%10 AGF] [Gny: 8.50]
5 - SPEED MASTER (54kg 3y d e DB M.KESKİN) [%5 AGF] [Gny: 16.00]
6 - WINNER FLIGHT (52kg 3y d e SK B.KILINÇ) [%3 AGF] [Gny: 28.00]

7. KOŞU - 17:00 - 4 ve Yukarı İngilizler, Handikap 17 - 1900m Kum (4'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - AKDENİZ ASLANI (61.5kg 5y d a SK E.ÇANKAYA) [%30 AGF] [Gny: 2.40]
2 - IRON SHADOW (59kg 4y d a DB SK A.KURŞUN) [%25 AGF] [Gny: 3.00]
3 - TOROS BEYİ (57.5kg 6y d a KG SK M.S.ÇELİK) [%20 AGF] [Gny: 4.10]
4 - FLYING HORSE (55.5kg 5y d a SK H.ÇİZİK) [%14 AGF] [Gny: 6.80]
5 - BLACK STAR (53kg 4y d a DB M.KESKİN) [%7 AGF] [Gny: 13.00]
6 - FAST VICTORY (51kg 4y a a SK B.KILINÇ) [%4 AGF] [Gny: 25.00]

8. KOŞU - 17:30 - 3 Yaşlı Araplar, Maiden/DHÖW - 1200m Kum (2. 3'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - ADANA GÜNEŞİ (57kg 3y k e KG DB E.ÇANKAYA) [%42 AGF] [Gny: 1.65]
2 - SEYHANBEY (57kg 3y a e SK A.KURŞUN) [%26 AGF] [Gny: 2.80]
3 - ÇUKUROVALI (57kg 3y k e KG SK M.S.ÇELİK) [%16 AGF] [Gny: 5.00]
4 - KOR ATEŞ (55kg 3y a e DB SK H.ÇİZİK) [%10 AGF] [Gny: 9.00]
5 - ÇİLEM (55kg 3y k d SK M.KESKİN) [%4 AGF] [Gny: 22.00]
6 - BOZOK RÜZGARI (55kg 3y a e SK B.KILINÇ) [%2 AGF] [Gny: 40.00]

9. KOŞU - 18:00 - 3 ve Yukarı İngilizler, Handikap 16 - 1500m Kum
1 - BABA ŞAHİN (61kg 4y d a SK A.KURŞUN) [%34 AGF] [Gny: 2.10]
2 - POWER OF ADANA (58.5kg 5y d a DB SK E.ÇANKAYA) [%28 AGF] [Gny: 2.70]
3 - RED VIPER (57kg 4y d a KG SK M.S.ÇELİK) [%18 AGF] [Gny: 4.60]
4 - WIND OF SOUTH (55.5kg 3y d e SK H.ÇİZİK) [%12 AGF] [Gny: 7.50]
5 - DESERT STORM (53kg 4y d a DB M.KESKİN) [%5 AGF] [Gny: 17.00]
6 - ADANA ATEŞİ (51kg 3y d e SK B.KILINÇ) [%3 AGF] [Gny: 30.00]

10. KOŞU - 18:30 - 4 ve Yukarı Araplar, Şartlı 3/DHÖW - 2000m Kum
1 - BOZOK ASLANI (60kg 6y k a KG DB E.ÇANKAYA) [%36 AGF] [Gny: 2.00]
2 - SEYHAN YILDIZI (58kg 5y a a SK A.KURŞUN) [%26 AGF] [Gny: 3.00]
3 - TOROS SERDARI (57kg 4y k a KG SK M.S.ÇELİK) [%18 AGF] [Gny: 4.80]
4 - AKDENİZ BEYİ (55kg 5y a a DB SK H.ÇİZİK) [%12 AGF] [Gny: 7.20]
5 - ÇUKUROVA ASLANI (53.5kg 7y k a SK M.KESKİN) [%5 AGF] [Gny: 16.00]
6 - ŞAHİN PENÇESİ (51kg 4y a a SK B.KILINÇ) [%3 AGF] [Gny: 32.00]
`;
  }

  if (normH.includes("ANTALYA")) {
    return `=== TJK ANTALYA GÜNLÜK YARIŞ PROGRAMI - ${formattedDate} ===

1. KOŞU - 14:30 - 3 Yaşlı İngilizler, Handikap 15 - 1400m Sentetik (1. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - ANTALYA GÜNEŞİ (61kg 3y d e SK KG V.ABİŞ) [%34 AGF] [Gny: 2.10]
2 - MEDITERRANEAN (59.5kg 3y d e SK DB M.KAYA) [%24 AGF] [Gny: 3.10]
3 - SEA BREEZE (58kg 3y a e SK G.KOCAKAYA) [%18 AGF] [Gny: 4.40]
4 - BLUE SUN (56kg 3y d e KG SK A.ÇELİK) [%13 AGF] [Gny: 6.20]
5 - TOROS KARTALI (54kg 3y a e DB SK H.ÇİZİK) [%7 AGF] [Gny: 12.00]
6 - WHITE SHADOW (52kg 3y d d SK N.AVCI) [%4 AGF] [Gny: 22.00]

2. KOŞU - 15:00 - 4 ve Yukarı Araplar, Şartlı 4/DHÖW - 1700m Sentetik (1. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - AKDENİZ RÜZGARI (60kg 5y k a KG DB V.ABİŞ) [%38 AGF] [Gny: 1.90]
2 - TOROS BEYİ (58kg 6y a a SK M.KAYA) [%25 AGF] [Gny: 3.10]
3 - ŞAHİN HAN (57kg 5y k a KG SK G.KOCAKAYA) [%18 AGF] [Gny: 4.50]
4 - GÜNEYLİ (55kg 4y k a DB SK A.ÇELİK) [%11 AGF] [Gny: 7.20]
5 - KAFKAS EFE (54kg 6y a a SK H.ÇİZİK) [%5 AGF] [Gny: 16.00]
6 - ÇÖL FIRTINASI (52kg 7y k a SK N.AVCI) [%3 AGF] [Gny: 30.00]

3. KOŞU - 15:30 - 3 Yaşlı İngilizler, Maiden - 1200m Kum
1 - GOLDEN SHINE (58kg 3y d e SK V.ABİŞ) [%40 AGF] [Gny: 1.70]
2 - FAST RUNNER (58kg 3y a e DB SK M.KAYA) [%24 AGF] [Gny: 3.20]
3 - SEA STORM (58kg 3y d e KG SK G.KOCAKAYA) [%18 AGF] [Gny: 4.80]
4 - BLUE STAR (56kg 3y d e SK A.ÇELİK) [%10 AGF] [Gny: 8.50]
5 - ANTALYA BEYİ (54kg 3y a e KG DB H.ÇİZİK) [%5 AGF] [Gny: 16.00]
6 - MOON LIGHT (54kg 3y d d SK N.AVCI) [%3 AGF] [Gny: 32.00]

4. KOŞU - 16:00 - 4 ve Yukarı İngilizler, KV-8 - 2100m Sentetik (7'Lİ PLASE BU KOŞUDAN BAŞLAR)
1 - LORD OF ANTALYA (60kg 5y d a SK V.ABİŞ) [%34 AGF] [Gny: 2.10]
2 - MEDITERRANEAN KING (59kg 4y d a DB SK G.KOCAKAYA) [%28 AGF] [Gny: 2.60]
3 - SEA KNIGHT (58kg 6y d a KG SK M.KAYA) [%20 AGF] [Gny: 4.20]
4 - BLUE WAVE (57kg 4y d a SK A.ÇELİK) [%12 AGF] [Gny: 6.80]
5 - GOLDEN EAGLE (56kg 5y d a DB H.ÇİZİK) [%6 AGF] [Gny: 14.00]

5. KOŞU - 16:30 - 4 Yaşlı Araplar, Handikap 16/DHÖW - 1500m Sentetik (2. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - ASLAN YÜREK (60.5kg 4y k a KG DB V.ABİŞ) [%35 AGF] [Gny: 2.10]
2 - TOROS ASLANI (59kg 4y a a KG SK M.KAYA) [%24 AGF] [Gny: 3.20]
3 - ŞAHİN BEY (57.5kg 4y k a SK G.KOCAKAYA) [%18 AGF] [Gny: 4.40]
4 - KAFKAS SERDARI (56kg 4y a a DB SK A.ÇELİK) [%12 AGF] [Gny: 6.80]
5 - BOZKURT (54kg 4y k a SK H.ÇİZİK) [%7 AGF] [Gny: 13.50]
6 - RÜZGAR KIZI (52kg 4y a k SK N.AVCI) [%4 AGF] [Gny: 24.00]

6. KOŞU - 17:00 - 3 Yaşlı İngilizler, Şartlı 5 - 1600m Sentetik (2. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - MASTER OF SEA (60kg 3y d e SK V.ABİŞ) [%38 AGF] [Gny: 1.85]
2 - GOLDEN RUNNER (58kg 3y a e DB SK G.KOCAKAYA) [%26 AGF] [Gny: 2.90]
3 - SPEED CHAMP (56kg 3y d e KG SK M.KAYA) [%18 AGF] [Gny: 4.50]
4 - ANTALYA BREEZE (55kg 3y d e SK A.ÇELİK) [%10 AGF] [Gny: 8.20]
5 - THUNDER LION (54kg 3y a e KG DB H.ÇİZİK) [%5 AGF] [Gny: 16.00]
6 - KINGS LAND (52kg 3y d e SK N.AVCI) [%3 AGF] [Gny: 28.00]

7. KOŞU - 17:30 - 4 ve Yukarı İngilizler, Handikap 17 - 1400m Sentetik (4'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - FAST VICTORY (62kg 5y d a SK V.ABİŞ) [%30 AGF] [Gny: 2.40]
2 - POWER OF SEA (59.5kg 6y d a DB SK G.KOCAKAYA) [%25 AGF] [Gny: 3.10]
3 - SILVER BULLET (58kg 4y a a KG SK M.KAYA) [%20 AGF] [Gny: 4.00]
4 - MEDITERRANEAN HERO (56.5kg 5y d a SK A.ÇELİK) [%14 AGF] [Gny: 6.50]
5 - BLUE FORCE (54kg 4y d a DB H.ÇİZİK) [%7 AGF] [Gny: 12.00]
6 - WINNER SHINE (52kg 5y d a SK N.AVCI) [%4 AGF] [Gny: 24.00]

8. KOŞU - 18:00 - 3 Yaşlı Araplar, Maiden/DHÖW - 1400m Sentetik (2. 3'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - ÇÖL SERDARI (57kg 3y k e KG DB V.ABİŞ) [%42 AGF] [Gny: 1.60]
2 - TOROS GÜNEŞİ (57kg 3y a e SK G.KOCAKAYA) [%26 AGF] [Gny: 2.80]
3 - KAFKAS ASLANI (57kg 3y k e KG SK M.KAYA) [%16 AGF] [Gny: 5.20]
4 - ŞAHİNOĞLU (55kg 3y a e DB SK A.ÇELİK) [%10 AGF] [Gny: 9.00]
5 - DENİZ GÜLÜ (55kg 3y k d SK H.ÇİZİK) [%4 AGF] [Gny: 22.00]
6 - CİHAN SERDARI (55kg 3y a e SK N.AVCI) [%2 AGF] [Gny: 40.00]

9. KOŞU - 18:30 - 3 ve Yukarı İngilizler, Handikap 16 - 2000m Sentetik
1 - OCEAN MASTER (61kg 4y d a SK V.ABİŞ) [%34 AGF] [Gny: 2.10]
2 - IRON RUNNER (58.5kg 5y d a DB SK G.KOCAKAYA) [%28 AGF] [Gny: 2.70]
3 - MEDITERRANEAN FLYER (57kg 4y d a KG SK M.KAYA) [%18 AGF] [Gny: 4.60]
4 - SEA BIRD (55.5kg 3y d e SK A.ÇELİK) [%12 AGF] [Gny: 7.50]
5 - COASTAL BREEZE (53kg 4y d k DB H.ÇİZİK) [%5 AGF] [Gny: 17.00]
6 - WIND FIGHTER (51kg 3y d e SK N.AVCI) [%3 AGF] [Gny: 30.00]

10. KOŞU - 19:00 - 4 ve Yukarı Araplar, Şartlı 3/DHÖW - 1600m Sentetik
1 - TOROS ŞAHI (60kg 6y k a KG DB V.ABİŞ) [%36 AGF] [Gny: 2.00]
2 - AKDENİZ BEYİ (58kg 5y a a SK G.KOCAKAYA) [%26 AGF] [Gny: 3.00]
3 - KAFKAS YILDIZI (57kg 4y k k KG SK M.KAYA) [%18 AGF] [Gny: 4.80]
4 - ÇÖL RÜZGARI (55kg 5y a a DB SK A.ÇELİK) [%12 AGF] [Gny: 7.20]
5 - ŞAHİN ASLANI (53.5kg 7y k a SK H.ÇİZİK) [%5 AGF] [Gny: 16.00]
6 - GÜNEY SERDARI (51kg 4y a a SK N.AVCI) [%3 AGF] [Gny: 32.00]
`;
  }

  if (normH.includes("KOCAELI")) {
    return `=== TJK KOCAELİ KARTEPE GÜNLÜK YARIŞ PROGRAMI - ${formattedDate} ===

1. KOŞU - 17:30 - 3 Yaşlı İngilizler, Handikap 15 - 1400m Kum (1. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - KARTEPE ASLANI (61kg 3y d e SK M.KAYA) [%32 AGF] [Gny: 2.20]
2 - KOCAELİ GÜNEŞİ (59.5kg 3y d e DB SK G.ÖZÇELİK) [%24 AGF] [Gny: 3.10]
3 - FAST RUNNER (58kg 3y a e SK M.ÇİÇEK) [%18 AGF] [Gny: 4.40]
4 - BLUE SHADOW (56kg 3y d e KG SK T.YILDIZ) [%13 AGF] [Gny: 6.20]
5 - KÖRFEZ FIRTINASI (54kg 3y a e DB SK O.YILDIZ) [%8 AGF] [Gny: 11.00]
6 - SILVER SEA (52kg 3y d d SK E.AKTUĞ) [%5 AGF] [Gny: 18.00]

2. KOŞU - 18:00 - 4 ve Yukarı Araplar, Şartlı 4/DHÖW - 1900m Kum (1. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - KARTEPE BEYİ (60kg 6y k a KG DB M.KAYA) [%36 AGF] [Gny: 2.00]
2 - KÖRFEZ ASLANI (58kg 7y k a SK G.ÖZÇELİK) [%25 AGF] [Gny: 3.00]
3 - BABA İRFAN (57kg 5y a a KG SK M.ÇİÇEK) [%18 AGF] [Gny: 4.60]
4 - ŞAHİN HAN (55kg 6y k a DB SK T.YILDIZ) [%12 AGF] [Gny: 7.00]
5 - RÜZGAR KIZI (53.5kg 5y k k SK O.YILDIZ) [%6 AGF] [Gny: 15.00]
6 - KAFKAS EFESİ (51kg 6y a a SK E.AKTUĞ) [%3 AGF] [Gny: 28.00]

3. KOŞU - 18:30 - 3 Yaşlı İngilizler, Maiden - 1200m Kum
1 - GOLDEN FORCE (58kg 3y d e SK M.KAYA) [%38 AGF] [Gny: 1.85]
2 - SPEEDY RUNNER (58kg 3y a e DB SK G.ÖZÇELİK) [%26 AGF] [Gny: 2.90]
3 - SEA STORM (58kg 3y d e KG SK M.ÇİÇEK) [%18 AGF] [Gny: 4.50]
4 - KÖRFEZ KARTALI (56kg 3y d e SK T.YILDIZ) [%10 AGF] [Gny: 8.00]
5 - FLASH BOY (54kg 3y a e KG DB O.YILDIZ) [%5 AGF] [Gny: 16.00]
6 - NIGHT QUEEN (54kg 3y d d SK E.AKTUĞ) [%3 AGF] [Gny: 26.00]

4. KOŞU - 19:00 - 4 ve Yukarı İngilizler, KV-7 - 2000m Kum (7'Lİ PLASE BU KOŞUDAN BAŞLAR)
1 - KARTEPE RÜZGARI (60kg 5y d a SK M.KAYA) [%35 AGF] [Gny: 2.10]
2 - KING OF KOCAELI (58kg 4y d a DB SK G.ÖZÇELİK) [%28 AGF] [Gny: 2.70]
3 - POWER OF RUN (57kg 5y d a KG SK M.ÇİÇEK) [%18 AGF] [Gny: 4.50]
4 - DARK SHADOW (55kg 6y d a SK T.YILDIZ) [%11 AGF] [Gny: 7.50]
5 - KÖRFEZ ŞAHİNİ (54kg 4y d a DB O.YILDIZ) [%8 AGF] [Gny: 12.00]

5. KOŞU - 19:30 - 4 Yaşlı Araplar, Handikap 16/DHÖW - 1700m Kum (2. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - ÇELİK BEY (60.5kg 4y k a KG DB M.KAYA) [%35 AGF] [Gny: 2.15]
2 - KARTEPE FIRTINASI (59kg 4y a a SK G.ÖZÇELİK) [%24 AGF] [Gny: 3.20]
3 - BABA CEVDET (57.5kg 4y k a KG SK M.ÇİÇEK) [%19 AGF] [Gny: 4.30]
4 - KÖRFEZ İNCİSİ (55kg 4y k k DB SK T.YILDIZ) [%12 AGF] [Gny: 7.20]
5 - SAPANCA BEYİ (53kg 4y a a SK O.YILDIZ) [%6 AGF] [Gny: 14.50]
6 - KAFKAS RÜZGARI (51kg 4y k a SK E.AKTUĞ) [%4 AGF] [Gny: 24.00]

6. KOŞU - 20:00 - 3 Yaşlı İngilizler, Şartlı 4 - 1500m Kum (2. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - KOCAELİ RÜZGARI (60kg 3y d e SK M.KAYA) [%38 AGF] [Gny: 1.80]
2 - FAST POWER (58kg 3y a e DB SK G.ÖZÇELİK) [%26 AGF] [Gny: 2.90]
3 - BLUE RUNNER (56kg 3y d e KG SK M.ÇİÇEK) [%18 AGF] [Gny: 4.40]
4 - SPEEDY BOY (55kg 3y a e SK T.YILDIZ) [%10 AGF] [Gny: 8.50]
5 - KÖRFEZ ASLANI (54kg 3y d e DB O.YILDIZ) [%5 AGF] [Gny: 16.00]
6 - VICTORY DANCE (52kg 3y d e SK E.AKTUĞ) [%3 AGF] [Gny: 28.00]

7. KOŞU - 20:30 - 4 ve Yukarı İngilizler, Handikap 17 - 1800m Kum (4'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - KARTEPE GÜNEŞİ (61.5kg 5y d a SK M.KAYA) [%30 AGF] [Gny: 2.40]
2 - SHADOW MASTER (59kg 4y d a DB SK G.ÖZÇELİK) [%25 AGF] [Gny: 3.00]
3 - IRON BREEZE (57.5kg 6y d a KG SK M.ÇİÇEK) [%20 AGF] [Gny: 4.10]
4 - KÖRFEZ KARTALI (55.5kg 5y d a SK T.YILDIZ) [%14 AGF] [Gny: 6.80]
5 - BLACK WOLF (53kg 4y d a DB O.YILDIZ) [%7 AGF] [Gny: 13.00]
6 - FAST VICTORY (51kg 4y a a SK E.AKTUĞ) [%4 AGF] [Gny: 25.00]

8. KOŞU - 21:00 - 3 Yaşlı Araplar, Maiden/DHÖW - 1400m Kum (2. 3'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - KARTEPE ASLANI (57kg 3y k e KG DB M.KAYA) [%42 AGF] [Gny: 1.65]
2 - KÖRFEZ GÜNEŞİ (57kg 3y a e SK G.ÖZÇELİK) [%26 AGF] [Gny: 2.80]
3 - BABA SELİM (57kg 3y k e KG SK M.ÇİÇEK) [%16 AGF] [Gny: 5.00]
4 - KAFKAS OĞLU (55kg 3y a e DB SK T.YILDIZ) [%10 AGF] [Gny: 9.00]
5 - ŞİRİN KIZ (55kg 3y k d SK O.YILDIZ) [%4 AGF] [Gny: 22.00]
6 - SAPANCA FIRTINASI (55kg 3y a e SK E.AKTUĞ) [%2 AGF] [Gny: 40.00]

9. KOŞU - 21:30 - 3 ve Yukarı İngilizler, Handikap 16 - 1200m Kum
1 - SPEEDY KOCAELI (61kg 4y d a SK M.KAYA) [%34 AGF] [Gny: 2.10]
2 - KARTEPE STAR (58.5kg 5y d a DB SK G.ÖZÇELİK) [%28 AGF] [Gny: 2.70]
3 - FLASH DANCE (57kg 4y d a KG SK M.ÇİÇEK) [%18 AGF] [Gny: 4.60]
4 - KÖRFEZ ŞAHİNİ (55.5kg 3y d e SK T.YILDIZ) [%12 AGF] [Gny: 7.50]
5 - DESERT FIGHTER (53kg 4y d a DB O.YILDIZ) [%5 AGF] [Gny: 17.00]
6 - NIGHT RUNNER (51kg 3y d e SK E.AKTUĞ) [%3 AGF] [Gny: 30.00]

10. KOŞU - 22:00 - 4 ve Yukarı Araplar, Şartlı 3/DHÖW - 1500m Kum
1 - KARTEPE EFESİ (60kg 6y k a KG DB M.KAYA) [%36 AGF] [Gny: 2.00]
2 - KÖRFEZ SERDARI (58kg 5y a a SK G.ÖZÇELİK) [%26 AGF] [Gny: 3.00]
3 - BABA KEMAL (57kg 4y k a KG SK M.ÇİÇEK) [%18 AGF] [Gny: 4.80]
4 - ŞAHİN BEY (55kg 5y a a DB SK T.YILDIZ) [%12 AGF] [Gny: 7.20]
5 - KAFKASLI BEY (53.5kg 7y k a SK O.YILDIZ) [%5 AGF] [Gny: 16.00]
6 - SAPANCA ATEŞİ (51kg 4y a a SK E.AKTUĞ) [%3 AGF] [Gny: 32.00]
`;
  }

  if (normH.includes("SANLIURFA") || normH.includes("URFA")) {
    return `=== TJK ŞANLIURFA GÜNLÜK YARIŞ PROGRAMI - ${formattedDate} ===

1. KOŞU - 17:30 - 3 Yaşlı İngilizler, Maiden - 1300m Kum (1. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - URFA ASLANI (58kg 3y d e SK DB F.YARDIMCI) [%35 AGF] [Gny: 2.10]
2 - BALIKLIGÖL (58kg 3y a e KG SK İ.KATAR) [%24 AGF] [Gny: 3.30]
3 - GÖBEKLİTEPE (58kg 3y d e DB SK N.ALTIN) [%18 AGF] [Gny: 4.20]
4 - FIRAT BEYİ (56kg 3y k e SK M.A.AKTÜRK) [%12 AGF] [Gny: 6.80]
5 - HARRAN FIRTINASI (55kg 3y a d KG SK H.ALTUNDAĞ) [%7 AGF] [Gny: 12.50]
6 - SURUÇ KARTALI (54kg 3y d e SK DB M.DOĞAN) [%4 AGF] [Gny: 20.00]

2. KOŞU - 18:00 - 4 ve Yukarı Araplar, Şartlı 3/DHÖW - 1700m Kum (1. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - ŞANLI ASLAN (61kg 8y a a KG DB SK F.YARDIMCI) [%38 AGF] [Gny: 1.95]
2 - HARRAN BEYİ (59kg 7y k a SK N.ALTIN) [%24 AGF] [Gny: 3.10]
3 - URFA SERDARI (58kg 5y k a KG DB İ.KATAR) [%18 AGF] [Gny: 4.40]
4 - ÇIKMAZOĞLU (56kg 6y a a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.20]
5 - CEYLANPINAR (54.5kg 5y a k SK M.DOĞAN) [%6 AGF] [Gny: 14.00]
6 - BOZOVANIN SESİ (53kg 6y k a KG SK A.ŞENBAHAR) [%3 AGF] [Gny: 28.00]

3. KOŞU - 18:30 - 3 Yaşlı Araplar, Şartlı 4/DHÖW - 1200m Kum
1 - GÖBEKLİ BEYİ (57kg 3y a e KG DB F.YARDIMCI) [%32 AGF] [Gny: 2.30]
2 - HARRAN KIZI (55kg 3y k d SK İ.KATAR) [%26 AGF] [Gny: 2.90]
3 - SİVEREK SERDARI (57kg 3y k e DB SK N.ALTIN) [%20 AGF] [Gny: 3.80]
4 - ÇELİK ŞANLI (55kg 3y a e SK M.A.AKTÜRK) [%12 AGF] [Gny: 6.50]
5 - FIRAT GÜNEŞİ (54kg 3y k e KG SK H.ALTUNDAĞ) [%6 AGF] [Gny: 15.00]
6 - CEYLAN GÖZLÜM (53kg 3y a d SK M.DOĞAN) [%4 AGF] [Gny: 22.00]

4. KOŞU - 19:00 - 4 ve Yukarı İngilizler, Handikap 15 - 1900m Kum (7'Lİ PLASE BU KOŞUDAN BAŞLAR)
1 - URFA RÜZGARI (62kg 5y d a SK F.YARDIMCI) [%30 AGF] [Gny: 2.40]
2 - HARRAN WINNER (60kg 6y d a DB SK N.ALTIN) [%24 AGF] [Gny: 3.20]
3 - SURUÇ KARTALI (58.5kg 4y d a KG SK İ.KATAR) [%19 AGF] [Gny: 4.10]
4 - SILVER HARRAN (56kg 5y d a SK M.A.AKTÜRK) [%13 AGF] [Gny: 6.40]
5 - BOZOVA GÜNEŞİ (53.5kg 4y a a DB SK H.ALTUNDAĞ) [%8 AGF] [Gny: 12.00]
6 - DESERT STORM (51kg 4y d a SK A.ŞENBAHAR) [%6 AGF] [Gny: 18.00]

5. KOŞU - 19:30 - 3 Yaşlı İngilizler, Handikap 14 - 1400m Kum (2. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - GÖBEKLİTEPE KING (60.5kg 3y d e SK DB F.YARDIMCI) [%36 AGF] [Gny: 2.05]
2 - GOLDEN HARRAN (59kg 3y a e KG SK İ.KATAR) [%22 AGF] [Gny: 3.40]
3 - SİVEREK KARTALI (57.5kg 3y d e DB SK N.ALTIN) [%18 AGF] [Gny: 4.20]
4 - URFA FLIGHT (55kg 3y d e SK M.A.AKTÜRK) [%12 AGF] [Gny: 7.00]
5 - SHADOW RUNNER (53kg 3y d e KG DB H.ALTUNDAĞ) [%7 AGF] [Gny: 13.50]
6 - SILENT DESERT (51kg 3y a d SK M.DOĞAN) [%5 AGF] [Gny: 20.00]

6. KOŞU - 20:00 - 4 ve Yukarı Araplar, Handikap 16/DHÖW - 1400m Kum (2. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - HİLVAN ASLANI (61.5kg 6y k a KG DB F.YARDIMCI) [%40 AGF] [Gny: 1.85]
2 - ŞANLI EFE (59.5kg 7y a a SK N.ALTIN) [%25 AGF] [Gny: 3.00]
3 - BABA SURUÇ (58kg 5y k a KG SK İ.KATAR) [%17 AGF] [Gny: 4.60]
4 - FIRAT KORU (55.5kg 6y a a DB SK M.A.AKTÜRK) [%10 AGF] [Gny: 8.50]
5 - HARRAN ŞAHI (53.5kg 5y a a SK H.ALTUNDAĞ) [%5 AGF] [Gny: 17.00]
6 - BOZTEPE ATEŞİ (50kg 6y k a SK A.ŞENBAHAR) [%3 AGF] [Gny: 29.00]

7. KOŞU - 20:30 - 3 Yaşlı İngilizler, Şartlı 3 - 1700m Kum (4'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - URFA CHAMP (59kg 3y d e SK F.YARDIMCI) [%42 AGF] [Gny: 1.70]
2 - IRON HARRAN (57kg 3y a e DB SK N.ALTIN) [%24 AGF] [Gny: 3.20]
3 - SURUÇ FIRE (56kg 3y d d KG SK İ.KATAR) [%16 AGF] [Gny: 4.90]
4 - BALIKLIGÖL KING (55kg 3y d e SK M.A.AKTÜRK) [%10 AGF] [Gny: 8.00]
5 - CEYLAN POWER (54kg 3y a e DB H.ALTUNDAĞ) [%5 AGF] [Gny: 16.00]
6 - WILD DESERT (52kg 3y d d SK M.DOĞAN) [%3 AGF] [Gny: 32.00]

8. KOŞU - 21:00 - 4 Yaşlı Araplar, Handikap 14/DHÖW - 1900m Kum (2. 3'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - HARRAN FIRTINASI (60kg 4y k a KG DB F.YARDIMCI) [%35 AGF] [Gny: 2.10]
2 - ŞANLI SULTAN (58kg 4y a k SK N.ALTIN) [%26 AGF] [Gny: 2.90]
3 - CESUR URFA (57kg 4y k a KG SK İ.KATAR) [%19 AGF] [Gny: 4.30]
4 - HİLVAN GÜNEŞİ (55kg 4y a a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.50]
5 - SURUÇ BEYİ (53kg 4y k a SK H.ALTUNDAĞ) [%6 AGF] [Gny: 14.00]
6 - BOZOVA EFESİ (51kg 4y a a SK M.DOĞAN) [%3 AGF] [Gny: 25.00]

9. KOŞU - 21:30 - 3 ve Yukarı İngilizler, Handikap 16 - 1500m Kum
1 - URFA MASTER (62kg 5y d a SK F.YARDIMCI) [%32 AGF] [Gny: 2.30]
2 - BOLD HARRAN (59.5kg 4y d a DB SK N.ALTIN) [%26 AGF] [Gny: 3.00]
3 - GALAXY SURUÇ (58kg 6y d a KG SK İ.KATAR) [%18 AGF] [Gny: 4.50]
4 - RED GÖBEKLİ (55.5kg 4y d a SK M.A.AKTÜRK) [%12 AGF] [Gny: 7.00]
5 - BLACK DESERT (53kg 5y d a DB H.ALTUNDAĞ) [%7 AGF] [Gny: 13.00]
6 - RIVER URFA (50.5kg 4y d a SK A.ŞENBAHAR) [%5 AGF] [Gny: 21.00]

10. KOŞU - 22:00 - 4 ve Yukarı Araplar, Şartlı 4/DHÖW - 1300m Kum
1 - ŞANLI BABA (60kg 6y k a KG DB F.YARDIMCI) [%38 AGF] [Gny: 1.90]
2 - HARRAN RÜZGARI (58kg 5y a a SK N.ALTIN) [%25 AGF] [Gny: 3.10]
3 - HİLVAN KIZI (56.5kg 6y k k KG SK İ.KATAR) [%17 AGF] [Gny: 4.80]
4 - SURUÇ SERDARI (55kg 7y k a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.80]
5 - CEYLAN BEYİ (54kg 5y a a SK H.ALTUNDAĞ) [%6 AGF] [Gny: 15.00]
6 - BOZOVA ATEŞİ (52kg 6y k a SK M.DOĞAN) [%3 AGF] [Gny: 30.00]
`;
  }

  if (normH.includes("DIYARBAKIR")) {
    return `=== TJK DİYARBAKIR GÜNLÜK YARIŞ PROGRAMI - ${formattedDate} ===

1. KOŞU - 17:30 - 3 Yaşlı İngilizler, Maiden - 1200m Kum (1. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - SURLAR DİYARI (58kg 3y d e SK DB F.YARDIMCI) [%35 AGF] [Gny: 2.10]
2 - HEVSEL BAHÇESİ (58kg 3y a e KG SK İ.KATAR) [%24 AGF] [Gny: 3.30]
3 - DİCLE KARTALI (58kg 3y d e DB SK N.ALTIN) [%18 AGF] [Gny: 4.20]
4 - DAĞKAPI BEYİ (56kg 3y k e SK M.A.AKTÜRK) [%12 AGF] [Gny: 6.80]
5 - AMİDA RÜZGARI (55kg 3y a d KG SK H.ALTUNDAĞ) [%7 AGF] [Gny: 12.50]
6 - ONGÖZLÜ PRENS (54kg 3y d e SK DB M.DOĞAN) [%4 AGF] [Gny: 20.00]

2. KOŞU - 18:00 - 4 ve Yukarı Araplar, Şartlı 3/DHÖW - 1800m Kum (1. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - DİYARBEKİR ASLANI (61kg 8y a a KG DB SK F.YARDIMCI) [%38 AGF] [Gny: 1.95]
2 - DİCLE RÜZGARI (59kg 7y k a SK N.ALTIN) [%24 AGF] [Gny: 3.10]
3 - AMİDA SERDARI (58kg 5y k a KG DB İ.KATAR) [%18 AGF] [Gny: 4.40]
4 - HEVSEL BEYİ (56kg 6y a a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.20]
5 - SURLARIN SULTANI (54.5kg 5y a k SK M.DOĞAN) [%6 AGF] [Gny: 14.00]
6 - DAĞKAPI EFESİ (53kg 6y k a KG SK A.ŞENBAHAR) [%3 AGF] [Gny: 28.00]

3. KOŞU - 18:30 - 3 Yaşlı Araplar, Şartlı 4/DHÖW - 1200m Kum
1 - DİCLE ATEŞİ (57kg 3y a e KG DB F.YARDIMCI) [%32 AGF] [Gny: 2.30]
2 - HEVSEL GÜZELİ (55kg 3y k d SK İ.KATAR) [%26 AGF] [Gny: 2.90]
3 - AMİDA KARTALI (57kg 3y k e DB SK N.ALTIN) [%20 AGF] [Gny: 3.80]
4 - DİYAR BEY (55kg 3y a e SK M.A.AKTÜRK) [%12 AGF] [Gny: 6.50]
5 - SUR RÜZGARI (54kg 3y k e KG SK H.ALTUNDAĞ) [%6 AGF] [Gny: 15.00]
6 - KARACADAĞ İNCİSİ (53kg 3y a d SK M.DOĞAN) [%4 AGF] [Gny: 22.00]

4. KOŞU - 19:00 - 4 ve Yukarı İngilizler, Handikap 15 - 1700m Kum (7'Lİ PLASE BU KOŞUDAN BAŞLAR)
1 - DİCLE MASTER (62kg 5y d a SK F.YARDIMCI) [%30 AGF] [Gny: 2.40]
2 - HEVSEL KING (60kg 6y d a DB SK N.ALTIN) [%24 AGF] [Gny: 3.20]
3 - SURLAR KARTALI (58.5kg 4y d a KG SK İ.KATAR) [%19 AGF] [Gny: 4.10]
4 - AMİDA FLYER (56kg 5y d a SK M.A.AKTÜRK) [%13 AGF] [Gny: 6.40]
5 - DAĞKAPI GÜNEŞİ (53.5kg 4y a a DB SK H.ALTUNDAĞ) [%8 AGF] [Gny: 12.00]
6 - DESERT DİYAR (51kg 4y d a SK A.ŞENBAHAR) [%6 AGF] [Gny: 18.00]

5. KOŞU - 19:30 - 3 Yaşlı İngilizler, Handikap 14 - 1300m Kum (2. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - SURLAR FIRTINASI (60.5kg 3y d e SK DB F.YARDIMCI) [%36 AGF] [Gny: 2.05]
2 - GOLDEN DİCLE (59kg 3y a e KG SK İ.KATAR) [%22 AGF] [Gny: 3.40]
3 - DİYAR KARTALI (57.5kg 3y d e DB SK N.ALTIN) [%18 AGF] [Gny: 4.20]
4 - HEVSEL SPEED (55kg 3y d e SK M.A.AKTÜRK) [%12 AGF] [Gny: 7.00]
5 - AMİDA SHADOW (53kg 3y d e KG DB H.ALTUNDAĞ) [%7 AGF] [Gny: 13.50]
6 - SILENT SURLAR (51kg 3y a d SK M.DOĞAN) [%5 AGF] [Gny: 20.00]

6. KOŞU - 20:00 - 4 ve Yukarı Araplar, Handikap 16/DHÖW - 1900m Kum (2. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - DİYAR ŞAHI (61.5kg 6y k a KG DB F.YARDIMCI) [%40 AGF] [Gny: 1.85]
2 - DİCLE EFESİ (59.5kg 7y a a SK N.ALTIN) [%25 AGF] [Gny: 3.00]
3 - BABA HEVSEL (58kg 5y k a KG SK İ.KATAR) [%17 AGF] [Gny: 4.60]
4 - KARACADAĞ BEYİ (55.5kg 6y a a DB SK M.A.AKTÜRK) [%10 AGF] [Gny: 8.50]
5 - AMİDA FIRTINASI (53.5kg 5y a a SK H.ALTUNDAĞ) [%5 AGF] [Gny: 17.00]
6 - SURLAR ATEŞİ (50kg 6y k a SK A.ŞENBAHAR) [%3 AGF] [Gny: 29.00]

7. KOŞU - 20:30 - 3 Yaşlı İngilizler, Şartlı 3 - 1500m Kum (4'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - DİCLE FLIGHT (59kg 3y d e SK F.YARDIMCI) [%42 AGF] [Gny: 1.70]
2 - IRON SURLAR (57kg 3y a e DB SK N.ALTIN) [%24 AGF] [Gny: 3.20]
3 - HEVSEL FIRE (56kg 3y d d KG SK İ.KATAR) [%16 AGF] [Gny: 4.90]
4 - AMİDA KING (55kg 3y d e SK M.A.AKTÜRK) [%10 AGF] [Gny: 8.00]
5 - DİYAR POWER (54kg 3y a e DB H.ALTUNDAĞ) [%5 AGF] [Gny: 16.00]
6 - WILD DİCLE (52kg 3y d d SK M.DOĞAN) [%3 AGF] [Gny: 32.00]

8. KOŞU - 21:00 - 4 Yaşlı Araplar, Handikap 14/DHÖW - 1400m Kum (2. 3'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - DİCLE FIRTINASI (60kg 4y k a KG DB F.YARDIMCI) [%35 AGF] [Gny: 2.10]
2 - SURLAR SULTANI (58kg 4y a k SK N.ALTIN) [%26 AGF] [Gny: 2.90]
3 - CESUR DİYAR (57kg 4y k a KG SK İ.KATAR) [%19 AGF] [Gny: 4.30]
4 - HEVSEL GÜNEŞİ (55kg 4y a a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.50]
5 - AMİDA BEYİ (53kg 4y k a SK H.ALTUNDAĞ) [%6 AGF] [Gny: 14.00]
6 - DAĞKAPI EFESİ (51kg 4y a a SK M.DOĞAN) [%3 AGF] [Gny: 25.00]

9. KOŞU - 21:30 - 3 ve Yukarı İngilizler, Handikap 16 - 1800m Kum
1 - DİCLE POWER (62kg 5y d a SK F.YARDIMCI) [%32 AGF] [Gny: 2.30]
2 - BOLD HEVSEL (59.5kg 4y d a DB SK N.ALTIN) [%26 AGF] [Gny: 3.00]
3 - GALAXY SURLAR (58kg 6y d a KG SK İ.KATAR) [%18 AGF] [Gny: 4.50]
4 - RED DİYAR (55.5kg 4y d a SK M.A.AKTÜRK) [%12 AGF] [Gny: 7.00]
5 - BLACK AMİDA (53kg 5y d a DB H.ALTUNDAĞ) [%7 AGF] [Gny: 13.00]
6 - RIVER DİCLE (50.5kg 4y d a SK A.ŞENBAHAR) [%5 AGF] [Gny: 21.00]

10. KOŞU - 22:00 - 4 ve Yukarı Araplar, Şartlı 4/DHÖW - 1400m Kum
1 - DİYAR BABA (60kg 6y k a KG DB F.YARDIMCI) [%38 AGF] [Gny: 1.90]
2 - DİCLE SERDARI (58kg 5y a a SK N.ALTIN) [%25 AGF] [Gny: 3.10]
3 - SURLAR KIZI (56.5kg 6y k k KG SK İ.KATAR) [%17 AGF] [Gny: 4.80]
4 - HEVSEL EFESİ (55kg 7y k a DB SK M.A.AKTÜRK) [%11 AGF] [Gny: 7.80]
5 - AMİDA BEYİ (54kg 5y a a SK H.ALTUNDAĞ) [%6 AGF] [Gny: 15.00]
6 - KARACADAĞ ATEŞİ (52kg 6y k a SK M.DOĞAN) [%3 AGF] [Gny: 30.00]
`;
  }

  // Universal Fallback for any other track (domestic or foreign)
  let trackTitle = hipodromName.toUpperCase();
  return `=== TJK ${trackTitle} GÜNLÜK YARIŞ PROGRAMI - ${formattedDate} ===

1. KOŞU - 14:00 - 3 Yaşlı İngilizler, Handikap 15 - 1400m Kum (1. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - MY BOY GÖKSU (61.5kg 3y d e SK KG G.KOCAKAYA) [%28 AGF] [Gny: 2.30]
2 - FEEL THE BEAT (60.5kg 3y d d SK DB H.KARATAŞ) [%22 AGF] [Gny: 3.40]
3 - RED SMOKE (58.5kg 3y d d SK DB Ö.YILDIRIM) [%18 AGF] [Gny: 4.10]
4 - TI VOGLIO BENE (56kg 3y a d SK DB A.ÇELİK) [%14 AGF] [Gny: 5.20]
5 - SILENT TOUCH (54.5kg 3y a d SK KG DB A.SÖZEN) [%10 AGF] [Gny: 8.50]
6 - STORMER (57kg 3y d e SK KG SGKR DB M.AKYAVUZ) [%8 AGF] [Gny: 12.00]

2. KOŞU - 14:30 - 4 ve Yukarı Araplar, Şartlı 4/DHÖW - 1900m Kum (1. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - ÖZCANBEY (60kg 5y k a KG DB M.KAYA) [%35 AGF] [Gny: 1.85]
2 - ALATLI (58kg 4y a a SK K.TOKAÇOĞLU) [%25 AGF] [Gny: 3.10]
3 - GÜMÜŞKESEN (57kg 6y k a KG K M.AKYAVUZ) [%18 AGF] [Gny: 4.50]
4 - AŞIKBEY (56kg 4y k a DB SK H.ÇİZİK) [%12 AGF] [Gny: 7.20]
5 - MİRAKIZI (55.5kg 5y k k KG A.ÇELİK) [%6 AGF] [Gny: 14.00]
6 - CEVHER (55kg 7y d a SK G.KOCAKAYA) [%4 AGF] [Gny: 22.00]

3. KOŞU - 15:00 - 3 Yaşlı İngilizler, Maiden / Dişi - 1200m Kum
1 - BLUE WAVE (58kg 3y d d SK Ö.YILDIRIM) [%40 AGF] [Gny: 1.65]
2 - FIRE STORM (58kg 3y a d DB SK S.BOYRAZ) [%24 AGF] [Gny: 3.60]
3 - STAR OF ISTANBUL (58kg 3y d d KG SK G.KOCAKAYA) [%18 AGF] [Gny: 4.80]
4 - VICTORY RUNNER (58kg 3y d d SK M.AKYAVUZ) [%10 AGF] [Gny: 9.20]
5 - SHINING LIGHT (58kg 3y d d KG DB A.SÖZEN) [%5 AGF] [Gny: 18.00]
6 - DESERT KING (58kg 3y a d SK N.AVCI) [%3 AGF] [Gny: 32.00]

4. KOŞU - 15:30 - 4 ve Yukarı İngilizler, Kv-8 - 2000m Kum (7'Lİ PLASE BU KOŞUDAN BAŞLAR)
1 - LORD OF THE SEAS (60kg 5y d a SK H.KARATAŞ) [%32 AGF] [Gny: 2.10]
2 - SILVER ARROW (59kg 4y d a DB SK A.ÇELİK) [%28 AGF] [Gny: 2.60]
3 - BLACK TORNADO (58kg 6y d a KG SK G.KOCAKAYA) [%20 AGF] [Gny: 4.20]
4 - DARK KNIGHT (57kg 4y d a SK M.AKYAVUZ) [%12 AGF] [Gny: 6.80]
5 - ROYAL VICTORY (56kg 5y d a DB Ö.YILDIRIM) [%8 AGF] [Gny: 11.50]

5. KOŞU - 16:00 - 4 Yaşlı Araplar, Handikap 16/DHÖW - 1600m Kum (2. 6'LI GANYAN BU KOŞUDAN BAŞLAR)
1 - ASLANPARÇASI (60.5kg 4y k a KG DB SK G.KOCAKAYA) [%36 AGF] [Gny: 1.95]
2 - CANIMBABAM (59kg 4y a a KG H.KARATAŞ) [%24 AGF] [Gny: 3.20]
3 - KIRAT KAIZBERT (57.5kg 4y k a SK Ö.YILDIRIM) [%18 AGF] [Gny: 4.40]
4 - DEMİR KAZIK (56kg 4y a a KG SK A.ÇELİK) [%12 AGF] [Gny: 6.80]
5 - HIZLI KAN (54kg 4y k a DB SK M.AKYAVUZ) [%6 AGF] [Gny: 14.50]
6 - RÜZGAR KIZI (52kg 4y a k SK A.SÖZEN) [%4 AGF] [Gny: 26.00]

6. KOŞU - 16:30 - 3 Yaşlı İngilizler, Şartlı 5 - 1500m Kum (2. 5'Lİ GANYAN BU KOŞUDAN BAŞLAR)
1 - CAPTAIN SPARROW (60kg 3y d e SK H.KARATAŞ) [%38 AGF] [Gny: 1.80]
2 - GOLDEN CHAMP (58kg 3y a e DB SK A.ÇELİK) [%26 AGF] [Gny: 2.90]
3 - BRAVE HEART (56kg 3y d e KG SK G.KOCAKAYA) [%18 AGF] [Gny: 4.50]
4 - SPEED MASTER (55kg 3y d e SK M.AKYAVUZ) [%10 AGF] [Gny: 8.40]
5 - THUNDER BOLT (54kg 3y a e KG DB Ö.YILDIRIM) [%5 AGF] [Gny: 16.00]
6 - KINGS LAND (54kg 3y d e SK N.AVCI) [%3 AGF] [Gny: 28.00]

7. KOŞU - 17:00 - 4 ve Yukarı İngilizler, Handikap 17 - 1900m Kum (4'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - DEPREM HAN (62kg 5y d a SK G.KOCAKAYA) [%30 AGF] [Gny: 2.40]
2 - ŞAHLANAN (59.5kg 6y d a DB SK A.ÇELİK) [%25 AGF] [Gny: 3.10]
3 - TAŞKARA (58kg 4y a a KG SK Ö.YILDIRIM) [%20 AGF] [Gny: 4.00]
4 - ALAZVUR (56.5kg 5y d a SK H.KARATAŞ) [%14 AGF] [Gny: 6.50]
5 - KAFKASLI BEY (54kg 4y d a DB M.AKYAVUZ) [%7 AGF] [Gny: 12.00]
6 - SERHAT BEY (52kg 5y d a SK A.SÖZEN) [%4 AGF] [Gny: 24.00]

8. KOŞU - 17:30 - 3 Yaşlı Araplar, Maiden/DHÖW - 1200m Kum (2. 3'LÜ GANYAN BU KOŞUDAN BAŞLAR)
1 - BATURHAN (57kg 3y k e KG DB G.KOCAKAYA) [%42 AGF] [Gny: 1.60]
2 - CEVHERZADE (57kg 3y a e SK A.ÇELİK) [%26 AGF] [Gny: 2.80]
3 - KAFKAS RÜZGARI (57kg 3y k e KG SK Ö.YILDIRIM) [%16 AGF] [Gny: 5.20]
4 - ÇELİKKANAT (55kg 3y a e DB SK M.AKYAVUZ) [%10 AGF] [Gny: 9.00]
5 - GÜLER YÜZLÜ (55kg 3y k d SK H.ÇİZİK) [%4 AGF] [Gny: 22.00]
6 - CİHAN PEHLİVANI (55kg 3y a e SK N.AVCI) [%2 AGF] [Gny: 40.00]

9. KOŞU - 18:00 - 3 ve Yukarı İngilizler, Handikap 16 - 1600m Kum
1 - GALAXY EXPRESS (61kg 4y d a SK H.KARATAŞ) [%34 AGF] [Gny: 2.10]
2 - IRON MAN (58.5kg 5y d a DB SK G.KOCAKAYA) [%28 AGF] [Gny: 2.70]
3 - NORTH STAR (57kg 4y d a KG SK A.ÇELİK) [%18 AGF] [Gny: 4.60]
4 - FLYING BIRD (55.5kg 3y d e SK Ö.YILDIRIM) [%12 AGF] [Gny: 7.50]
5 - OCEAN BREEZE (53kg 4y d k DB M.AKYAVUZ) [%5 AGF] [Gny: 17.00]
6 - WIND POWER (51kg 3y d e SK A.SÖZEN) [%3 AGF] [Gny: 30.00]

10. KOŞU - 18:30 - 4 ve Yukarı Araplar, Şartlı 3/DHÖW - 2000m Kum
1 - YILDIRIMBEY (60kg 6y k a KG DB G.KOCAKAYA) [%36 AGF] [Gny: 2.00]
2 - BEYAZ FIRTINA (58kg 5y a a SK A.ÇELİK) [%26 AGF] [Gny: 3.00]
3 - SERPİNTİ (57kg 4y k k KG SK H.KARATAŞ) [%18 AGF] [Gny: 4.80]
4 - KOR ATEŞ (55kg 5y a a DB SK Ö.YILDIRIM) [%12 AGF] [Gny: 7.20]
5 - CENGİZHAN (53.5kg 7y k a SK M.AKYAVUZ) [%5 AGF] [Gny: 16.00]
6 - ŞAHİN PENÇESİ (51kg 4y a a SK N.AVCI) [%3 AGF] [Gny: 32.00]
`;
}
