/**
 * ⚡ React Hook: Gemini + AHP + Monte Carlo + Knapsack
 * Telefonda doğrudan çalışır
 */

import { useState, useCallback } from 'react';
import GoogleAIStudioIntegration from '../services/GoogleAIStudioIntegration';
import { calculateDynamicAHP, calculateWeightedAHPScore } from '../services/AHPScoringEngine';
import { simulatePaceCrashMonteCarlo } from '../services/MonteCarloPaceSimulation';
import { optimizeKnapsackBudget } from '../services/KnapsackBudgetOptimizer';

interface AnalysisState {
  loading: boolean;
  races: any[];
  budgetPlan: any;
  error: string | null;
  progress: string;
}

export function useGeminiAnalysis(geminiApiKey: string) {
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    races: [],
    budgetPlan: {},
    error: null,
    progress: ""
  });

  const gemini = new GoogleAIStudioIntegration(geminiApiKey);

  /**
   * Tam Analiz Pipeline: Bülten → AHP → Monte Carlo → Knapsack → 6/6 Kuponu
   */
  const analyzeFullPipeline = useCallback(
    async (
      bulletinTextOrImage: string,
      isImage: boolean = false,
      targetBudget: number = 100,
      unitPrice: number = 1.25,
      memoryNotes: string[] = []
    ) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // ADIM 1: Bülteni Parse Et (Gemini)
        setState(prev => ({ ...prev, progress: "📋 Bülten Gemini ile parse ediliyor..." }));
        const bulletinData = await gemini.parseBulletinWithGemini(bulletinTextOrImage, isImage);
        console.log("✅ Bülten parse edildi", bulletinData);

        // ADIM 2: Her at için AHP 20-Parametreli Puan Hesapla
        setState(prev => ({ ...prev, progress: "🧠 20-Parametreli AHP motoru çalışıyor..." }));
        const analyzedRaces = (bulletinData.races || []).map((race: any) => {
          return {
            ...race,
            horses: (race.horses || []).map((horse: any) => {
              // Hafıza boost var mı kontrol et
              const horseMemoryNotes = memoryNotes.filter(n => 
                n.toLowerCase().includes((horse.name || "").toLowerCase())
              );

              // AHP Metriklerini Hesapla
              const metrics = calculateDynamicAHP(
                horse.name || "",
                race.category?.includes("Handicap") || false,
                [], // recentRaceResults - local'de varsa
                horseMemoryNotes,
                85.0, // pedigreeRating - placeholder
                55.0, // weight - placeholder
                75    // handicap - placeholder
              );

              // Ağırlandırılmış AHP Skoru
              const ahpScore = calculateWeightedAHPScore(
                metrics,
                race.category?.includes("Handicap") || false
              );

              return {
                ...horse,
                ahpScore,
                metrics
              };
            })
          };
        });
        console.log("✅ AHP skorları hesaplandı", analyzedRaces);

        // ADIM 3: Monte Carlo Pace-Crash Simülasyonu
        setState(prev => ({ ...prev, progress: "🎲 Monte Carlo 1000 iterasyon çalışıyor..." }));
        const racesWithMonteCarlo = analyzedRaces.map((race: any) => {
          const monoCarloMap = simulatePaceCrashMonteCarlo(
            (race.horses || []).map((h: any) => ({
              horseName: h.name || "",
              score: h.ahpScore || 70,
              sprint_gucu: h.metrics?.sprint_gucu || 70,
              weight: 55.0,
              pedigree_dna: h.metrics?.pedigree_dna || 85
            }))
          );

          return {
            ...race,
            horses: (race.horses || []).map((h: any) => ({
              ...h,
              monoCarloScore: monoCarloMap.get(h.name) || h.ahpScore
            }))
          };
        });
        console.log("✅ Monte Carlo tamamlandı", racesWithMonteCarlo);

        // ADIM 4: Knapsack Bütçe Optimizasyonu
        setState(prev => ({ ...prev, progress: "💰 Dinamik bütçe optimizasyonu..." }));
        const budgetPlan = optimizeKnapsackBudget(
          racesWithMonteCarlo.map((r: any) => ({
            horses: (r.horses || []).map((h: any) => ({
              horseName: h.name || "",
              score: h.monoCarloScore || 70
            }))
          })),
          targetBudget,
          unitPrice
        );
        console.log("✅ Bütçe optimizasyonu tamamlandı", budgetPlan);

        // ADIM 5: Final 6/6 Kuponu Oluştur
        setState(prev => ({ ...prev, progress: "✅ 6/6 Kuponu oluşturuluyor..." }));
        const finalRaces = racesWithMonteCarlo.map((race: any, idx: number) => {
          const selectedCount = budgetPlan.counts[idx] || 1;
          const sortedHorses = [...(race.horses || [])].sort(
            (a: any, b: any) => (b.monoCarloScore || 0) - (a.monoCarloScore || 0)
          );
          const selectedHorses = sortedHorses.slice(0, selectedCount);

          return {
            ...race,
            horses: selectedHorses,
            selectedCount,
            isBanko: selectedCount === 1
          };
        });

        setState(prev => ({
          ...prev,
          loading: false,
          races: finalRaces,
          budgetPlan,
          progress: "✅ Analiz tamamlandı! 6/6 Kuponu hazır."
        }));

        return {
          races: finalRaces,
          budgetPlan,
          success: true
        };
      } catch (error: any) {
        const errorMsg = error.message || "Analiz sırasında hata oluştu";
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMsg,
          progress: ""
        }));
        throw error;
      }
    },
    [gemini]
  );

  /**
   * Hafıza Notlarını Gemini ile Analiz Et
   */
  const analyzeMemoryNotes = useCallback(async (notes: string[]) => {
    try {
      const analysis = await gemini.analyzeMemoryNotesWithGemini(notes);
      return analysis;
    } catch (error) {
      console.error("Memory analysis failed", error);
      return [];
    }
  }, [gemini]);

  /**
   * Yarış Sonucu Öğren
   */
  const learnRaceResult = useCallback(
    async (raceResult: { winner: string; beaten: string[]; jockey: string; weight: number; distance: string; track: string }) => {
      try {
        const learning = await gemini.processLearningEventWithGemini(raceResult);
        return learning;
      } catch (error) {
        console.error("Learning failed", error);
        return { learningPoints: 0, analysis: "" };
      }
    },
    [gemini]
  );

  /**
   * Gemini Chat (Türkçe Yardım)
   */
  const askGemini = useCallback(async (question: string) => {
    try {
      return await gemini.askGeminiTurkish(question);
    } catch (error) {
      console.error("Chat failed", error);
      return "Hata oluştu, lütfen tekrar deneyin";
    }
  }, [gemini]);

  return {
    ...state,
    analyzeFullPipeline,
    analyzeMemoryNotes,
    learnRaceResult,
    askGemini
  };
}

export default useGeminiAnalysis;
