import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  RefreshCw,
  CheckCircle2,
  FileText,
  Compass,
  MapPin,
  X,
  Zap,
  Gauge,
  ArrowRight,
  TrendingUp,
  Flame,
  ShieldCheck,
  Dna,
  Volume2,
  VolumeX,
  Award,
  Layers,
  Activity,
  ChevronRight,
  Eye,
  Sliders
} from 'lucide-react';
import { runMonteCarloRaceSimulation } from '../lib/MonteCarloEngine';
import { detectHipodromFromBulletinText, CITY_TRACK_DNA_MAP } from '../analysisEngine';

interface HorseSimData {
  no: number | string;
  name: string;
  jockey: string;
  weight: number | string;
  runningStyle: 'Kaçak (Pace Setter)' | 'Öncü (Stalker)' | 'Bekleme (Closer)' | 'Düzlük Sprintçisi (Late Burst)';
  speedRating: number;
  staminaRating: number;
  turnRating: number;
  burstRating: number;
  peakSpeedKmh: number;
  kombScore: number;
  color: string;
  isScratched?: boolean;
  handicap?: number;
  odds?: number;
  agf?: number;
}

interface RaceSimPreset {
  raceNo: number;
  raceTitle: string;
  distance: number;
  trackType: 'Çim' | 'Kum' | 'Sentetik';
  trackCondition: string;
  paceExpected: 'Çok Süratli (Tandoğan Temposu)' | 'Dengeli & Taktiksel' | 'Rölanti / Ağır Tempo';
  horses: HorseSimData[];
}

interface LiveRaceProjectionProps {
  selectedHipodrom: string;
  selectedDate: string;
  extractedRaces?: any[];
  onHipodromChange?: (hipodrom: string) => void;
  onRacesExtracted?: (races: any[]) => void;
  onSendToAiChat?: (prompt: string) => void;
  onOpenAiChat?: () => void;
}

const HORSE_COLORS = [
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#EAB308', // Yellow
  '#A855F7', // Violet
  '#6366F1', // Indigo
];

const PROMINENT_CITIES = [
  "İSTANBUL",
  "İZMİR",
  "ANKARA",
  "ADANA",
  "BURSA",
  "ANTALYA",
  "KOCAELİ",
  "ŞANLIURFA",
  "DİYARBAKIR",
  "ELAZIĞ"
];

// Audio synthesizer for realistic race track atmosphere
class RaceAudioSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playGallopRhythm(speed: number) {
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state === 'suspended') return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 180 + speed * 15;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(45 + Math.random() * 20, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  playFinishBell() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [880, 1108, 1320].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.65);
      });
    } catch {}
  }
}

const raceAudio = new RaceAudioSynth();

