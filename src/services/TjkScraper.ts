/**
 * TjkScraper.ts
 * 
 * BÖLÜM 4 - MODÜL 1: TJK (TÜRKİYE JOKEY KULÜBÜ) VERİ TOPLAMA VE API ADAPTÖRÜ
 * 
 * Özellikler:
 * 1. TJK günlük yarış programı, at bülteni ve canlı ganyan verilerini çeker ve parse eder.
 * 2. At adı, ganyan (marketOdds), kilo, kulvar, jokey, son 5 yarış formu, handikap, yaş ve orijin verilerini ayıklar.
 * 3. NetworkManager / safeFetchWithRetry ile 8-10 sn timeout, Exponential Backoff ve güvenli fallback sağlar.
 */

import * as cheerio from 'cheerio';
import { safeFetchWithRetry } from './networkReliability';

export interface TjkRawHorseEntry {
  horseNo: string;
  horseName: string;
  age?: number;
  gender?: 'E' | 'D' | 'A' | 'K';
  originSire?: string;
  originDam?: string;
  originDamSire?: string;
  weight: number;
  jockeyName: string;
  ownerName?: string;
  trainerName?: string;
  stallNo?: number; // Kulvar
  handicap?: number;
  marketOdds?: number; // Ganyan
  agfPercent?: number; // AGF %
  last5Races: number[]; // Örn: [1, 2, 4, 1, 3]
  lastRacesSummary?: string; // Örn: "1-2-4-1-3"
  runningStyle?: 'FrontRunner' | 'Stalker' | 'Closer';
  recentGallopSummary?: string;
}

export interface TjkRaceSchedule {
  raceNumber: number;
  raceTime?: string;
  hipodrom: string;
  date: string;
  distance: number;
  surface: 'Kum' | 'Çim' | 'Sentetik';
  condition: string;
  raceType?: string; // Örn: Handikap-16, Şartlı-4, KV-8, Açık Gr-1
  prize?: number;
  horses: TjkRawHorseEntry[];
}

export interface TjkDailyBulletin {
  date: string;
  hipodrom: string;
  races: TjkRaceSchedule[];
  isScrapedLive: boolean;
  fetchedAt: string;
  sourceUrl?: string;
}

export class TjkScraper {
  /**
   * TJK Günlük Yarış Programını / Bültenini Çeker
   */
  public static async fetchDailyProgram(hipodrom: string = 'İSTANBUL', dateStr?: string): Promise<TjkDailyBulletin> {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const formattedDate = today.replace(/-/g, ''); // YYYYMMDD
    
    // TJK Mobil / Web Program Endpoint URL'si
    const targetUrl = `https://www.tjk.org/TR/YarisSever/Info/GetProgram?Sehir=${encodeURIComponent(hipodrom)}&Tarih=${formattedDate}`;

    console.log(`[TjkScraper] ${hipodrom} (${today}) bülteni çekiliyor: ${targetUrl}`);

    const response = await safeFetchWithRetry<string>(
      targetUrl,
      {
        timeoutMs: 9000,
        maxRetries: 3,
        retryDelayMs: 1500,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      },
      () => this.generateStructuredMockBulletin(hipodrom, today) as any
    );

    if (!response.success || typeof response.data !== 'string' || response.data.trim().length < 50) {
      console.warn(`[TjkScraper] Canlı TJK yanıt vermedi, güvenli fallback bülteni devreye alındı.`);
      return this.generateStructuredMockBulletin(hipodrom, today);
    }

    try {
      const parsedBulletin = this.parseTjkHtml(response.data, hipodrom, today);
      if (parsedBulletin.races.length > 0) {
        parsedBulletin.isScrapedLive = true;
        parsedBulletin.sourceUrl = targetUrl;
        return parsedBulletin;
      }
    } catch (parseErr: any) {
      console.error(`[TjkScraper] HTML parse hatası: ${parseErr.message}`);
    }

    return this.generateStructuredMockBulletin(hipodrom, today);
  }

