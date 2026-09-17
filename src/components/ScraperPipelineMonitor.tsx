import React, { useState } from 'react';
import {
  Download,
  Dna,
  Database,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { TjkDailyBulletin, TjkRaceSchedule, TjkRawHorseEntry } from '../services/TjkScraper';
import { ScrapedPedigreeResult } from '../services/PedigreeScraper';
import { ProcessedPipelineRace } from '../services/DataMapper';
import { QuantitativeRaceAnalysisResult } from '../services/QuantitativeRiskEngine';

interface ScraperPipelineMonitorProps {
  onInjectQuantEvaluation?: (result: QuantitativeRaceAnalysisResult) => void;
  selectedHipodrom?: string;
  selectedDate?: string;
}

export const ScraperPipelineMonitor: React.FC<ScraperPipelineMonitorProps> = ({
  onInjectQuantEvaluation,
  selectedHipodrom = 'İSTANBUL',
  selectedDate = new Date().toISOString().split('T')[0]
}) => {
  const [hipodrom, setHipodrom] = useState<string>(selectedHipodrom);
  const [date, setDate] = useState<string>(selectedDate);
  const [isLoadingTjk, setIsLoadingTjk] = useState<boolean>(false);
  const [bulletinData, setBulletinData] = useState<TjkDailyBulletin | null>(null);
  const [selectedRaceIdx, setSelectedRaceIdx] = useState<number>(0);

  // Pedigree Arama State'i
  const [pedigreeSearchName, setPedigreeSearchName] = useState<string>('CANMETE');
  const [isLoadingPedigree, setIsLoadingPedigree] = useState<boolean>(false);
  const [pedigreeResult, setPedigreeResult] = useState<ScrapedPedigreeResult | null>(null);

  // Data Pipeline Çalıştırma State'i
  const [isProcessingPipeline, setIsProcessingPipeline] = useState<boolean>(false);
  const [pipelineResult, setPipelineResult] = useState<ProcessedPipelineRace | null>(null);
  const [pipelineSuccessMsg, setPipelineSuccessMsg] = useState<string | null>(null);

  // 1. TJK Bültenini Çek
  const handleFetchTjkBulletin = async () => {
    setIsLoadingTjk(true);
    setPipelineResult(null);
    setPipelineSuccessMsg(null);
    try {
      const res = await fetch(`/api/scraper/tjk?hipodrom=${encodeURIComponent(hipodrom)}&date=${date}`);
      const data = await res.json();
      if (data.success && data.bulletin) {
        setBulletinData(data.bulletin);
        setSelectedRaceIdx(0);
      } else {
        alert(data.error || 'TJK bülteni alınamadı.');
      }
    } catch (err: any) {
      alert('TJK bağlantı hatası: ' + err.message);
    } finally {
      setIsLoadingTjk(false);
    }
  };

  // 2. PedigreeQuery Soy Ağacını Çek
  const handleFetchPedigree = async (targetName?: string) => {
    const nameToSearch = targetName || pedigreeSearchName;
    if (!nameToSearch.trim()) return;

    setIsLoadingPedigree(true);
    try {
      const res = await fetch(`/api/scraper/pedigree/${encodeURIComponent(nameToSearch.trim())}`);
      const data = await res.json();
      if (data.success && data.pedigree) {
        setPedigreeResult(data.pedigree);
        setPedigreeSearchName(nameToSearch.toUpperCase());
      } else {
        alert(data.error || 'Soy ağacı çekilemedi.');
      }
    } catch (err: any) {
      alert('PedigreeQuery bağlantı hatası: ' + err.message);
    } finally {
      setIsLoadingPedigree(false);
    }
  };

  // 3. Veri Boru Hattını (Data Pipeline) Çalıştır
  const handleRunPipeline = async () => {
    if (!bulletinData || !bulletinData.races || bulletinData.races.length === 0) {
      alert('Önce TJK bülteni çekilmelidir.');
      return;
    }

    const currentRace = bulletinData.races[selectedRaceIdx];
    if (!currentRace) return;

    setIsProcessingPipeline(true);
    setPipelineSuccessMsg(null);
    try {
      const res = await fetch('/api/scraper/pipeline/race', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tjkRace: currentRace,
          paceScenario: 'Moderate'
        })
      });

      const data = await res.json();
      if (data.success && data.processedRace) {
        setPipelineResult(data.processedRace);
        setPipelineSuccessMsg(
          `🎉 ${currentRace.raceNumber}. Koşudaki ${data.persistedCount} safkanın PedigreeQuery soy ağaçları birleştirildi, MongoDB NoSQL dokümanları oluşturuldu ve Kantitatif Risk Motoru çalıştırıldı!`
        );

        if (onInjectQuantEvaluation && data.quantEvaluation) {
          onInjectQuantEvaluation(data.quantEvaluation);
        }
      } else {
        alert(data.error || 'Boru hattı işletilemedi.');
      }
    } catch (err: any) {
      alert('Boru hattı hatası: ' + err.message);
    } finally {
      setIsProcessingPipeline(false);
    }
  };

  const currentRace: TjkRaceSchedule | undefined = bulletinData?.races[selectedRaceIdx];

  return (
    <div id="scraper-pipeline-monitor" className="w-full space-y-6">
      {/* Üst Bilgi ve Savunma Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/80 p-5 rounded-2xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white font-black">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-wide">
                  Turbo 10X Pro Veri Toplama & Scraper Pipeline
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  NetworkManager Koruma Kalkanı Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                TJK Canlı Bülten Scraper + PedigreeQuery Soy Ağacı (Binary Tree) + MongoDB Entegratörü
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Timeout: <strong>9000ms</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Retry: <strong>3x Backoff</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: TJK Scraper (Sol) ve PedigreeQuery Scraper (Sağ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SOL: TJK Canlı Bülten Kazıyıcı */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">TJK Canlı Bülten Kazıyıcı</h3>
            </div>
            {bulletinData && (
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                bulletinData.isScrapedLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {bulletinData.isScrapedLive ? '🟢 Canlı Web Scrape' : '🟡 Güvenli Fallback Verisi'}
              </span>
            )}
          </div>

          {/* Parametre Girişi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Hipodrom:</label>
              <select
                value={hipodrom}
                onChange={(e) => setHipodrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none"
              >
                {['İSTANBUL', 'ANKARA', 'İZMİR', 'ADANA', 'BURSA', 'KOCAELİ', 'ŞANLIURFA', 'DİYARBAKIR', 'ELAZIĞ', 'ANTALYA'].map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Tarih:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                id="btn-fetch-tjk"
                onClick={handleFetchTjkBulletin}
                disabled={isLoadingTjk}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${isLoadingTjk ? 'animate-bounce' : ''}`} />
                {isLoadingTjk ? 'Çekiliyor...' : 'TJK Bültenini Çek'}
              </button>
            </div>
          </div>

          {/* Koşu Seçici Sekmeler */}
          {bulletinData && bulletinData.races && bulletinData.races.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {bulletinData.races.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedRaceIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedRaceIdx === idx
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {r.raceNumber}. Koşu ({r.distance}m {r.surface})
                  </button>
                ))}
              </div>

              {/* Seçili Koşu Detay Tablosu */}
              {currentRace && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="font-extrabold text-white">{currentRace.raceNumber}. Koşu</span>
                      <span className="text-slate-400 ml-2">
                        {currentRace.distance} Metre • {currentRace.surface} ({currentRace.condition})
                      </span>
                    </div>
                    <button
                      id="btn-run-pipeline-race"
                      onClick={handleRunPipeline}
                      disabled={isProcessingPipeline}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isProcessingPipeline ? 'animate-spin' : ''}`} />
                      {isProcessingPipeline ? 'İşleniyor...' : 'Veri Boru Hattını Çalıştır'}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">At İsmi</th>
                          <th className="p-2.5">Orijin (Baba/Anne)</th>
                          <th className="p-2.5">Kilo / Jokey</th>
                          <th className="p-2.5">Form (Son 5)</th>
                          <th className="p-2.5">Ganyan</th>
                          <th className="p-2.5 text-right">Pedigri</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {currentRace.horses.map((horse: TjkRawHorseEntry, hIdx: number) => (
                          <tr key={hIdx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-2.5 font-bold text-white">{horse.horseNo}</td>
                            <td className="p-2.5 font-extrabold text-amber-300">{horse.horseName}</td>
                            <td className="p-2.5 text-slate-400 text-[11px]">
                              {horse.originSire || 'TURBO'} / {horse.originDam || 'MİHRİCAN'}
                            </td>
                            <td className="p-2.5">
                              <span>{horse.weight} kg</span>
                              <span className="text-slate-400 block text-[10px]">{horse.jockeyName}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono">
                                {horse.lastRacesSummary || horse.last5Races?.join('-') || '1-2-3'}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-emerald-400">
                              {horse.marketOdds ? `${horse.marketOdds.toFixed(2)}` : '3.50'}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleFetchPedigree(horse.horseName)}
                                className="px-2 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[10px] font-semibold transition-all inline-flex items-center gap-1"
                              >
                                <Dna className="w-3 h-3" />
                                Soy Ağacı
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SAĞ: PedigreeQuery Soy Ağacı (Binary Tree) Kazıyıcı & Görüntüleyici */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">PedigreeQuery Soy Ağacı Kazıyıcı</h3>
              </div>
              {pedigreeResult && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  pedigreeResult.isLiveScraped ? 'bg-emerald-500/20 text-emerald-300' : 'bg-pink-500/20 text-pink-300'
                }`}>
                  {pedigreeResult.isLiveScraped ? '🟢 Canlı Web Scrape' : '🟣 Yerel Soy Bilgisi'}
                </span>
              )}
            </div>

            {/* At Adı Arama */}
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={pedigreeSearchName}
                  onChange={(e) => setPedigreeSearchName(e.target.value)}
                  placeholder="At Adı Girin (Örn: CANMETE, TURBO, TOROK)"
                  className="w-full px-3.5 py-2 pl-9 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:border-pink-500 focus:outline-none uppercase"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
              <button
                id="btn-fetch-pedigree"
                onClick={() => handleFetchPedigree()}
                disabled={isLoadingPedigree}
                className="py-2 px-3.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-pink-600/20 active:scale-95 disabled:opacity-50"
              >
                <Dna className={`w-3.5 h-3.5 ${isLoadingPedigree ? 'animate-spin' : ''}`} />
                {isLoadingPedigree ? 'Aranıyor...' : 'Soy Ağacı Çek'}
              </button>
            </div>

            {/* Pedigri Sonuç Kartı ve Dozaj Göstergesi */}
            {pedigreeResult ? (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{pedigreeResult.horseName}</h4>
                    <p className="text-[11px] text-slate-400">
                      Ülke: {pedigreeResult.country || 'TUR'} • Doğum: {pedigreeResult.birthYear || '2019'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-300">
                      DI: {pedigreeResult.dosageIndex.di.toFixed(2)} | CD: {pedigreeResult.dosageIndex.cd.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      DP: {pedigreeResult.dosageIndex.profile?.brilliant}-{pedigreeResult.dosageIndex.profile?.intermediate}-{pedigreeResult.dosageIndex.profile?.classic}-{pedigreeResult.dosageIndex.profile?.solid}-{pedigreeResult.dosageIndex.profile?.professional}
                    </div>
                  </div>
                </div>

                {/* Binary Tree Görsel Şeması */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Hiyerarşik Soy Ağacı (Binary Tree):</div>
                  
                  {/* Baba (Sire) Kökü */}
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/50 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-300">BABA</span>
                    <div className="text-xs">
                      <strong className="text-white">{pedigreeResult.sireName || pedigreeResult.binaryTree.sire?.name || 'Bilinmiyor'}</strong>
                      {pedigreeResult.binaryTree.sire?.sire && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 text-blue-400" />
                          <span>Dede (Sire Sire): {pedigreeResult.binaryTree.sire.sire.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anne (Dam) Kökü */}
                  <div className="p-2.5 rounded-lg bg-pink-950/30 border border-pink-900/50 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-pink-500/20 text-pink-300">ANNE</span>
                    <div className="text-xs">
                      <strong className="text-white">{pedigreeResult.damName || pedigreeResult.binaryTree.dam?.name || 'Bilinmiyor'}</strong>
                      {pedigreeResult.binaryTree.dam?.sire && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 text-pink-400" />
                          <span>Anne Babası (BMS): {pedigreeResult.binaryTree.dam.sire.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-6 text-center bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-xs">
                Herhangi bir atın soy ağacı ve dozaj endekslerini görmek için yukarıdan sorgulama yapın veya TJK bültenindeki bir ata tıklayın.
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-[11px] text-indigo-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                DataMapper, çekilen tüm soy ağaçlarını MongoDB <code>PedigreeGraphNode</code> koleksiyonuna senkronize eder.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🧠 RLHF HATA GERİ BİLDİRİM DÖNGÜSÜ & CANLI PADOK KULİS MERKEZİ */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">RLHF Aktif Öğrenme & Canlı Padok / Kulis Kontrol Merkezi</h3>
              <p className="text-xs text-slate-400">Post-Mortem Brier Score & Çapraz Entropi Hata Analizi + Kaos Kalkanı</p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/tjk/run-rlhf-learning-cycle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ hipodrom, date })
                });
                const data = await res.json();
                if (data.success) {
                  alert(data.message);
                }
              } catch (e: any) {
                alert('RLHF döngüsü hatası: ' + e.message);
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Otonom RLHF Öğrenme Döngüsünü Tetikle</span>
          </button>
        </div>

        {/* Canlı Padok Girişi */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Canlı Padok / Kulis Duyumu Girişi (Anlık AHP Katsayı Modifikasyonu)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Koşu No:</label>
              <input
                id="pad-race-no"
                type="number"
                defaultValue={1}
                min={1}
                max={10}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">At No veya İsmi:</label>
              <input
                id="pad-horse"
                type="text"
                placeholder="Örn: 4 veya SHINING GLORY"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Padok Gözlemi / Kulis Notu:</label>
              <input
                id="pad-obs"
                type="text"
                placeholder="Örn: Padokta terliyor / Kulaklık takıldı / Ahırdan kesin talimat"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={async () => {
                  const raceNo = (document.getElementById('pad-race-no') as HTMLInputElement)?.value;
                  const horseNoOrName = (document.getElementById('pad-horse') as HTMLInputElement)?.value;
                  const observation = (document.getElementById('pad-obs') as HTMLInputElement)?.value;
                  if (!horseNoOrName || !observation) {
                    alert('Lütfen at ismi/no ve padok gözlemini girin.');
                    return;
                  }
                  try {
                    const res = await fetch('/api/tjk/paddock-input', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ hipodrom, raceNo, horseNoOrName, observation, modifier: 'POZITIF_SINYAL' })
                    });
                    const d = await res.json();
                    if (d.success) {
                      alert(`✅ Padok notu (${horseNoOrName}) kaydedildi ve katsayı matrisine dahil edildi!`);
                      (document.getElementById('pad-horse') as HTMLInputElement).value = '';
                      (document.getElementById('pad-obs') as HTMLInputElement).value = '';
                    }
                  } catch (err: any) {
                    alert('Padok kaydı hatası: ' + err.message);
                  }
                }}
                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                📡 Matrise İşle
              </button>
            </div>
          </div>
        </div>

        {/* 🌟 4 İLERİ DÜZEY MODÜL KONTROL MERKEZİ (TURBO 10X PROTOCOL) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* 1. Track Bias & Pist Kalibrasyonu */}
          <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>1. Track Bias (Hava & Pist Kalibrasyonu)</span>
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">E.İ.D. Anomali</span>
            </div>
            <p className="text-[11px] text-slate-400">İlk 3-4 koşudaki derece sapmalarını ve iç kulvar avantajını sonraki ayaklara uygula.</p>
            <div className="flex gap-2">
              <input
                id="tb-summary"
                type="text"
                placeholder="Örn: İç kulvar akıcı, kaçaklar %25 avantajlı"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <button
                onClick={async () => {
                  const summary = (document.getElementById('tb-summary') as HTMLInputElement)?.value;
                  try {
                    const res = await fetch('/api/turbo/track-bias', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ hipodrom, summary: summary || 'Pist hızlı, ön grup avantajı aktif.', leaderMultiplier: 1.25, closerMultiplier: 0.90 })
                    });
                    const d = await res.json();
                    if (d.success) alert(d.message);
                  } catch (e: any) { alert(e.message); }
                }}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                Kalibre Et
              </button>
            </div>
          </div>

          {/* 2. JSI Jokey-Antrenör Sinerjisi */}
          <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>2. Jokey-Antrenör Sinerji İndeksi (JSI)</span>
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Şartlı-1 & Gizli Güç</span>
            </div>
            <p className="text-[11px] text-slate-400">Şartlı-1 ve Maiden koşularda jokey-ahır ortaklığı sinerji puanı.</p>
            <div className="flex gap-2">
              <input
                id="jsi-jock"
                type="text"
                placeholder="Jokey: G.KOCAKAYA"
                className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
              <input
                id="jsi-train"
                type="text"
                placeholder="Antrenör: H.KARATAŞ"
                className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
              <button
                onClick={async () => {
                  const jockey = (document.getElementById('jsi-jock') as HTMLInputElement)?.value;
                  const trainer = (document.getElementById('jsi-train') as HTMLInputElement)?.value;
                  if (!jockey || !trainer) { alert('Jokey ve Antrenör girin.'); return; }
                  try {
                    const res = await fetch('/api/turbo/jsi', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ jockey, trainer, winRate: 50, synergyScore: 20 })
                    });
                    const d = await res.json();
                    if (d.success) alert(d.message);
                  } catch (e: any) { alert(e.message); }
                }}
                className="flex-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg"
              >
                JSI Kaydet
              </button>
            </div>
          </div>

          {/* 3. Negatif Öğrenme & Red Flag */}
          <div className="p-4 bg-slate-950/80 border border-rose-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>3. Negatif Öğrenme Filtresi (Red Flags)</span>
              </span>
              <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">Hata Önleme</span>
            </div>
            <p className="text-[11px] text-slate-400">Startta kalma, ağır kilo çöküşü ve tempo intiharlarını kural olarak kaydet.</p>
            <div className="flex gap-2">
              <input
                id="rf-horse"
                type="text"
                placeholder="Safkan: ŞİŞİRİLMİŞ FAVORİ"
                className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
              <button
                onClick={async () => {
                  const horseName = (document.getElementById('rf-horse') as HTMLInputElement)?.value;
                  if (!horseName) { alert('Safkan adı girin.'); return; }
                  try {
                    const res = await fetch('/api/turbo/red-flags', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ horseName, flagType: 'HEAVY_WEIGHT_FAILURE', causeDescription: 'Ağır sıklet ve erken pres riski.', penaltyPoints: -18 })
                    });
                    const d = await res.json();
                    if (d.success) alert(d.message);
                  } catch (e: any) { alert(e.message); }
                }}
                className="flex-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
              >
                Red Flag Ekle
              </button>
            </div>
          </div>

          {/* 4. Piyasa & Ahır Hareketi (Smart Money) */}
          <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>4. Piyasa & Ahır Hareketi (Smart Money)</span>
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Erken Bahis Volatilitesi</span>
            </div>
            <p className="text-[11px] text-slate-400">Sabah ganyanından sert düşüş yaşayan değerli fısıltıları veya yapay şişirmeleri yakala.</p>
            <div className="flex gap-2">
              <input
                id="sm-horse"
                type="text"
                placeholder="Safkan: 4 SHINING GLORY"
                className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
              <button
                onClick={async () => {
                  const horseName = (document.getElementById('sm-horse') as HTMLInputElement)?.value;
                  if (!horseName) { alert('Safkan adı girin.'); return; }
                  try {
                    const res = await fetch('/api/turbo/smart-money', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ hipodrom, horseName, morningOdds: 12.0, currentOdds: 4.2, classification: 'DEGERLI_FISILTI', details: 'Sabah oranlarından sert düşüş, organize ahır alımı.' })
                    });
                    const d = await res.json();
                    if (d.success) alert(d.message);
                  } catch (e: any) { alert(e.message); }
                }}
                className="flex-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
              >
                Smart Money Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Boru Hattı Başarı Bildirimi */}
      {pipelineSuccessMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{pipelineSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ScraperPipelineMonitor;