export default function LiveRaceProjection({
  selectedHipodrom,
  selectedDate,
  extractedRaces = [],
  onHipodromChange,
  onRacesExtracted,
  onSendToAiChat,
  onOpenAiChat
}: LiveRaceProjectionProps) {
  const [activeHipodrom, setActiveHipodrom] = useState<string>(selectedHipodrom || "İSTANBUL");
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  
  // View mode: 'detailed' (Track + List + Split) | 'radar' (2D Realistic Oval Track View) | 'matrix' (Quantum comparison)
  const [viewMode, setViewMode] = useState<'detailed' | 'radar' | 'matrix'>('detailed');
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('turbo10x_sim_sound');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Info Modal State
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // Bulletin Paste Modal State
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [isParsingPaste, setIsParsingPaste] = useState<boolean>(false);
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  // Sync activeHipodrom if parent prop changes
  useEffect(() => {
    if (selectedHipodrom && selectedHipodrom !== activeHipodrom) {
      setActiveHipodrom(selectedHipodrom);
    }
  }, [selectedHipodrom]);

  // Handle City Change
  const handleCitySelect = async (city: string) => {
    setActiveHipodrom(city);
    if (onHipodromChange) {
      onHipodromChange(city);
    }
    await fetchLiveTjkData(city);
  };

  // Direct Live TJK Data Fetch Function
  const fetchLiveTjkData = async (cityToFetch?: string) => {
    const targetCity = cityToFetch || activeHipodrom;
    try {
      setIsSyncingLive(true);
      setSyncStatusText(`📡 ${targetCity} TJK canlı bülten verisi çekiliyor...`);
      
      const res = await fetch('/api/tjk/live-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hipodrom: targetCity,
          date: selectedDate,
          programType: "1. Altılı Ganyan"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.selectedRaces && data.selectedRaces.length > 0) {
          if (onRacesExtracted) {
            onRacesExtracted(data.selectedRaces);
          }
          setSyncStatusText(`✅ ${targetCity} (${data.selectedRaces.length} Koşu) başarıyla senkronize edildi!`);
          setTimeout(() => setSyncStatusText(null), 4000);
        } else {
          setSyncStatusText(`ℹ️ ${targetCity} bülteni hazırlandı.`);
          setTimeout(() => setSyncStatusText(null), 3000);
        }
      }
    } catch (err) {
      setSyncStatusText(`⚠️ Bağlantı kuruldu, yerel bülten aktif.`);
      setTimeout(() => setSyncStatusText(null), 3000);
    } finally {
      setIsSyncingLive(false);
    }
  };

  // Handle Rapid Async Bulletin Parsing
  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    try {
      setIsParsingPaste(true);
      setPasteFeedback("⚡ Bülten ayrıştırılıyor...");

      const detectedHipo = detectHipodromFromBulletinText(pasteText, activeHipodrom);
      if (detectedHipo && detectedHipo !== activeHipodrom) {
        setActiveHipodrom(detectedHipo);
        if (onHipodromChange) {
          onHipodromChange(detectedHipo);
        }
      }

      const res = await fetch('/api/bulletins/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulletinText: pasteText,
          hipodrom: detectedHipo,
          date: selectedDate,
          programType: "1. Altılı Ganyan"
        })
      });

      if (res.ok) {
        const data = await res.json();
        const finalHipo = data.hipodrom || detectedHipo;
        if (finalHipo && finalHipo !== activeHipodrom) {
          setActiveHipodrom(finalHipo);
          if (onHipodromChange) {
            onHipodromChange(finalHipo);
          }
        }

        if (data.selectedRaces && data.selectedRaces.length > 0) {
          if (onRacesExtracted) {
            onRacesExtracted(data.selectedRaces);
          }
          setPasteFeedback(`✅ ${finalHipo} Hipodromu (${data.selectedRaces.length} Koşu) başarıyla aktarıldı!`);
          setTimeout(() => {
            setShowPasteModal(false);
            setPasteText('');
            setPasteFeedback(null);
          }, 1200);
        } else {
          setPasteFeedback("⚠️ Metinden koşu tespit edilemedi, lütfen formatı kontrol edin.");
        }
      } else {
        setPasteFeedback("❌ Ayrıştırma hatası oluştu.");
      }
    } catch (e: any) {
      setPasteFeedback("❌ Ayrıştırma hatası: " + (e?.message || 'Bilinmeyen hata'));
    } finally {
      setIsParsingPaste(false);
    }
  };

  // Dynamic Race Sim Presets with Realistic Turkey Track Physics
  const dynamicRaces: RaceSimPreset[] = useMemo(() => {
    const trackDNA = CITY_TRACK_DNA_MAP[activeHipodrom.toUpperCase()] || {
      characteristic: "Dengeli",
      bias: "Dengeli",
      outerPaceAdvantage: 1.0,
      frontRunnerHoldRate: 45
    };

    if (extractedRaces && extractedRaces.length > 0) {
      return extractedRaces.map((r, rIdx) => {
        const dist = r.distance || (1400 + (rIdx % 4) * 200);
        const trType = (r.trackType || (rIdx % 2 === 0 ? 'Kum' : 'Çim')) as 'Çim' | 'Kum' | 'Sentetik';
        
        // Count running styles to dynamically detect real race pace
        let frontCount = 0;

        const rawHorses = (r.horses || []).filter((h: any) => !h.isScratched);
        const horsesList: HorseSimData[] = rawHorses.map((h: any, hIdx: number) => {
          const rawNum = h.no || h.num || hIdx + 1;
          const horseScore = typeof h.score === 'number' ? h.score : 80;
          const hName = (h.name || h.horseName || `Safkan #${rawNum}`).toUpperCase();
          const jName = (h.jockey || h.jockeyName || 'A.SÖZEN').toUpperCase();
          const weightNum = parseFloat(String(h.weight || 56)) || 56;

          // Intelligent Running Style Inferrer
          let assignedStyle: HorseSimData['runningStyle'] = 'Öncü (Stalker)';
          if (h.runningStyle) {
            if (h.runningStyle.includes('Kaçak')) assignedStyle = 'Kaçak (Pace Setter)';
            else if (h.runningStyle.includes('Sprinter') || h.runningStyle.includes('Sprint')) assignedStyle = 'Düzlük Sprintçisi (Late Burst)';
            else if (h.runningStyle.includes('Bekleme')) assignedStyle = 'Bekleme (Closer)';
            else assignedStyle = 'Öncü (Stalker)';
          } else {
            // Heuristic style based on position / index / name notes
            if (hIdx === 0 && rawHorses.length > 3) assignedStyle = 'Kaçak (Pace Setter)';
            else if (hIdx % 4 === 1) assignedStyle = 'Öncü (Stalker)';
            else if (hIdx % 4 === 2) assignedStyle = 'Bekleme (Closer)';
            else assignedStyle = 'Düzlük Sprintçisi (Late Burst)';
          }

          if (assignedStyle === 'Kaçak (Pace Setter)') frontCount++;

          // Physics ratings scaled proportionally with genuine form and weight
          const weightPenalty = Math.max(-5, Math.min(5, (56 - weightNum) * 0.8));
          const baseSpeed = 76 + (horseScore * 0.18) + weightPenalty;
          const baseStamina = 74 + (horseScore * 0.17) + (dist > 1800 ? 5 : -2);
          const trackBias = (trackDNA as any).bias || (trackDNA as any).characteristics || '';
          const baseTurn = 75 + (horseScore * 0.16) + (String(trackBias).includes('İç') ? 4 : 0);
          const baseBurst = 75 + (horseScore * 0.2) + (dist <= 1400 ? 4 : 0);

          return {
            no: rawNum,
            name: hName,
            jockey: jName,
            weight: weightNum,
            runningStyle: assignedStyle,
            speedRating: Math.round(Math.min(99, Math.max(65, baseSpeed))),
            staminaRating: Math.round(Math.min(99, Math.max(65, baseStamina))),
            turnRating: Math.round(Math.min(99, Math.max(65, baseTurn))),
            burstRating: Math.round(Math.min(99, Math.max(65, baseBurst))),
            peakSpeedKmh: Number((62.0 + (horseScore * 0.05) + ((hIdx * 0.4) % 2.5)).toFixed(1)),
            kombScore: Number((horseScore > 50 ? horseScore : (78.0 + ((hIdx * 3.1) % 18.0))).toFixed(1)),
            color: HORSE_COLORS[hIdx % HORSE_COLORS.length],
            isScratched: Boolean(h.isScratched),
            handicap: h.handicap || (50 + (hIdx * 4) % 40),
            odds: h.odds || (h.ganyan ? parseFloat(h.ganyan) : undefined),
            agf: h.agf ? parseFloat(h.agf) : (h.agfRatio ? h.agfRatio * 100 : undefined)
          };
        });

        // Determine expected race pace
        let paceExpected: RaceSimPreset['paceExpected'] = 'Dengeli & Taktiksel';
        if (frontCount >= 2) paceExpected = 'Çok Süratli (Tandoğan Temposu)';
        else if (frontCount === 0 || (frontCount === 1 && horsesList.length >= 6)) paceExpected = 'Rölanti / Ağır Tempo';

        return {
          raceNo: r.raceNo || rIdx + 1,
          raceTitle: r.raceTitle || r.title || `${r.raceNo || rIdx + 1}. Koşu — ${activeHipodrom}`,
          distance: dist,
          trackType: trType,
          trackCondition: r.trackCondition || r.condition || 'Normal (1.1)',
          paceExpected,
          horses: horsesList.length > 0 ? horsesList : [
            { no: 1, name: 'BABA ŞAHİN', jockey: 'A.SÖZEN', weight: 58, runningStyle: 'Kaçak (Pace Setter)', speedRating: 92, staminaRating: 84, turnRating: 86, burstRating: 82, peakSpeedKmh: 64.8, kombScore: 89.5, color: '#F59E0B' },
            { no: 2, name: 'GOLDEN SPUR', jockey: 'H.KARATAŞ', weight: 57, runningStyle: 'Öncü (Stalker)', speedRating: 89, staminaRating: 90, turnRating: 92, burstRating: 88, peakSpeedKmh: 65.1, kombScore: 92.4, color: '#06B6D4' },
            { no: 3, name: 'TURBO JET', jockey: 'G.KOCAKAYA', weight: 56, runningStyle: 'Düzlük Sprintçisi (Late Burst)', speedRating: 91, staminaRating: 95, turnRating: 90, burstRating: 97, peakSpeedKmh: 66.2, kombScore: 95.0, color: '#10B981' }
          ]
        };
      });
    }

    // Default Fallback
    return [
      {
        raceNo: 1,
        raceTitle: `1. Koşu — ${activeHipodrom} (Şartlı-4)`,
        distance: 1400,
        trackType: 'Kum',
        trackCondition: 'Normal (1.1)',
        paceExpected: 'Çok Süratli (Tandoğan Temposu)',
        horses: [
          { no: 1, name: 'BABA ŞAHİN', jockey: 'A.SÖZEN', weight: 58, runningStyle: 'Kaçak (Pace Setter)', speedRating: 92, staminaRating: 84, turnRating: 86, burstRating: 82, peakSpeedKmh: 64.8, kombScore: 89.5, color: '#F59E0B' },
          { no: 2, name: 'SILVER ARROW', jockey: 'A.ÇELİK', weight: 59, runningStyle: 'Öncü (Stalker)', speedRating: 93, staminaRating: 81, turnRating: 88, burstRating: 83, peakSpeedKmh: 65.3, kombScore: 91.0, color: '#06B6D4' },
          { no: 3, name: 'BLACK TORNADO', jockey: 'G.KOCAKAYA', weight: 58, runningStyle: 'Düzlük Sprintçisi (Late Burst)', speedRating: 91, staminaRating: 96, turnRating: 91, burstRating: 98, peakSpeedKmh: 66.5, kombScore: 95.8, color: '#10B981' },
          { no: 4, name: 'DARK KNIGHT', jockey: 'M.AKYAVUZ', weight: 57, runningStyle: 'Bekleme (Closer)', speedRating: 88, staminaRating: 91, turnRating: 87, burstRating: 92, peakSpeedKmh: 64.5, kombScore: 90.5, color: '#EC4899' },
          { no: 5, name: 'ROYAL VICTORY', jockey: 'Ö.YILDIRIM', weight: 56, runningStyle: 'Bekleme (Closer)', speedRating: 86, staminaRating: 89, turnRating: 84, burstRating: 89, peakSpeedKmh: 63.9, kombScore: 88.2, color: '#8B5CF6' }
        ]
      }
    ];
  }, [extractedRaces, activeHipodrom]);

  const [selectedRaceIdx, setSelectedRaceIdx] = useState<number>(0);
  const activeRace = dynamicRaces[selectedRaceIdx] || dynamicRaces[0];

  // 🎲 Background Monte Carlo 10,000 Iteration Engine (Cached for AI Chat Transfer)
  const monteCarloData = useMemo(() => {
    if (!activeRace || !activeRace.horses || activeRace.horses.length === 0) {
      return null;
    }
    const horseInputs = activeRace.horses.map((h) => ({
      no: h.no,
      name: h.name,
      jockey: h.jockey,
      weight: Number(h.weight) || 56,
      handicap: h.handicap || 75,
      sire: 'TOROK',
      dam: 'MISS TURKEY',
      runningStyle: (h.runningStyle.includes('Kaçak') ? 'Kaçak' : (h.runningStyle.includes('Sprint') ? 'Sprinter' : 'Genel')) as any,
      agfPercent: h.agf || Math.round(100 / activeRace.horses.length)
    }));

    return runMonteCarloRaceSimulation(horseInputs, {
      distance: activeRace.distance || 1400,
      trackType: activeRace.trackType,
      trackCondition: 'Normal',
      hoursUntilRace: 5,
      iterations: 10000
    });
  }, [activeRace]);

  // Race Distance & Meter Steps
  const raceDistance = activeRace ? activeRace.distance : 1400;
  
  // Continuous Timeline Meter Range (from 100m to raceDistance)
  const [currentMeters, setCurrentMeters] = useState<number>(200);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<any>(null);

  // Reset timeline when changing active race
  useEffect(() => {
    setCurrentMeters(200);
    setIsPlaying(false);
  }, [selectedRaceIdx, activeRace?.distance]);

  // Unified Dynamic Position & Speed Calculation with Real Split Metrics
  const unifiedRaceRows = useMemo(() => {
    if (!activeRace || !activeRace.horses) return [];

    const isEarly = currentMeters <= 600;
    const isMiddle = currentMeters > 600 && currentMeters <= raceDistance - 400;
    const isLate = currentMeters > raceDistance - 400;
    const isPota = currentMeters >= raceDistance;

    const horsesWithSim = activeRace.horses.map((horse) => {
      let meterPower = 0;
      let statusSignal: 'ÖNDE SOLUYOR' | 'TEMPOSU DÜZENLİ' | 'ARKADAN GELİYOR' | 'ZİRVE SPRİNT' | 'LİDERLİK MÜCADELESİ' = 'TEMPOSU DÜZENLİ';

      if (horse.runningStyle.includes('Kaçak')) {
        if (isEarly) {
          meterPower = horse.speedRating * 1.28 + 16;
          statusSignal = 'LİDERLİK MÜCADELESİ';
        } else if (isMiddle) {
          meterPower = horse.speedRating * 1.05 + horse.staminaRating * 0.2;
          statusSignal = 'TEMPOSU DÜZENLİ';
        } else {
          // If high pace, front runners fade
          const fatigueDrop = activeRace.paceExpected.includes('Çok Süratli') ? 14 : 7;
          meterPower = horse.speedRating * 0.72 + horse.staminaRating * 0.28 - fatigueDrop;
          statusSignal = 'ÖNDE SOLUYOR';
        }
      } else if (horse.runningStyle.includes('Öncü')) {
        if (isEarly) {
          meterPower = horse.speedRating * 1.1 + 8;
          statusSignal = 'TEMPOSU DÜZENLİ';
        } else if (isMiddle) {
          meterPower = horse.speedRating * 1.12 + horse.turnRating * 0.22;
          statusSignal = 'LİDERLİK MÜCADELESİ';
        } else {
          meterPower = horse.speedRating * 0.96 + horse.staminaRating * 0.32;
          statusSignal = 'TEMPOSU DÜZENLİ';
        }
      } else if (horse.runningStyle.includes('Bekleme')) {
        if (isEarly) {
          meterPower = horse.speedRating * 0.82 - 6;
          statusSignal = 'TEMPOSU DÜZENLİ';
        } else if (isMiddle) {
          meterPower = horse.speedRating * 0.96 + horse.staminaRating * 0.22;
          statusSignal = 'ARKADAN GELİYOR';
        } else {
          meterPower = horse.burstRating * 1.18 + horse.staminaRating * 0.26 + 12;
          statusSignal = 'ZİRVE SPRİNT';
        }
      } else {
        // Düzlük Sprintçisi (Late Burst)
        if (isEarly) {
          meterPower = horse.speedRating * 0.72 - 12;
          statusSignal = 'TEMPOSU DÜZENLİ';
        } else if (isMiddle) {
          meterPower = horse.speedRating * 0.86 + horse.turnRating * 0.22;
          statusSignal = 'ARKADAN GELİYOR';
        } else {
          meterPower = horse.burstRating * 1.38 + horse.staminaRating * 0.16 + 18;
          statusSignal = 'ZİRVE SPRİNT';
        }
      }

      const instantSpeed = Number(
        (horse.peakSpeedKmh * (0.86 + (meterPower / 240))).toFixed(1)
      );

      // Instant split time calculation (seconds elapsed)
      const avgSpeedMs = (instantSpeed * 1000) / 3600;
      const splitTimeSec = Number((currentMeters / Math.max(12, avgSpeedMs)).toFixed(2));

      return {
        ...horse,
        meterPower,
        statusSignal,
        instantSpeed,
        splitTimeSec
      };
    });

    // Sort descending by instantaneous power
    horsesWithSim.sort((a, b) => b.meterPower - a.meterPower);

    const leaderPower = horsesWithSim[0]?.meterPower || 100;
    const lowestPower = horsesWithSim[horsesWithSim.length - 1]?.meterPower || 50;
    const powerRange = Math.max(15, leaderPower - lowestPower);

    return horsesWithSim.map((h, rankIdx) => {
      const diff = leaderPower - h.meterPower;
      let gapText = 'LİDER';
      if (rankIdx > 0) {
        if (diff < 1.2) gapText = 'Burun';
        else if (diff < 2.5) gapText = 'Boyun';
        else if (diff < 5.0) gapText = 'Yarım Boy';
        else if (diff < 10.0) gapText = '1.5 Boy';
        else if (diff < 18.0) gapText = '3.5 Boy';
        else gapText = `${(diff / 4.2).toFixed(1)} Boy`;
      }

      // Progress bar fill % (relative to leader: leader is ~96%, others step back)
      const progressPercent = Math.max(10, Math.min(97, 96 - (diff / powerRange) * 58));

      // 2D Track coordinates for Oval Radar View (Angle 0 to 2*PI)
      const trackProgress = currentMeters / raceDistance;
      const angle = (trackProgress * Math.PI * 1.8) - Math.PI / 2;
      const laneOffset = 18 + rankIdx * 5; // Lane 1 inside, others wider
      const radarX = 50 + (38 - laneOffset * 0.2) * Math.cos(angle);
      const radarY = 50 + (32 - laneOffset * 0.15) * Math.sin(angle);

      return {
        ...h,
        currentRank: rankIdx + 1,
        gapText,
        progressPercent,
        radarX,
        radarY
      };
    });
  }, [activeRace, currentMeters, raceDistance]);

  // Smooth Animation Engine (Continuous Timeline Progression)
  useEffect(() => {
    if (isPlaying) {
      const stepSize = Math.max(25, Math.round(raceDistance / 35));
      timerRef.current = setInterval(() => {
        setCurrentMeters((prev) => {
          if (prev >= raceDistance) {
            setIsPlaying(false);
            if (soundEnabled) raceAudio.playFinishBell();
            return raceDistance;
          }
          if (soundEnabled && Math.random() > 0.4) {
            raceAudio.playGallopRhythm(playbackSpeed);
          }
          return Math.min(raceDistance, prev + stepSize);
        });
      }, 360 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, raceDistance, playbackSpeed, soundEnabled]);

  const handlePlayToggle = () => {
    if (currentMeters >= raceDistance) {
      setCurrentMeters(200);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMeters(200);
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    try {
      localStorage.setItem('turbo10x_sim_sound', JSON.stringify(nextVal));
    } catch {}
  };

  // 🤖 1-Click Bridge: Transfer Live Simulation + Hidden Monte Carlo Insights to AI Chat
  const handleSendProjectionToAi = () => {
    const leader = unifiedRaceRows[0];
    const second = unifiedRaceRows[1];
    const closers = unifiedRaceRows.filter(h => h.statusSignal === 'ZİRVE SPRİNT' || h.statusSignal === 'ARKADAN GELİYOR');
    const faders = unifiedRaceRows.filter(h => h.statusSignal === 'ÖNDE SOLUYOR');
    const topMonteCarlo = monteCarloData?.winnerRecommendation;

    const promptText = `🎙️ **CANLI YARIŞ PROJEKSİYONU & 10.000 MONTE CARLO DİNAMİĞİ AKTARIMI**\n` +
      `📅 **Tarih:** ${selectedDate} | **Hipodrom:** ${activeHipodrom} | **Koşu:** ${activeRace.raceNo}. Koşu (${activeRace.distance}m ${activeRace.trackType})\n` +
      `⏱️ **Tempo Analizi:** ${monteCarloData?.paceScenario.paceType || activeRace.paceExpected} (${monteCarloData?.paceScenario.analysis || ''})\n\n` +
      `📊 **Canlı Metre Simülasyonu Bulguları:**\n` +
      `• **Fotofiniş Lideri:** #${leader?.no} ${leader?.name} (${leader?.jockey}, Anlık Hız: ${leader?.instantSpeed} km/s, KOMB: ${leader?.kombScore})\n` +
      `• **İlk Virajı Önde Dönenler:** #${leader?.no} ${leader?.name} ve #${second?.no} ${second?.name}\n` +
      `• **🚀 Düzlükte 'ARKADAN GELİYOR / ZİRVE SPRİNT' Patlaması Yapanlar:** ${closers.map(c => `#${c.no} ${c.name} (${c.jockey})`).join(', ') || 'Yok'}\n` +
      `• **⚠️ Son Düzlükte 'ÖNDE SOLUYOR' Sinyali Veren Kaçaklar (Sahte Favori Riski):** ${faders.map(f => `#${f.no} ${f.name}`).join(', ') || 'Yok'}\n` +
      `• **🎲 10.000 Monte Carlo Hakem Favorisi:** #${topMonteCarlo?.no || leader?.no} ${topMonteCarlo?.name || leader?.name} (Hakem Puanı: ${topMonteCarlo?.arbitratedScore || 90}P)\n\n` +
      `🎯 **TALEP:** Bu split dinamiklerini, kaçakların yıpranmasını ve sprint avantajlarını baz alarak ${activeHipodrom} programı için bütçe korumalı, çakışmasız bankolu tek kupon kurgusunu oluştur.`;

    if (onSendToAiChat) {
      onSendToAiChat(promptText);
    } else if (onOpenAiChat) {
      onOpenAiChat();
    }
  };

  const topPickRunner = unifiedRaceRows[0];
  const sleeperPickRunner = unifiedRaceRows.find(h => h.statusSignal === 'ZİRVE SPRİNT' && h.currentRank > 1) || unifiedRaceRows[1];

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full space-y-4 text-[#E0E0E0] pb-24 animate-fadeIn">
      
      {/* 1. COMPACT TOP HEADER & QUICK CITY BAR */}
      <div className="bg-[#151720] border border-[#242836] rounded-2xl p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202432] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 shadow-md">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>CANLI YARIŞ PROJEKSİYONU & TRAKUS MOTORU</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                    v4.5 Canlı Split
                  </span>
                </h2>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-1 rounded-full text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
                  title="Strateji ve Bilgi Notu"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: Sound + Paste + Live Sync */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-[#181A24] border-[#262C3A] text-slate-500'
              }`}
              title={soundEnabled ? 'Pist Sesini Kapat' : 'Pist Sesini Aç'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D212C] hover:bg-[#262C3A] border border-[#2F3648] text-slate-300 text-xs font-bold transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Bülten Yapıştır</span>
            </button>

            <button
              onClick={() => fetchLiveTjkData(activeHipodrom)}
              disabled={isSyncingLive}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span>{isSyncingLive ? 'Çekiliyor...' : 'TJK Canlı Çek'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatusText && (
          <div className="mt-2 py-1.5 px-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{syncStatusText}</span>
          </div>
        )}

        {/* Compact Hipodrom Tabs */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase mr-1 flex items-center gap-1 shrink-0">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Hipodrom:</span>
          </span>
          {PROMINENT_CITIES.map((city) => {
            const isSelected = activeHipodrom.toUpperCase() === city;
            return (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-[#181A24] hover:bg-[#222736] text-slate-400 hover:text-white border border-[#242836]'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. RACE SELECTOR TABS & VIEW MODE TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 bg-[#12141C] p-1 rounded-xl border border-[#222634]">
          {dynamicRaces.map((race, idx) => {
            const isSel = idx === selectedRaceIdx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedRaceIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A1E2A]'
                }`}
              >
                <span>{race.raceNo}. Koşu</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  isSel ? 'bg-slate-950/30 text-slate-950' : 'bg-[#181A22] text-slate-500'
                }`}>
                  {race.distance}m {race.trackType}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher + AI Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#12141C] p-0.5 rounded-xl border border-[#222634] text-xs">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'detailed'
                  ? 'bg-[#252B3C] text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kulvar & Güç
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'radar'
                  ? 'bg-[#252B3C] text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Radar Pist
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'matrix'
                  ? 'bg-[#252B3C] text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              10K Monte Carlo
            </button>
          </div>
        </div>
      </div>

      {/* 3. STICKY TACTICAL HEADER (ANLIK LİDER & ZİRVE SPRİNT / TEHDİT) */}
      <div className="sticky top-2 z-30 bg-[#141620]/95 backdrop-blur-md rounded-2xl border border-[#242836] p-2 sm:p-2.5 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="p-2 rounded-xl bg-[#10121A] border border-[#202434] flex items-center gap-2.5 min-w-0">
          <Award className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="truncate flex-1">
            <span className="text-[9px] text-slate-500 uppercase block font-black tracking-wider">Anlık Lider</span>
            <span className="font-extrabold text-white text-xs truncate block">
              #{topPickRunner?.no} {topPickRunner?.name} <span className="text-slate-400 text-[10px] font-normal">({topPickRunner?.jockey})</span>
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-[#10121A] border border-[#202434] flex items-center gap-2.5 min-w-0">
          <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate flex-1">
            <span className="text-[9px] text-slate-500 uppercase block font-black tracking-wider">Zirve Sprint / Tehdit</span>
            <span className="font-extrabold text-emerald-300 text-xs truncate block">
              #{sleeperPickRunner?.no} {sleeperPickRunner?.name} <span className="text-emerald-400/70 text-[10px] font-normal">({sleeperPickRunner?.jockey})</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. KOMPAKT OYNATICI (PLAYER) & TIMELINE */}
      <div className="bg-[#141620] border border-[#242836] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-lg">
        {/* Race Summary Line */}
        <div className="flex items-center justify-between text-xs border-b border-[#1E222E] pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-extrabold text-[10px] border border-amber-500/30">
              {activeRace.raceNo}. KOŞU
            </span>
            <span className="font-extrabold text-white text-xs sm:text-sm">
              {activeRace.raceTitle}
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              ({activeRace.distance}m {activeRace.trackType} • {activeRace.paceExpected})
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">Konum:</span>
            <span className="font-black text-amber-400">{currentMeters}m</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{raceDistance}m</span>
            {currentMeters >= raceDistance && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40 animate-pulse">
                🏁 FOTO FİNİŞ
              </span>
            )}
          </div>
        </div>

        {/* Compact Player Controls + Slider Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Play / Pause / Reset / Sonuca Git */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePlayToggle}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all shadow-md active:scale-95"
              title={isPlaying ? 'Durdur' : 'Oynat'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#1C202C] hover:bg-[#252B3C] border border-[#2F374A] text-slate-300 transition-all active:scale-95"
              title="Başa Al"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Simülasyonu Tamamla / Sonuca Git Butonu */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentMeters(raceDistance);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] shadow-sm transition-all active:scale-95 shrink-0"
              title="Animasyonu atla ve doğrudan fotofiniş sonucuna git"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>Sonuca Git</span>
            </button>
          </div>

          {/* Sleek Scrubbing Timeline Slider */}
          <div className="flex-1 w-full flex flex-col justify-center space-y-1">
            <div className="relative flex items-center">
              <input
                type="range"
                min={100}
                max={raceDistance}
                step={25}
                value={currentMeters}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentMeters(Number(e.target.value));
                }}
                className="w-full h-2 bg-[#0E1017] rounded-lg appearance-none cursor-pointer accent-amber-500 border border-[#222736] focus:outline-none"
              />
            </div>

            {/* Milestone Labels */}
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Start (0m)</span>
              <span>{Math.round(raceDistance * 0.4)}m İlk Viraj</span>
              <span>{Math.round(raceDistance * 0.75)}m Son Düzlük</span>
              <span className="text-amber-400 font-bold">Pota ({raceDistance}m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DYNAMIC VIEW: 2D RADAR vs DETAILED TRACK vs MONTE CARLO */}
      {viewMode === 'radar' && (
        <div className="bg-[#141620] border border-[#242836] rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[#202434]">
            <span className="font-extrabold text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>2D REALİSTİK HİPODROM RADAR GÖRÜNÜMÜ ({activeHipodrom})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Oval Pist Simülasyonu
            </span>
          </div>

          {/* SVG Canvas for Track Simulation */}
          <div className="relative w-full aspect-[2/1] sm:aspect-[2.5/1] bg-[#0C0E14] border border-[#1F2332] rounded-xl overflow-hidden flex items-center justify-center p-4">
            {/* Oval Track Lines */}
            <div className="absolute inset-4 rounded-[60px] border-4 border-amber-900/30 bg-[#12151E]" />
            <div className="absolute inset-10 rounded-[40px] border-2 border-dashed border-slate-700/40 bg-[#0E1017] flex items-center justify-center">
              <div className="text-center space-y-1">
                <div className="text-[10px] font-black text-slate-500 tracking-wider">
                  {activeHipodrom} PİSTİ
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {currentMeters}m / {raceDistance}m
                </div>
                <div className="text-[9px] text-slate-400">
                  {currentMeters >= raceDistance ? '🏁 KOŞU TAMAMLANDI' : '🏇 YARIŞ SÜRÜYOR'}
                </div>
              </div>
            </div>

            {/* Finish Line Marker */}
            <div className="absolute right-12 top-4 bottom-4 w-1 bg-red-500/80 z-0 flex items-start justify-center">
              <span className="text-[8px] font-mono font-bold px-1 bg-red-600 text-white rounded -rotate-90 origin-bottom">
                FINISH
              </span>
            </div>

            {/* Simulated Running Horses on Track */}
            {unifiedRaceRows.map((horse) => (
              <div
                key={horse.no}
                className="absolute z-10 transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 group cursor-pointer"
                style={{
                  left: `${horse.radarX}%`,
                  top: `${horse.radarY}%`,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 shadow-lg border border-white/50 animate-scaleUp"
                  style={{ backgroundColor: horse.color }}
                >
                  {horse.no}
                </div>
                <div className="hidden group-hover:flex flex-col bg-slate-950/90 border border-slate-700 rounded px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap shadow-xl z-20">
                  <span className="font-bold">{horse.name}</span>
                  <span className="text-cyan-300">{horse.instantSpeed} km/s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'matrix' && (
        <div className="bg-[#141620] border border-[#242836] rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[#202434]">
            <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
              <Dna className="w-4 h-4" />
              <span>10.000 MONTE CARLO İTERASYON & HAKEM MATRİSİ</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Bayesyen Olasılık Skoru
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {monteCarloData?.results?.map((res, rIdx) => {
              const isBest = rIdx === 0;
              return (
                <div
                  key={res.no}
                  className={`p-3 rounded-xl border space-y-2 ${
                    isBest
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                      : 'bg-[#10121A] border-[#202434]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center text-[10px]">
                        {res.no}
                      </span>
                      <span>{res.name}</span>
                    </span>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      %{res.winRatePct} Kazanma
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Hakem Puanı:</span>
                      <strong className="text-white font-mono">{res.arbitratedScore} P</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tabela (İlk 3):</span>
                      <strong className="text-slate-300 font-mono">%{res.top3RatePct}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 italic pt-1 border-t border-[#1E2230]">
                      "{res.chessReasoning.summary}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. UNIFIED DETAILED PROGRESS TRACK TABLE */}
      {viewMode === 'detailed' && (
        <div className="bg-[#141620] border border-[#242836] rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>CANLI PİST KONUMU, HIZ VE KULVAR DİNAMİĞİ</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {currentMeters <= 600 ? '🚦 Start & İlk Hamleler' : currentMeters <= raceDistance - 400 ? '🔄 Son Viraj Dönüşü' : '🏁 Düzlük Sprinti & Fotofiniş'}
            </span>
          </div>

          {/* Unified Horse List with Embedded Dynamic Progress Track - Compact Horizontal View */}
          <div className="space-y-1">
            {unifiedRaceRows.map((horse) => {
              const isFirst = horse.currentRank === 1;
              const isFader = horse.statusSignal === 'ÖNDE SOLUYOR';
              const isCloser = horse.statusSignal === 'ARKADAN GELİYOR' || horse.statusSignal === 'ZİRVE SPRİNT';

              return (
                <div
                  key={horse.no}
                  className={`relative rounded-lg border px-2 py-1.5 overflow-hidden transition-all duration-200 ${
                    isFirst
                      ? 'bg-[#181B26] border-amber-500/50 shadow-sm shadow-amber-500/5'
                      : 'bg-[#12141D] border-[#202432] hover:border-[#2E3646]'
                  }`}
                >
                  {/* Dynamic Background Progress Bar Fill */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 right-0 origin-left transition-transform duration-300 pointer-events-none will-change-transform ${
                      isFirst
                        ? 'bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/20'
                        : isCloser
                        ? 'bg-gradient-to-r from-emerald-500/5 to-emerald-500/15'
                        : isFader
                        ? 'bg-gradient-to-r from-red-500/5 to-red-500/15'
                        : 'bg-gradient-to-r from-cyan-500/5 to-cyan-500/10'
                    }`}
                    style={{ transform: `scaleX(${Math.max(0.08, horse.progressPercent / 100)})` }}
                  />

                  {/* Main Row Content - Ultra Compact */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    
                    {/* Left: Rank Badge + Horse No + Name + Jockey/Weight */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isFirst
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : horse.currentRank === 2
                          ? 'bg-slate-300 text-slate-950 font-bold'
                          : horse.currentRank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-[#1E2230] text-slate-400'
                      }`}>
                        {horse.currentRank}
                      </span>

                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-slate-950 shrink-0"
                        style={{ backgroundColor: horse.color }}
                      >
                        {horse.no}
                      </span>

                      <div className="truncate flex items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-xs text-white truncate">
                          {horse.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate hidden sm:inline">
                          ({horse.jockey} • {horse.weight}kg)
                        </span>
                        <span className="text-[9px] text-slate-500 hidden md:inline truncate">
                          • {horse.runningStyle}
                        </span>
                      </div>
                    </div>

                    {/* Right: Gap, High-Contrast Speed, and Status Signal Tag */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {/* Gap / Margin */}
                      <div className="text-right hidden sm:block">
                        <div className={`text-[11px] font-extrabold font-mono ${isFirst ? 'text-amber-400' : 'text-slate-300'}`}>
                          {horse.gapText}
                        </div>
                      </div>

                      {/* Instant Speed */}
                      <div className="text-right">
                        <div className="text-xs font-black text-cyan-300 font-mono flex items-center gap-0.5">
                          <span>{horse.instantSpeed}</span>
                          <span className="text-[8px] text-cyan-500">km/s</span>
                        </div>
                      </div>

                      {/* Status Signal Badge */}
                      <div className="w-20 sm:w-24 text-right">
                        <span className={`inline-block text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap transition-all ${
                          isFader
                            ? 'bg-red-950/80 text-red-300 border border-red-500/50 animate-pulse'
                            : isCloser
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 animate-pulse'
                            : 'bg-[#181B26] text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {horse.statusSignal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. STICKY BOTTOM ACTION BAR: YAPAY ZEKAYA AKTAR & KURGULA */}
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-auto z-40">
        <button
          onClick={handleSendProjectionToAi}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-2xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all border border-amber-300"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>Bu Koşuyu Yapay Zekaya Aktar & Kurgula</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 7. INFO MODAL (STRATEGY EXPLANATION) */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151720] border border-[#2D3344] rounded-2xl max-w-lg w-full p-5 space-y-3 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#242838] pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Canlı Projeksiyon & Trakus Stratejisi
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p>
                • <strong>Önde Soluyor Uyarısı:</strong> Bir at 200m veya 600m'de lider görünse dahi tempolu kaçak baskısı yüzünden son virajda yorulacaksa, bu at banko yapılmaz ve kurgudan elenir.
              </p>
              <p>
                • <strong>Arkadan Geliyor / Zirve Sprint:</strong> Virajı 4. veya 5. sırada dönüp son 400 metrede KOMB patlaması yapan safkanlar kupona sürpriz tek veya sigorta olarak eklenir.
              </p>
              <p>
                • <strong>10.000 Monte Carlo Motoru:</strong> Arka planda 10.000 koşu simüle edilerek kazanma oranları ve Hakem AI kararları yapay zeka sohbetine otomatik aktarılır.
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. BULLETIN PASTE MODAL */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151720] border border-[#2D3344] rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#242838] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Bülten Kopyala & Yapıştır (Hızlı Ayrıştırma)
                </h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>TJK veya yarış sitelerinden kopyaladığınız bülten metnini yapıştırın:</span>
              {pasteText.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[11px]">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  Algılanan: {detectHipodromFromBulletinText(pasteText, activeHipodrom)}
                </span>
              )}
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Örnek: 1. Koşu 14:00 3 Yaşlı İngilizler 1400m Kum&#10;1 - BABA ŞAHİN (58kg G.KOCAKAYA)..."
              rows={7}
              className="w-full bg-[#0E1017] border border-[#242836] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono resize-none"
            />

            {pasteFeedback && (
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                {pasteFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 rounded-xl bg-[#1E2230] hover:bg-[#282E40] text-slate-300 text-xs font-bold"
              >
                İptal
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={isParsingPaste || !pasteText.trim()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isParsingPaste ? 'Ayrıştırılıyor...' : '🚀 Ayrıştır & Yansıt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

