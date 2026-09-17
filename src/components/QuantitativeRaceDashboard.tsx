import React, { useState } from 'react';
import {
  Flame,
  TrendingUp,
  Percent,
  Coins,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Activity,
  Dna,
  Scale,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EvaluatedQuantitativeRunner, QuantitativeRaceAnalysisResult } from '../services/QuantitativeRiskEngine';
import { RaceActualResult } from '../services/LearningFeedbackEngine';

interface QuantitativeRaceDashboardProps {
  analysisData: QuantitativeRaceAnalysisResult | null;
  onRefreshAnalysis?: () => void;
  isLoading?: boolean;
  onFeedActualResult?: (result: RaceActualResult) => Promise<void>;
}

export const QuantitativeRaceDashboard: React.FC<QuantitativeRaceDashboardProps> = ({
  analysisData,
  onRefreshAnalysis,
  isLoading = false,
  onFeedActualResult
}) => {
  const [activeTab, setActiveTab] = useState<'VALUE_BETS' | 'ALL_PROBABILITIES'>('VALUE_BETS');
  const [expandedRunnerId, setExpandedRunnerId] = useState<string | null>(null);
  
  // Sonuç Girişi & Öğrenme Modalı
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [winningHorseNo, setWinningHorseNo] = useState<string>('');
  const [winningHorseName, setWinningHorseName] = useState<string>('');
  const [winningOdds, setWinningOdds] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);

  if (!analysisData) {
    return (
      <div id="turbo10x-dashboard-empty" className="p-8 text-center bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl">
        <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-1">Turbo 10X Pro Kantitatif Değer Motoru</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Canlı koşu verilerini aktararak veya bülten analizi başlatarak Beklenen Değer (EV) ve Fractional Kelly risk analizlerini anında görüntüleyin.
        </p>
      </div>
    );
  }

  const {
    hipodrom,
    distance,
    surface,
    paceScenario,
    bestValueBets,
    rankedRunners,
    valueBetsCount,
    summaryNotes
  } = analysisData;

  const displayedList = activeTab === 'VALUE_BETS' ? bestValueBets : rankedRunners;

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winningHorseName.trim() || !onFeedActualResult) return;

    setIsSubmittingFeedback(true);
    setFeedbackSuccessMsg(null);
    try {
      await onFeedActualResult({
        raceId: `${hipodrom}_${distance}_${Date.now()}`,
        hipodrom,
        distance,
        surface,
        winningHorseName,
        winningHorseNo,
        winningMarketOdds: parseFloat(winningOdds) || 2.5,
        placedHorses: []
      });
      setFeedbackSuccessMsg(`🎉 Öğrenme Döngüsü Başarıyla Çalıştırıldı! ${winningHorseName} verileri üzerinden pist ağırlıkları güncellendi.`);
      setTimeout(() => {
        setShowResultModal(false);
        setFeedbackSuccessMsg(null);
        setWinningHorseName('');
        setWinningHorseNo('');
        setWinningOdds('');
      }, 2500);
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div id="turbo10x-pro-dashboard" className="w-full space-y-6">
      {/* Üst Bilgi ve Özet Başlığı */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/80 p-5 rounded-2xl border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {hipodrom} {distance}m ({surface})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Tempo: {paceScenario}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Temperature-Scaled Softmax (T=18.5) & 0.25x Fractional Kelly Risk Algoritması
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-feed-result"
              onClick={() => setShowResultModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              Yarış Sonucunu Gir & Modeli Eğit
            </button>
            {onRefreshAnalysis && (
              <button
                id="btn-refresh-quant"
                onClick={onRefreshAnalysis}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Activity className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'text-amber-400'}`} />
                Yeniden Hesapla
              </button>
            )}
          </div>
        </div>

        {/* Özet Not Banner */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Kantitatif Durum Özeti: </span>
            {summaryNotes}
          </div>
        </div>
      </div>

      {/* Navigasyon Sekmeleri (A: Kazanma Şansı, B: Value Bets) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-value-bets"
            onClick={() => setActiveTab('VALUE_BETS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'VALUE_BETS'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-102 font-extrabold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === 'VALUE_BETS' ? 'text-slate-950' : 'text-amber-400'}`} />
            Risk/Ödül Oranı En Yüksek Sürprizler
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'VALUE_BETS' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {valueBetsCount}
            </span>
          </button>

          <button
            id="tab-all-probs"
            onClick={() => setActiveTab('ALL_PROBABILITIES')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'ALL_PROBABILITIES'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 scale-102 font-extrabold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Kazanma Şansına Göre Sıralama
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
              {rankedRunners.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-ping" />
            <strong className="text-amber-300">EV ≥ 1.10:</strong> Değer Bahsi
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <strong>Max %10:</strong> 0.25x Kelly Kasa
          </span>
        </div>
      </div>

      {/* At Kartları Listesi */}
      <div className="grid grid-cols-1 gap-4">
        {displayedList.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            {activeTab === 'VALUE_BETS' 
              ? "Bu koşuda EV ≥ 1.10 eşiğini aşan aşırı fiyatlanmış sürpriz (Value Bet) bulunamadı. Standart sıralama sekmesini inceleyebilirsiniz."
              : "Listelenecek safkan bulunamadı."}
          </div>
        ) : (
          displayedList.map((runner, index) => {
            const isExpanded = expandedRunnerId === runner.id;
            const isValue = runner.isValueBet;

            return (
              <div
                key={runner.id || index}
                id={`runner-card-${runner.no}`}
                className={`transition-all duration-200 rounded-2xl p-4 sm:p-5 relative overflow-hidden ${
                  isValue
                    ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-emerald-950/30 border-2 border-amber-400/70 shadow-xl shadow-amber-500/10'
                    : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Value Bet Işıltı Efekti */}
                {isValue && (
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 shadow-md">
                      <Flame className="w-3.5 h-3.5 fill-slate-950" />
                      🔥 VALUE BET (EV: {runner.expectedValueEV})
                    </span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* At No, İsim & Jokey */}
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${
                      isValue
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950'
                        : 'bg-slate-800 text-white border border-slate-700'
                    }`}>
                      {runner.no}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-white tracking-wide">
                          {runner.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {runner.carriedWeight} kg
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {runner.runningStyle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>🏇 {runner.jockey}</span>
                        <span>•</span>
                        <span>Dinamik Skor: <strong className="text-slate-200">{runner.finalPaceAdjustedScore}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Oran Karşılaştırma & Kelly Kartı */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
                    {/* Piyasa Ganyanı */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Piyasa Ganyanı</div>
                      <div className="text-sm font-black text-amber-300 mt-0.5">{runner.marketOdds.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">%{runner.impliedMarketProbPercent} şans</div>
                    </div>

                    {/* Adil Oran (Fair Odds) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Adil Oran</div>
                      <div className="text-sm font-black text-cyan-300 mt-0.5">{runner.fairOdds.toFixed(2)}</div>
                      <div className="text-[10px] text-emerald-400 font-bold">%{runner.trueProbPercent} gerçek</div>
                    </div>

                    {/* Beklenen Değer (EV) */}
                    <div className={`p-2.5 rounded-xl text-center ${
                      isValue 
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-300'
                    }`}>
                      <div className="text-[10px] uppercase font-bold">Beklenen Değer (EV)</div>
                      <div className="text-sm font-black mt-0.5">{runner.expectedValueEV.toFixed(3)}</div>
                      <div className="text-[10px] font-bold">
                        {isValue ? '🔥 Yüksek Değer' : 'Nötr / Negatif'}
                      </div>
                    </div>

                    {/* Fractional Kelly Kasa Payı */}
                    <div className={`p-2.5 rounded-xl text-center ${
                      isValue && runner.kellyFractionStake > 0
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-400'
                    }`}>
                      <div className="text-[10px] uppercase font-bold">Kelly Kasa Payı</div>
                      <div className="text-sm font-black mt-0.5">
                        {runner.kellyFractionStake > 0 ? `%${(runner.kellyFractionStake * 100).toFixed(1)}` : '0%'}
                      </div>
                      <div className="text-[10px] text-slate-500">0.25x Kelly</div>
                    </div>
                  </div>
                </div>

                {/* Claude AI Insight & Detaylı Yorum */}
                {runner.aiInsight && (
                  <div className={`mt-3.5 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                    isValue 
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200' 
                      : 'bg-slate-950/50 border border-slate-800 text-slate-300'
                  }`}>
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">AI Değer Analizi: </span>
                      {runner.aiInsight}
                    </div>
                  </div>
                )}

                {/* Genişletme / AHP Detay Puanları */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Dna className="w-3.5 h-3.5 text-pink-400" />
                      Dozaj: <strong className="text-slate-200">{runner.normalizedScores.pedigreeDistanceFit}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Galop: <strong className="text-slate-200">{runner.normalizedScores.gallopSpeedRating}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-blue-400" />
                      Kilo: <strong className="text-slate-200">{runner.normalizedScores.weightAdvantageScore}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      Form: <strong className="text-slate-200">{runner.normalizedScores.formScore}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setExpandedRunnerId(isExpanded ? null : runner.id)}
                    className="hover:text-white flex items-center gap-1 font-medium transition-colors"
                  >
                    {isExpanded ? 'Detayları Gizle' : 'Ağırlık Dağılımını Gör'}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Açılır Ağırlık Dağılım Paneli */}
                {isExpanded && (
                  <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2 animate-fadeIn">
                    <div className="font-bold text-slate-300">Uygulanan Dinamik Ağırlık Matrisi:</div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Form</div>
                        <div className="font-bold text-indigo-300">%{Math.round(runner.appliedWeights.form * 100)}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Pedigree</div>
                        <div className="font-bold text-pink-300">%{Math.round(runner.appliedWeights.pedigree * 100)}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Galop</div>
                        <div className="font-bold text-amber-300">%{Math.round(runner.appliedWeights.gallop * 100)}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Jokey</div>
                        <div className="font-bold text-cyan-300">%{Math.round(runner.appliedWeights.jockey * 100)}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Kilo</div>
                        <div className="font-bold text-emerald-300">%{Math.round(runner.appliedWeights.weight * 100)}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Pist</div>
                        <div className="font-bold text-purple-300">%{Math.round(runner.appliedWeights.track * 100)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Yarış Sonucu Gir & Modeli Eğit Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Yarış Sonucu & Öğrenme</h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Gerçekleşen koşu sonucunu girerek modelin <strong>Loss Function</strong> hesaplamasını ve sonraki koşular için hipodrom katsayılarını otomatik optimize etmesini sağlayın.
            </p>

            {feedbackSuccessMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{feedbackSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kazanan Atın Numarası:
                  </label>
                  <input
                    type="number"
                    value={winningHorseNo}
                    onChange={(e) => setWinningHorseNo(e.target.value)}
                    placeholder="Örn: 4"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kazanan Atın Adı:
                  </label>
                  <input
                    type="text"
                    value={winningHorseName}
                    onChange={(e) => setWinningHorseName(e.target.value)}
                    placeholder="Örn: CANMETE"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kapanış Ganyanı (Oran):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={winningOdds}
                    onChange={(e) => setWinningOdds(e.target.value)}
                    placeholder="Örn: 6.85"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResultModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingFeedback ? 'Hesaplanıyor...' : 'Öğrenme Döngüsünü Başlat'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantitativeRaceDashboard;