  /**
   * TJK HTML Tablolarını Cheerio ile Parse Eden Fonksiyon
   */
  public static parseTjkHtml(html: string, hipodrom: string, date: string): TjkDailyBulletin {
    const $ = cheerio.load(html);
    const races: TjkRaceSchedule[] = [];

    // TJK Sayfasındaki koşu blokları (genellikle tab-pane veya div.kocu-container)
    $('.kocu-container, .race-container, table.gunluk-program-table, .program-kocu').each((raceIdx, raceElem) => {
      const raceNumber = raceIdx + 1;
      
      // Başlık ve mesafe/pist bilgisi
      const headerText = $(raceElem).find('.kocu-header, .race-title, caption, thead').text().trim();
      const distMatch = headerText.match(/(\d{3,4})\s*(?:m|metre)/i) || html.match(/(\d{3,4})\s*(?:m|metre)/i);
      const distance = distMatch ? parseInt(distMatch[1], 10) : 1400;

      let surface: 'Kum' | 'Çim' | 'Sentetik' = 'Kum';
      if (headerText.toLowerCase().includes('çim') || headerText.toLowerCase().includes('cim')) {
        surface = 'Çim';
      } else if (headerText.toLowerCase().includes('sentetik')) {
        surface = 'Sentetik';
      }

      const horses: TjkRawHorseEntry[] = [];

      $(raceElem).find('tbody tr, tr.at-row').each((_, tr) => {
        const cols = $(tr).find('td');
        if (cols.length >= 4) {
          const horseNo = $(cols[0]).text().trim() || `${horses.length + 1}`;
          const horseNameRaw = $(cols[1]).find('a, strong, .at-adi').text().trim() || $(cols[1]).text().trim();
          const cleanHorseName = horseNameRaw.replace(/\([A-Z0-9]+\)/g, '').replace(/[\d]/g, '').trim().toUpperCase();

          if (!cleanHorseName || cleanHorseName.length < 2) return;

          // Orijin & Pedigri bilgisi (Baba - Anne)
          const originText = $(cols[2]).text().trim();
          let originSire = '';
          let originDam = '';
          if (originText.includes('-') || originText.includes('/')) {
            const parts = originText.split(/[-/]/);
            originSire = parts[0]?.trim().toUpperCase();
            originDam = parts[1]?.trim().toUpperCase();
          }

          // Kilo & Jokey
          const weightText = $(cols[3]).text().trim();
          const weight = parseFloat(weightText.replace(',', '.')) || 56.0;
          const jockeyName = $(cols[4]).text().trim() || 'Jokey Belirtilmemiş';

          // Handikap Puanı & Kulvar
          const handicapText = cols.length > 5 ? $(cols[5]).text().trim() : '';
          const handicap = parseInt(handicapText, 10) || 50;

          // Son 5 yarış formu (Örn: "12345" veya "1-2-4-1-3")
          const formText = cols.length > 6 ? $(cols[6]).text().trim() : '';
          const last5Races = this.parseLast5Races(formText);

          // Ganyan (Market Odds) & AGF
          const oddsText = cols.length > 7 ? $(cols[7]).text().trim() : '';
          const marketOdds = parseFloat(oddsText.replace(',', '.')) || 3.5;

          const agfText = cols.length > 8 ? $(cols[8]).text().trim() : '';
          const agfPercent = parseFloat(agfText.replace('%', '').trim()) || undefined;

          horses.push({
            horseNo,
            horseName: cleanHorseName,
            originSire: originSire || undefined,
            originDam: originDam || undefined,
            weight,
            jockeyName,
            handicap,
            stallNo: parseInt(horseNo, 10) || 1,
            marketOdds,
            agfPercent,
            last5Races,
            lastRacesSummary: last5Races.join('-') || formText,
            runningStyle: this.detectRunningStyleFromForm(last5Races)
          });
        }
      });

      if (horses.length > 0) {
        races.push({
          raceNumber,
          hipodrom,
          date,
          distance,
          surface,
          condition: 'Normal',
          horses
        });
      }
    });

    return {
      date,
      hipodrom,
      races,
      isScrapedLive: races.length > 0,
      fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Son 5 yarış metnini sayı dizisine çevirir
   */
  public static parseLast5Races(formStr: string): number[] {
    if (!formStr) return [3, 2, 1];
    const cleaned = formStr.replace(/[^\d-]/g, '');
    if (cleaned.includes('-')) {
      return cleaned.split('-').map(n => parseInt(n, 10)).filter(n => !isNaN(n)).slice(-5);
    }
    // Tek basamaklı bitiş rakamları: "12413" -> [1, 2, 4, 1, 3]
    return cleaned.split('').map(n => parseInt(n, 10)).filter(n => !isNaN(n)).slice(-5);
  }

  /**
   * Koşu geçmişinden koşu stili tahmini
   */
  private static detectRunningStyleFromForm(form: number[]): 'FrontRunner' | 'Stalker' | 'Closer' {
    if (form.length === 0) return 'Stalker';
    const firstPlaceCount = form.filter(pos => pos === 1).length;
    if (firstPlaceCount >= 2) return 'FrontRunner';
    if (form[form.length - 1] <= 3) return 'Stalker';
    return 'Closer';
  }

  /**
   * TJK Web Sitesi Ulaşılamadığında veya Offline Modda Güvenli Deterministik Fallback Bülteni
   */
  public static generateStructuredMockBulletin(hipodrom: string, date: string): TjkDailyBulletin {
    const normHip = (hipodrom || '').toUpperCase().replace(/İ/g, 'I');
    
    if (normHip.includes('BURSA') || normHip.includes('OSMANGAZI')) {
      return {
        date,
        hipodrom: 'BURSA',
        isScrapedLive: false,
        fetchedAt: new Date().toISOString(),
        races: [
          {
            raceNumber: 1,
            raceTime: '13:30',
            hipodrom: 'BURSA',
            date,
            distance: 1400,
            surface: 'Çim',
            condition: 'Normal 3.3',
            raceType: 'Handikap 14 /H2',
            horses: [
              { horseNo: '4', horseName: 'SILENT TOUCH', age: 3, gender: 'D', originSire: 'PAPA CLEM', originDam: 'TOUCH THE CAT', weight: 57.5, jockeyName: 'A.YILDIZ', stallNo: 4, handicap: 50, marketOdds: 2.80, agfPercent: 28.0, last5Races: [1, 2, 1, 3], lastRacesSummary: '1-2-1-3', runningStyle: 'Closer' },
              { horseNo: '10', horseName: 'APOLLON', age: 3, gender: 'E', originSire: 'DAREDEVIL', originDam: 'GOLDEN RIVER', weight: 52.5, jockeyName: 'O.ATMACA', stallNo: 10, handicap: 42, marketOdds: 4.50, agfPercent: 17.0, last5Races: [3, 2, 4, 1], lastRacesSummary: '3-2-4-1', runningStyle: 'Stalker' },
              { horseNo: '7', horseName: 'SYRENA', age: 4, gender: 'D', originSire: 'TOROK', originDam: 'STAR PRINCESS', weight: 55.5, jockeyName: 'N.AVCİ', stallNo: 7, handicap: 46, marketOdds: 5.20, agfPercent: 15.0, last5Races: [2, 4, 3, 2], lastRacesSummary: '2-4-3-2', runningStyle: 'FrontRunner' },
              { horseNo: '9', horseName: 'STORMER', age: 3, gender: 'E', originSire: 'SMART ROBIN', originDam: 'STORM CAT', weight: 53.5, jockeyName: 'M.M.BİLGİN', stallNo: 9, handicap: 44, marketOdds: 6.80, agfPercent: 11.0, last5Races: [5, 3, 2, 4], lastRacesSummary: '5-3-2-4', runningStyle: 'Closer' },
              { horseNo: '1', horseName: 'ANGEL QUEST', age: 4, gender: 'D', originSire: 'CORINTHIAN', originDam: 'ANGEL FIRE', weight: 60.0, jockeyName: 'E.AKPINAR', stallNo: 1, handicap: 55, marketOdds: 8.50, agfPercent: 7.0, last5Races: [4, 5, 6, 2], lastRacesSummary: '4-5-6-2', runningStyle: 'Stalker' }
            ]
          },
          {
            raceNumber: 2,
            raceTime: '14:00',
            hipodrom: 'BURSA',
            date,
            distance: 1800,
            surface: 'Çim',
            condition: 'Normal 3.3',
            raceType: 'Şartlı 5',
            horses: [
              { horseNo: '2', horseName: 'SELLYBOY', age: 4, gender: 'E', originSire: 'VICTORY GALLOP', originDam: 'SELDA', weight: 56.0, jockeyName: 'E.AKPINAR', stallNo: 2, handicap: 78, marketOdds: 2.00, agfPercent: 42.0, last5Races: [1, 1, 2, 1], lastRacesSummary: '1-1-2-1', runningStyle: 'Stalker' },
              { horseNo: '4', horseName: 'THINDER OF SHINE', age: 4, gender: 'E', originSire: 'LION HEART', originDam: 'SHINING GOLD', weight: 56.0, jockeyName: 'A.YILDIZ', stallNo: 4, handicap: 72, marketOdds: 6.60, agfPercent: 22.0, last5Races: [2, 3, 1, 4], lastRacesSummary: '2-3-1-4', runningStyle: 'FrontRunner' },
              { horseNo: '3', horseName: 'ALYCONE', age: 4, gender: 'E', originSire: 'TOROK', originDam: 'LADY STAR', weight: 56.0, jockeyName: 'G.ÖZÇELİK', stallNo: 3, handicap: 70, marketOdds: 4.95, agfPercent: 18.0, last5Races: [3, 2, 4, 2], lastRacesSummary: '3-2-4-2', runningStyle: 'Closer' },
              { horseNo: '1', horseName: 'OHIO MAN', age: 5, gender: 'E', originSire: 'DAREDEVIL', originDam: 'OHIO LADY', weight: 60.0, jockeyName: 'O.YILDIZ', stallNo: 1, handicap: 82, marketOdds: 4.00, agfPercent: 10.0, last5Races: [4, 1, 3, 5], lastRacesSummary: '4-1-3-5', runningStyle: 'Stalker' }
            ]
          },
          {
            raceNumber: 3,
            raceTime: '14:30',
            hipodrom: 'BURSA',
            date,
            distance: 1400,
            surface: 'Çim',
            condition: 'Normal 3.3',
            raceType: 'Maiden',
            horses: [
              { horseNo: '9', horseName: 'SHAERA', age: 3, gender: 'D', originSire: 'MENDIP', originDam: 'SHEBA', weight: 60.0, jockeyName: 'M.ÇİÇEK', stallNo: 9, handicap: 44, marketOdds: 2.15, agfPercent: 55.0, last5Races: [2, 2, 2], lastRacesSummary: '2-2-2', runningStyle: 'FrontRunner' },
              { horseNo: '1', horseName: 'RUS FARUK', age: 3, gender: 'E', originSire: 'PAPA CLEM', originDam: 'RUS PRINCESS', weight: 60.0, jockeyName: 'K.TOKAÇOĞLU', stallNo: 1, handicap: 38, marketOdds: 7.15, agfPercent: 14.0, last5Races: [3, 4, 2], lastRacesSummary: '3-4-2', runningStyle: 'Stalker' },
              { horseNo: '14', horseName: 'MIND GAMES', age: 3, gender: 'D', originSire: 'CRIMEAN TATAR', originDam: 'MIND MAGIC', weight: 56.0, jockeyName: 'G.KOCAKAYA', stallNo: 14, handicap: 35, marketOdds: 9.75, agfPercent: 11.0, last5Races: [4, 3, 5], lastRacesSummary: '4-3-5', runningStyle: 'Closer' },
              { horseNo: '2', horseName: 'BEYOND BRAVE', age: 3, gender: 'E', originSire: 'BODEMEISTER', originDam: 'BRAVE LADY', weight: 58.0, jockeyName: 'N.AVCİ', stallNo: 2, handicap: 32, marketOdds: 11.00, agfPercent: 5.0, last5Races: [5, 6, 4], lastRacesSummary: '5-6-4', runningStyle: 'Closer' }
            ]
          },
          {
            raceNumber: 4,
            raceTime: '15:00',
            hipodrom: 'BURSA',
            date,
            distance: 1300,
            surface: 'Çim',
            condition: 'Normal 3.3',
            raceType: 'Şartlı 5/DHÖ',
            horses: [
              { horseNo: '3', horseName: 'SERHUNEFE', age: 4, gender: 'E', originSire: 'TURBO', originDam: 'MİHRİBAN', weight: 61.0, jockeyName: 'M.ÇİÇEK', stallNo: 3, handicap: 85, marketOdds: 5.35, agfPercent: 37.0, last5Races: [1, 2, 1, 3], lastRacesSummary: '1-2-1-3', runningStyle: 'FrontRunner' },
              { horseNo: '10', horseName: 'SARAFİM', age: 4, gender: 'E', originSire: 'KAIZBERT', originDam: 'SARAF', weight: 55.0, jockeyName: 'MER.ÇELİK', stallNo: 10, handicap: 74, marketOdds: 9.80, agfPercent: 14.0, last5Races: [3, 1, 4, 2], lastRacesSummary: '3-1-4-2', runningStyle: 'Stalker' },
              { horseNo: '4', horseName: 'TARÇINKIZ', age: 4, gender: 'D', originSire: 'AYABAKAN', originDam: 'TARÇIN', weight: 60.0, jockeyName: 'M.M.BİLGİN', stallNo: 4, handicap: 76, marketOdds: 5.30, agfPercent: 12.0, last5Races: [2, 3, 2, 1], lastRacesSummary: '2-3-2-1', runningStyle: 'Stalker' },
              { horseNo: '5', horseName: 'UMUDUNU KAYBETME', age: 4, gender: 'E', originSire: 'ALTAHA', originDam: 'UMUT IŞIĞI', weight: 59.0, jockeyName: 'M.KAYA', stallNo: 5, handicap: 72, marketOdds: 9.25, agfPercent: 9.0, last5Races: [4, 5, 1, 4], lastRacesSummary: '4-5-1-4', runningStyle: 'Closer' }
            ]
          },
          {
            raceNumber: 5,
            raceTime: '15:30',
            hipodrom: 'BURSA',
            date,
            distance: 2000,
            surface: 'Kum',
            condition: 'Normal',
            raceType: 'Handikap 16/DHÖW',
            horses: [
              { horseNo: '6', horseName: 'SÜTLİMAN', age: 5, gender: 'E', originSire: 'KARA YAĞIZ', originDam: 'SÜT BEYAZ', weight: 57.0, jockeyName: 'C.PASO', stallNo: 6, handicap: 80, marketOdds: 13.35, agfPercent: 25.0, last5Races: [2, 1, 3, 2], lastRacesSummary: '2-1-3-2', runningStyle: 'Closer' },
              { horseNo: '9', horseName: 'KURUÇAY', age: 5, gender: 'E', originSire: 'TÜMÖZ BEY', originDam: 'ÇAY GÜZELİ', weight: 57.0, jockeyName: 'A.E.ELMAS', stallNo: 9, handicap: 75, marketOdds: 12.35, agfPercent: 17.0, last5Races: [3, 4, 1, 5], lastRacesSummary: '3-4-1-5', runningStyle: 'Stalker' },
              { horseNo: '4', horseName: 'SEMENDİN GÜCÜ', age: 5, gender: 'E', originSire: 'SEMEND', originDam: 'GÜÇLÜ KIZ', weight: 61.0, jockeyName: 'N.AVCİ', stallNo: 4, handicap: 84, marketOdds: 16.15, agfPercent: 16.0, last5Races: [1, 5, 2, 3], lastRacesSummary: '1-5-2-3', runningStyle: 'FrontRunner' },
              { horseNo: '1', horseName: 'SOSAN YILDIZI', age: 6, gender: 'D', originSire: 'ALTAHA', originDam: 'SOSAN', weight: 61.0, jockeyName: 'Y.GÖKÇE', stallNo: 1, handicap: 86, marketOdds: 7.50, agfPercent: 9.0, last5Races: [4, 2, 4, 1], lastRacesSummary: '4-2-4-1', runningStyle: 'Stalker' }
            ]
          },
          {
            raceNumber: 6,
            raceTime: '16:00',
            hipodrom: 'BURSA',
            date,
            distance: 1400,
            surface: 'Çim',
            condition: 'Normal 3.3',
            raceType: 'Maiden',
            horses: [
              { horseNo: '1', horseName: 'SHAREHOLDER', age: 3, gender: 'E', originSire: 'CRIMEAN TATAR', originDam: 'SHARE LADY', weight: 63.0, jockeyName: 'M.KAYA', stallNo: 1, handicap: 46, marketOdds: 4.70, agfPercent: 28.0, last5Races: [2, 3, 2], lastRacesSummary: '2-3-2', runningStyle: 'Stalker' },
              { horseNo: '4', horseName: 'DIVINE SON', age: 3, gender: 'E', originSire: 'NATIVE KHAN', originDam: 'DIVINE LADY', weight: 58.0, jockeyName: 'N.AVCİ', stallNo: 4, handicap: 45, marketOdds: 5.30, agfPercent: 26.0, last5Races: [3, 2, 4], lastRacesSummary: '3-2-4', runningStyle: 'FrontRunner' },
              { horseNo: '2', horseName: 'SOSAN', age: 3, gender: 'D', originSire: 'TOROK', originDam: 'SOSAN STAR', weight: 59.0, jockeyName: 'Y.GÖKÇE', stallNo: 2, handicap: 40, marketOdds: 5.00, agfPercent: 19.0, last5Races: [4, 3, 3], lastRacesSummary: '4-3-3', runningStyle: 'Closer' },
              { horseNo: '12', horseName: 'QUEEN ASEL', age: 3, gender: 'D', originSire: 'BODEMEISTER', originDam: 'QUEEN STAR', weight: 56.0, jockeyName: 'B.M.MIRIK', stallNo: 12, handicap: 36, marketOdds: 8.40, agfPercent: 7.0, last5Races: [5, 4, 6], lastRacesSummary: '5-4-6', runningStyle: 'Closer' }
            ]
          },
          {
            raceNumber: 7,
            raceTime: '16:30',
            hipodrom: 'BURSA',
            date,
            distance: 1200,
            surface: 'Kum',
            condition: 'Normal',
            raceType: 'Handikap 17 /H2',
            horses: [
              { horseNo: '5', horseName: 'KING ZELAY', age: 4, gender: 'E', originSire: 'LION HEART', originDam: 'ZELAY', weight: 56.5, jockeyName: 'M.KAYA', stallNo: 5, handicap: 88, marketOdds: 1.70, agfPercent: 32.0, last5Races: [1, 1, 2, 1], lastRacesSummary: '1-1-2-1', runningStyle: 'FrontRunner' },
              { horseNo: '6', horseName: 'GENERAL SHERMAN', age: 4, gender: 'E', originSire: 'TOROK', originDam: 'SHERMAN', weight: 53.0, jockeyName: 'G.KOCAKAYA', stallNo: 6, handicap: 85, marketOdds: 2.85, agfPercent: 25.0, last5Races: [2, 1, 3, 2], lastRacesSummary: '2-1-3-2', runningStyle: 'Stalker' },
              { horseNo: '4', horseName: 'FEARLESS DRAGON', age: 4, gender: 'E', originSire: 'DAREDEVIL', originDam: 'DRAGON', weight: 53.5, jockeyName: 'N.AVCİ', stallNo: 4, handicap: 80, marketOdds: 6.60, agfPercent: 18.0, last5Races: [3, 4, 1, 4], lastRacesSummary: '3-4-1-4', runningStyle: 'Closer' },
              { horseNo: '1', horseName: 'LEJUR', age: 5, gender: 'E', originSire: 'PAPA CLEM', originDam: 'LEJUR', weight: 61.0, jockeyName: 'R.KETME', stallNo: 1, handicap: 82, marketOdds: 9.35, agfPercent: 13.0, last5Races: [4, 5, 2, 3], lastRacesSummary: '4-5-2-3', runningStyle: 'Closer' }
            ]
          },
          {
            raceNumber: 8,
            raceTime: '17:00',
            hipodrom: 'BURSA',
            date,
            distance: 1300,
            surface: 'Çim',
            condition: 'Normal 3.3',
            raceType: 'KV-6/Dişi',
            horses: [
              { horseNo: '2', horseName: 'PERHAPS', age: 2, gender: 'D', originSire: 'NATIVE KHAN', originDam: 'PERHAPS', weight: 57.0, jockeyName: 'G.KOCAKAYA', stallNo: 2, handicap: 92, marketOdds: 1.05, agfPercent: 74.0, last5Races: [1, 1, 1], lastRacesSummary: '1-1-1', runningStyle: 'FrontRunner' },
              { horseNo: '5', horseName: 'WOLF WOMEN', age: 2, gender: 'D', originSire: 'SMART ROBIN', originDam: 'WOLF', weight: 54.0, jockeyName: 'M.M.BİLGİN', stallNo: 5, handicap: 65, marketOdds: 6.50, agfPercent: 10.0, last5Races: [2, 3, 2], lastRacesSummary: '2-3-2', runningStyle: 'Stalker' },
              { horseNo: '3', horseName: 'PONCA', age: 2, gender: 'D', originSire: 'CRIMEAN TATAR', originDam: 'PONCA', weight: 55.0, jockeyName: 'N.AVCİ', stallNo: 3, handicap: 62, marketOdds: 8.00, agfPercent: 9.0, last5Races: [3, 2, 4], lastRacesSummary: '3-2-4', runningStyle: 'Closer' },
              { horseNo: '1', horseName: 'BRAVE ATHENA', age: 2, gender: 'D', originSire: 'BODEMEISTER', originDam: 'ATHENA', weight: 57.0, jockeyName: 'S.ÖZEN', stallNo: 1, handicap: 58, marketOdds: 12.00, agfPercent: 6.0, last5Races: [4, 4, 3], lastRacesSummary: '4-4-3', runningStyle: 'Closer' }
            ]
          },
          {
            raceNumber: 9,
            raceTime: '17:30',
            hipodrom: 'BURSA',
            date,
            distance: 1400,
            surface: 'Çim',
            condition: 'Normal 3.3',
            raceType: 'Maiden',
            horses: [
              { horseNo: '1', horseName: 'BABA ZÜLKÜF', age: 3, gender: 'E', originSire: 'ULAN BATOR', originDam: 'ÖCAL TAY', weight: 58.0, jockeyName: 'K.TOKAÇOĞLU', stallNo: 1, handicap: 44, marketOdds: 3.50, agfPercent: 24.0, last5Races: [2, 2, 3], lastRacesSummary: '2-2-3', runningStyle: 'FrontRunner' },
              { horseNo: '3', horseName: 'GRAND CHAMPION', age: 3, gender: 'E', originSire: 'TOROK', originDam: 'CHAMPION', weight: 58.0, jockeyName: 'M.KAYA', stallNo: 3, handicap: 45, marketOdds: 3.20, agfPercent: 25.0, last5Races: [3, 1, 2], lastRacesSummary: '3-1-2', runningStyle: 'Stalker' },
              { horseNo: '5', horseName: 'NOBLE PRINCE', age: 3, gender: 'E', originSire: 'DAREDEVIL', originDam: 'NOBLE', weight: 58.0, jockeyName: 'G.KOCAKAYA', stallNo: 5, handicap: 43, marketOdds: 3.80, agfPercent: 22.0, last5Races: [2, 3, 2], lastRacesSummary: '2-3-2', runningStyle: 'Stalker' },
              { horseNo: '2', horseName: 'BEYOND LIMITS', age: 3, gender: 'E', originSire: 'PAPA CLEM', originDam: 'LIMITS', weight: 58.0, jockeyName: 'N.AVCİ', stallNo: 2, handicap: 40, marketOdds: 4.80, agfPercent: 18.0, last5Races: [4, 2, 4], lastRacesSummary: '4-2-4', runningStyle: 'Closer' },
              { horseNo: '6', horseName: 'SPEED MASTER', age: 3, gender: 'E', originSire: 'LION HEART', originDam: 'SPEED', weight: 58.0, jockeyName: 'O.ATMACA', stallNo: 6, handicap: 35, marketOdds: 9.00, agfPercent: 7.0, last5Races: [5, 4, 5], lastRacesSummary: '5-4-5', runningStyle: 'Closer' }
            ]
          },
          {
            raceNumber: 10,
            raceTime: '18:00',
            hipodrom: 'BURSA',
            date,
            distance: 1900,
            surface: 'Kum',
            condition: 'Normal',
            raceType: 'Handikap 15/DHÖW',
            horses: [
              { horseNo: '1', horseName: 'OĞULCAN', age: 5, gender: 'E', originSire: 'ALTAHA', originDam: 'OĞUL', weight: 60.0, jockeyName: 'E.AKTUĞ', stallNo: 1, handicap: 75, marketOdds: 3.10, agfPercent: 28.0, last5Races: [1, 2, 1, 4], lastRacesSummary: '1-2-1-4', runningStyle: 'FrontRunner' },
              { horseNo: '3', horseName: 'TAYLAN EFENDİ', age: 6, gender: 'E', originSire: 'TURBO', originDam: 'TAYLAN', weight: 57.0, jockeyName: 'M.KAYA', stallNo: 3, handicap: 70, marketOdds: 4.20, agfPercent: 22.0, last5Races: [2, 3, 2, 1], lastRacesSummary: '2-3-2-1', runningStyle: 'Stalker' },
              { horseNo: '2', horseName: 'ŞAHİN BEY', age: 4, gender: 'E', originSire: 'KAIZBERT', originDam: 'ŞAHİN', weight: 58.5, jockeyName: 'S.ÖZEN', stallNo: 2, handicap: 68, marketOdds: 5.50, agfPercent: 18.0, last5Races: [3, 1, 4, 3], lastRacesSummary: '3-1-4-3', runningStyle: 'Stalker' },
              { horseNo: '4', horseName: 'SARIEREN', age: 4, gender: 'E', originSire: 'AYABAKAN', originDam: 'SARI', weight: 55.5, jockeyName: 'G.KOCAKAYA', stallNo: 4, handicap: 64, marketOdds: 6.80, agfPercent: 16.0, last5Races: [4, 4, 2, 5], lastRacesSummary: '4-4-2-5', runningStyle: 'Closer' },
              { horseNo: '5', horseName: 'DİZDAR BEY', age: 5, gender: 'E', originSire: 'KARA YAĞIZ', originDam: 'DİZDAR', weight: 53.5, jockeyName: 'N.AVCİ', stallNo: 5, handicap: 60, marketOdds: 9.50, agfPercent: 11.0, last5Races: [5, 3, 5, 2], lastRacesSummary: '5-3-5-2', runningStyle: 'Closer' }
            ]
          }
        ]
      };
    }

    return {
      date,
      hipodrom: hipodrom.toUpperCase(),
      isScrapedLive: false,
      fetchedAt: new Date().toISOString(),
      races: [
        {
          raceNumber: 1,
          raceTime: '15:00',
          hipodrom,
          date,
          distance: 1400,
          surface: 'Kum',
          condition: 'Normal',
          raceType: 'Şartlı-4',
          horses: [
            {
              horseNo: '1',
              horseName: 'CANMETE',
              age: 5,
              gender: 'E',
              originSire: 'TURBO',
              originDam: 'MİHRİCAN',
              weight: 58.0,
              jockeyName: 'G.KOCAKAYA',
              stallNo: 1,
              handicap: 94,
              marketOdds: 2.80,
              agfPercent: 34.5,
              last5Races: [1, 2, 1, 3, 1],
              lastRacesSummary: '1-2-1-3-1',
              runningStyle: 'FrontRunner'
            },
            {
              horseNo: '2',
              horseName: 'RÜZGAR BEYİ',
              age: 4,
              gender: 'E',
              originSire: 'KAIZBERT',
              originDam: 'CANİREM',
              weight: 56.5,
              jockeyName: 'A.ÇELİK',
              stallNo: 2,
              handicap: 88,
              marketOdds: 4.50,
              agfPercent: 22.0,
              last5Races: [3, 1, 4, 2, 2],
              lastRacesSummary: '3-1-4-2-2',
              runningStyle: 'Stalker'
            },
            {
              horseNo: '3',
              horseName: 'YILDIRIMŞAH',
              age: 4,
              gender: 'E',
              originSire: 'AYABAKAN',
              originDam: 'GÜLDÜREN',
              weight: 54.0,
              jockeyName: 'H.KARATAŞ',
              stallNo: 3,
              handicap: 82,
              marketOdds: 7.20,
              agfPercent: 12.5,
              last5Races: [5, 4, 2, 6, 1],
              lastRacesSummary: '5-4-2-6-1',
              runningStyle: 'Closer'
            },
            {
              horseNo: '4',
              horseName: 'ALTIN FIRTINA',
              age: 5,
              gender: 'E',
              originSire: 'ALTAHA',
              originDam: 'KIRGIZ GÜZELİ',
              weight: 55.0,
              jockeyName: 'M.KAYA',
              stallNo: 4,
              handicap: 79,
              marketOdds: 12.50,
              agfPercent: 6.8,
              last5Races: [7, 6, 3, 4, 3],
              lastRacesSummary: '7-6-3-4-3',
              runningStyle: 'Closer'
            },
            {
              horseNo: '5',
              horseName: 'DEMİR PENÇE',
              age: 4,
              gender: 'E',
              originSire: 'KARA YAĞIZ',
              originDam: 'ŞEN BAHAR',
              weight: 53.5,
              jockeyName: 'Ö.YILDIRIM',
              stallNo: 5,
              handicap: 75,
              marketOdds: 18.00,
              agfPercent: 4.2,
              last5Races: [8, 5, 4, 7, 5],
              lastRacesSummary: '8-5-4-7-5',
              runningStyle: 'Stalker'
            }
          ]
        },
        {
          raceNumber: 2,
          raceTime: '15:30',
          hipodrom,
          date,
          distance: 1900,
          surface: 'Çim',
          condition: 'Normal 3.3',
          raceType: 'Handikap-16',
          horses: [
            {
              horseNo: '1',
              horseName: 'KING MANGO',
              age: 4,
              gender: 'E',
              originSire: 'TOROK',
              originDam: 'SADLER LADY',
              weight: 60.0,
              jockeyName: 'S.BOYRAZ',
              stallNo: 1,
              handicap: 91,
              marketOdds: 3.10,
              agfPercent: 28.0,
              last5Races: [2, 1, 1, 4, 2],
              lastRacesSummary: '2-1-1-4-2',
              runningStyle: 'Stalker'
            },
            {
              horseNo: '2',
              horseName: 'ROYAL FLUSH',
              age: 3,
              gender: 'E',
              originSire: 'NATIVE KHAN',
              originDam: 'QUEEN OF THE NIGHT',
              weight: 57.0,
              jockeyName: 'G.KOCAKAYA',
              stallNo: 2,
              handicap: 86,
              marketOdds: 3.80,
              agfPercent: 24.5,
              last5Races: [1, 3, 2, 1, 5],
              lastRacesSummary: '1-3-2-1-5',
              runningStyle: 'FrontRunner'
            },
            {
              horseNo: '3',
              horseName: 'SHADOW DANCER',
              age: 4,
              gender: 'E',
              originSire: 'VICTORY GALLOP',
              originDam: 'FLYING BIRD',
              weight: 55.5,
              jockeyName: 'A.SÖZEN',
              stallNo: 3,
              handicap: 80,
              marketOdds: 6.40,
              agfPercent: 14.0,
              last5Races: [4, 5, 1, 3, 2],
              lastRacesSummary: '4-5-1-3-2',
              runningStyle: 'Closer'
            },
            {
              horseNo: '4',
              horseName: 'TURBO JET',
              age: 4,
              gender: 'E',
              originSire: 'SPEEDY WOLF',
              originDam: 'SILVER SHINE',
              weight: 54.0,
              jockeyName: 'H.ÇİZİK',
              stallNo: 4,
              handicap: 76,
              marketOdds: 9.80,
              agfPercent: 9.5,
              last5Races: [3, 2, 4, 5, 1],
              lastRacesSummary: '3-2-4-5-1',
              runningStyle: 'Stalker'
            }
          ]
        },
        {
          raceNumber: 3,
          raceTime: '16:00',
          hipodrom,
          date,
          distance: 1200,
          surface: 'Sentetik',
          condition: 'Standart',
          raceType: 'Maiden / Dişi',
          horses: [
            {
              horseNo: '1',
              horseName: 'STAR OF ISTANBUL',
              age: 3,
              gender: 'D',
              originSire: 'SIDNEYS CANDY',
              originDam: 'OCEAN LADY',
              weight: 58.0,
              jockeyName: 'G.KOCAKAYA',
              stallNo: 1,
              handicap: 48,
              marketOdds: 2.10,
              agfPercent: 42.0,
              last5Races: [2, 2, 3],
              lastRacesSummary: '2-2-3',
              runningStyle: 'FrontRunner'
            },
            {
              horseNo: '2',
              horseName: 'BLUE WAVE',
              age: 3,
              gender: 'D',
              originSire: 'MENDIP',
              originDam: 'BLUE SEA',
              weight: 58.0,
              jockeyName: 'Ö.YILDIRIM',
              stallNo: 2,
              handicap: 44,
              marketOdds: 4.50,
              agfPercent: 22.0,
              last5Races: [4, 3, 2],
              lastRacesSummary: '4-3-2',
              runningStyle: 'Stalker'
            },
            {
              horseNo: '3',
              horseName: 'FIRE STORM',
              age: 3,
              gender: 'D',
              originSire: 'LION HEART',
              originDam: 'FLAME',
              weight: 58.0,
              jockeyName: 'S.BOYRAZ',
              stallNo: 3,
              handicap: 41,
              marketOdds: 6.80,
              agfPercent: 15.0,
              last5Races: [5, 4, 3],
              lastRacesSummary: '5-4-3',
              runningStyle: 'Closer'
            },
            {
              horseNo: '4',
              horseName: 'VICTORY RUNNER',
              age: 3,
              gender: 'D',
              originSire: 'CORINTHIAN',
              originDam: 'RUNNER QUEEN',
              weight: 58.0,
              jockeyName: 'M.AKYAVUZ',
              stallNo: 4,
              handicap: 39,
              marketOdds: 11.20,
              agfPercent: 8.0,
              last5Races: [6, 5, 4],
              lastRacesSummary: '6-5-4',
              runningStyle: 'Closer'
            }
          ]
        },
        {
          raceNumber: 4,
          raceTime: '16:30',
          hipodrom,
          date,
          distance: 2000,
          surface: 'Sentetik',
          condition: 'Standart',
          raceType: 'Kv-8 / S.A.A.',
          horses: [
            {
              horseNo: '1',
              horseName: 'LORD OF THE SEAS',
              age: 5,
              gender: 'E',
              originSire: 'VICTORY GALLOP',
              originDam: 'SEA BREEZE',
              weight: 60.0,
              jockeyName: 'H.KARATAŞ',
              stallNo: 1,
              handicap: 102,
              marketOdds: 2.40,
              agfPercent: 38.0,
              last5Races: [1, 1, 2, 1, 3],
              lastRacesSummary: '1-1-2-1-3',
              runningStyle: 'Stalker'
            },
            {
              horseNo: '2',
              horseName: 'SILVER ARROW',
              age: 4,
              gender: 'E',
              originSire: 'LUXOR',
              originDam: 'SILVER LADY',
              weight: 59.0,
              jockeyName: 'A.ÇELİK',
              stallNo: 2,
              handicap: 98,
              marketOdds: 3.50,
              agfPercent: 26.0,
              last5Races: [2, 1, 3, 1, 2],
              lastRacesSummary: '2-1-3-1-2',
              runningStyle: 'FrontRunner'
            },
            {
              horseNo: '3',
              horseName: 'BLACK TORNADO',
              age: 6,
              gender: 'E',
              originSire: 'KANTHAROS',
              originDam: 'DARK QUEEN',
              weight: 58.0,
              jockeyName: 'G.KOCAKAYA',
              stallNo: 3,
              handicap: 95,
              marketOdds: 5.20,
              agfPercent: 18.0,
              last5Races: [3, 4, 1, 2, 4],
              lastRacesSummary: '3-4-1-2-4',
              runningStyle: 'Closer'
            },
            {
              horseNo: '4',
              horseName: 'DARK KNIGHT',
              age: 4,
              gender: 'E',
              originSire: 'DAREDEVIL',
              originDam: 'NIGHT FLIGHT',
              weight: 57.0,
              jockeyName: 'M.AKYAVUZ',
              stallNo: 4,
              handicap: 92,
              marketOdds: 8.50,
              agfPercent: 11.0,
              last5Races: [4, 2, 5, 3, 1],
              lastRacesSummary: '4-2-5-3-1',
              runningStyle: 'Closer'
            }
          ]
        },
        {
          raceNumber: 5,
          raceTime: '17:00',
          hipodrom,
          date,
          distance: 1600,
          surface: 'Çim',
          condition: 'Normal 3.3',
          raceType: 'Handikap-16',
          horses: [
            {
              horseNo: '1',
              horseName: 'BRAVE HEART',
              age: 3,
              gender: 'E',
              originSire: 'BODEMEISTER',
              originDam: 'GOLDEN ROSE',
              weight: 58.0,
              jockeyName: 'A.SÖZEN',
              stallNo: 1,
              handicap: 84,
              marketOdds: 3.20,
              agfPercent: 30.0,
              last5Races: [1, 2, 1, 3, 4],
              lastRacesSummary: '1-2-1-3-4',
              runningStyle: 'FrontRunner'
            },
            {
              horseNo: '2',
              horseName: 'THUNDER BOLT',
              age: 4,
              gender: 'E',
              originSire: 'TOROK',
              originDam: 'THUNDER DANCE',
              weight: 53.5,
              jockeyName: 'G.KOCAKAYA',
              stallNo: 2,
              handicap: 80,
              marketOdds: 4.10,
              agfPercent: 25.0,
              last5Races: [2, 3, 1, 2, 5],
              lastRacesSummary: '2-3-1-2-5',
              runningStyle: 'Stalker'
            },
            {
              horseNo: '3',
              horseName: 'RED GIANT',
              age: 4,
              gender: 'E',
              originSire: 'APPROVE',
              originDam: 'RED LADY',
              weight: 60.5,
              jockeyName: 'O.ATMACA',
              stallNo: 3,
              handicap: 88,
              marketOdds: 6.20,
              agfPercent: 16.0,
              last5Races: [4, 1, 4, 3, 2],
              lastRacesSummary: '4-1-4-3-2',
              runningStyle: 'Closer'
            },
            {
              horseNo: '4',
              horseName: 'GALAXY EXPRESS',
              age: 3,
              gender: 'E',
              originSire: 'PAPA CLEM',
              originDam: 'GALAXY STAR',
              weight: 56.0,
              jockeyName: 'N.AVCI',
              stallNo: 4,
              handicap: 78,
              marketOdds: 8.80,
              agfPercent: 12.0,
              last5Races: [3, 5, 2, 4, 1],
              lastRacesSummary: '3-5-2-4-1',
              runningStyle: 'Closer'
            }
          ]
        },
        {
          raceNumber: 6,
          raceTime: '17:30',
          hipodrom,
          date,
          distance: 1500,
          surface: 'Sentetik',
          condition: 'Standart',
          raceType: 'Şartlı 5/DHÖW',
          horses: [
            {
              horseNo: '1',
              horseName: 'ASLANPARÇASI',
              age: 4,
              gender: 'E',
              originSire: 'KAIZBERT',
              originDam: 'GÜLDÜREN',
              weight: 58.0,
              jockeyName: 'M.KAYA',
              stallNo: 1,
              handicap: 88,
              marketOdds: 2.80,
              agfPercent: 34.0,
              last5Races: [1, 2, 1, 1, 3],
              lastRacesSummary: '1-2-1-1-3',
              runningStyle: 'FrontRunner'
            },
            {
              horseNo: '2',
              horseName: 'KIRAT',
              age: 4,
              gender: 'E',
              originSire: 'TÜMÖZ BEY',
              originDam: 'KIR ÇİÇEĞİ',
              weight: 55.0,
              jockeyName: 'G.KOCAKAYA',
              stallNo: 2,
              handicap: 84,
              marketOdds: 3.60,
              agfPercent: 28.0,
              last5Races: [2, 1, 3, 2, 1],
              lastRacesSummary: '2-1-3-2-1',
              runningStyle: 'Stalker'
            },
            {
              horseNo: '3',
              horseName: 'RÜZGARIN SESİ',
              age: 4,
              gender: 'E',
              originSire: 'ALTAHA',
              originDam: 'ESEN YEL',
              weight: 56.0,
              jockeyName: 'M.AKYAVUZ',
              stallNo: 3,
              handicap: 80,
              marketOdds: 6.50,
              agfPercent: 16.0,
              last5Races: [3, 4, 2, 1, 4],
              lastRacesSummary: '3-4-2-1-4',
              runningStyle: 'Closer'
            },
            {
              horseNo: '4',
              horseName: 'EFE YÜREK',
              age: 4,
              gender: 'E',
              originSire: 'TURBO',
              originDam: 'YÜREKLİ',
              weight: 54.0,
              jockeyName: 'H.KARATAŞ',
              stallNo: 4,
              handicap: 78,
              marketOdds: 8.00,
              agfPercent: 12.0,
              last5Races: [4, 3, 5, 3, 2],
              lastRacesSummary: '4-3-5-3-2',
              runningStyle: 'Closer'
            }
          ]
        }
      ]
    };
  }
}
export default TjkScraper;
