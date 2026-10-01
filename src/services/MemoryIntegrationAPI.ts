/**
 * MemoryIntegrationAPI
 *
 * Express.js route handlers for bulletin memory ingestion, querying, and auto-learning feedback.
 * Connect this to your server.ts app routes.
 *
 * Endpoints:
 * - POST /api/memory/bulletins → İngestion from Google AI Studio or user paste
 * - GET /api/memory/races?hipodrom=...&date=...&program=... → Query verified races
 * - POST /api/memory/result → Record race outcome for learning
 * - GET /api/memory/models → Get trained models stats
 */

import { Router, Request, Response } from 'express';
import { bulletinHarvestEngine } from './BulletinHarvestEngine.js';
import { AutoLearningSystem } from './AutoLearningSystem.js';
import { HistoricalRacingDatabase } from './HistoricalRacingDatabase.js';

const router = Router();
const learningSystem = new AutoLearningSystem(bulletinHarvestEngine);
const db = HistoricalRacingDatabase.getInstance();

/**
 * POST /api/memory/bulletins
 *
 * Kaynak: Google AI Studio veya kullanıcı tarafından yapıştırılan bülten
 * Gövde:
 * {
 *   sourceId: string (AI Studio session ref),
 *   bulletinText: string,
 *   hipodrom: string,
 *   raceDate: string (YYYY-MM-DD)
 * }
 */
router.post('/bulletins', (req: Request, res: Response) => {
  try {
    const { sourceId, bulletinText, hipodrom, raceDate, extractedData } = req.body;

    if (!bulletinText || !hipodrom || !raceDate) {
      return res.status(400).json({ error: 'Missing required fields: bulletinText, hipodrom, raceDate' });
    }

    const harvestId = bulletinHarvestEngine.ingestFromSource(
      sourceId || `manual-${Date.now()}`,
      bulletinText,
      hipodrom,
      raceDate
    );

    if (!harvestId) {
      return res.status(400).json({ error: 'Bulletin could not be parsed. Minimum 50 characters required.' });
    }

    const stats = bulletinHarvestEngine.getHarvestStats();
    res.json({
      success: true,
      harvestId,
      stats,
      message: `Bülten ${harvestId} başarıyla kaydedildi. Toplam ${stats.totalHorses} safkan hazırlık modeline eklendi.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/memory/races?hipodrom=İSTANBUL&date=2026-09-17&program=1.%20Altılı%20Ganyan
 *
 * Hafızadan doğrulanmış koşuları sorgula (yalnızca gerçek bülten verileri)
 */
router.get('/races', (req: Request, res: Response) => {
  try {
    const { hipodrom, date: raceDate, program } = req.query;

    if (!hipodrom || !raceDate) {
      return res.status(400).json({ error: 'Missing query params: hipodrom, date' });
    }

    const prog = (program as string) || '1. Altılı Ganyan';
    const races = bulletinHarvestEngine.queryVerifiedRaces(
      hipodrom as string,
      raceDate as string,
      prog as any
    );

    res.json({
      success: true,
      hipodrom,
      raceDate,
      program: prog,
      racesCount: races.length,
      races: races.map((r) => ({
        raceNo: r.raceNo,
        horses: r.horses.map((h) => ({
          no: h.no,
          name: h.name,
          weight: h.weight,
          agf: h.agf,
          odds: h.odds,
          jockey: h.jockey
        }))
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/memory/result
 *
 * Yarış sonucu kaydedilir; model otomatik güncellenir
 * Gövde:
 * {
 *   hipodrom: string,
 *   date: string,
 *   raceNo: number,
 *   raceType: 'Maiden' | 'Şartlı' | 'Handikap',
 *   surface: 'Kum' | 'Çim' | 'Sentetik',
 *   distance: number,
 *   winnerNo: string,
 *   winnerName: string,
 *   placers?: [{no, name}, ...]
 * }
 */
router.post('/result', (req: Request, res: Response) => {
  try {
    const { hipodrom, date, raceNo, raceType, surface, distance, winnerNo, winnerName, placers } = req.body;

    if (!hipodrom || !raceNo || !surface || !distance || !winnerNo || !winnerName) {
      return res.status(400).json({
        error: 'Missing fields: hipodrom, raceNo, surface, distance, winnerNo, winnerName'
      });
    }

    learningSystem.recordRaceResult(
      hipodrom,
      raceNo,
      raceType || 'Unknown',
      surface,
      distance,
      winnerNo,
      winnerName,
      placers
    );

    res.json({
      success: true,
      message: `Yarış ${raceNo} sonucu kaydedildi. Model güncellendi.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/memory/models
 *
 * Tüm eğitilmiş modelleri ve istatistiklerini döner
 */
router.get('/models', (req: Request, res: Response) => {
  try {
    const models = learningSystem.getAllModels();
    const harvestStats = bulletinHarvestEngine.getHarvestStats();

    res.json({
      success: true,
      harvestStats,
      modelsCount: models.length,
      models: models.map((m) => ({
        key: m.key,
        raceType: m.raceType,
        hipodrom: m.hipodrom,
        surface: m.surface,
        distance: m.distance,
        trainingDataCount: m.trainingDataCount,
        winAccuracy: m.winAccuracy,
        placeAccuracy: m.placeAccuracy,
        lastUpdated: m.lastUpdated
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/memory/predict?hipodrom=...&date=...&raceNo=...&raceType=...&surface=...&distance=...
 *
 * Belirli koşu için tahmin üretir
 */
router.get('/predict', (req: Request, res: Response) => {
  try {
    const { hipodrom, date, raceNo, raceType, surface, distance } = req.query;

    if (!hipodrom || !date || !raceNo || !surface || !distance) {
      return res.status(400).json({
        error: 'Missing params: hipodrom, date, raceNo, surface, distance'
      });
    }

    const races = bulletinHarvestEngine.queryVerifiedRaces(
      hipodrom as string,
      date as string,
      '1. Altılı Ganyan'
    );

    if (races.length === 0) {
      return res.status(404).json({ error: 'No verified races found for this hipodrom/date' });
    }

    const predictions = learningSystem.predictRace(
      races,
      Number(raceNo),
      (raceType as string) || 'Unknown',
      hipodrom as string,
      surface as string,
      Number(distance)
    );

    res.json({
      success: true,
      hipodrom,
      raceNo,
      predictions: predictions.slice(0, 5) // Top 5
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const memoryRouter = router;
