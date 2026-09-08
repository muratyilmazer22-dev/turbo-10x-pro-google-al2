/**
 * 🎲 MONTE CARLO 1000 İTERASYON PACE-CRASH SİMÜLASYONU
 * Erken tempo çatışmalarında favori atları %20 azalt, sprinter adaylarını öne çıkar
 */

export interface HorseForSimulation {
  horseName: string;
  score: number;
  sprint_gucu: number;
  weight: number;
  pedigree_dna: number;
}

/**
 * 1000 iterasyonlu Monte Carlo simülasyonu
 * @param horses Yarışacak atlar ve skorları
 * @param iterations Simülasyon iterasyon sayısı (default: 1000)
 * @returns Her at için tempo-crash uyarlanmış final puan
 */
export function simulatePaceCrashMonteCarlo(
  horses: HorseForSimulation[],
  iterations: number = 1000
): Map<string, number> {
  
  const adjustmentMap = new Map<string, number>();
  
  // Initialize
  for (const horse of horses) {
    adjustmentMap.set(horse.horseName, horse.score);
  }

  // Lider aday atları tespit et (top 2)
  const leaders = [...horses].sort((a, b) => b.score - a.score).slice(0, 2);
  const leaderNames = new Set(leaders.map(h => h.horseName));

  // Monte Carlo: 1000 iterasyon
  for (let i = 0; i < iterations; i++) {
    const randomPaceIntensity = Math.random();
    
    if (randomPaceIntensity > 0.5) {
      // %50 ihtimalle erken tempo çatışması
      
      // FAVORI PENALTISI: %20 azaltma
      for (const leaderName of leaderNames) {
        const currentScore = adjustmentMap.get(leaderName) || 0;
        const crashPenalty = currentScore * 0.20;
        adjustmentMap.set(leaderName, currentScore - crashPenalty);
      }

      // SPRINTER BOOST: Hafif + hızlı atlar %15 artırılır
      for (const horse of horses) {
        if (
          !leaderNames.has(horse.horseName) &&
          horse.sprint_gucu > 75 &&
          horse.weight <= 55.0
        ) {
          const currentScore = adjustmentMap.get(horse.horseName) || 0;
          const sprintBoost = horse.score * 0.15;
          adjustmentMap.set(horse.horseName, currentScore + sprintBoost);
        }
      }
    }
  }

  // Normalize: Simülasyon sonrası orijinal+yeni ortalaması
  for (const [horseName, adjustedScore] of adjustmentMap.entries()) {
    const originalScore = horses.find(h => h.horseName === horseName)?.score || 0;
    const finalScore = (originalScore * 0.7) + (adjustedScore * 0.3);
    adjustmentMap.set(horseName, Math.min(99.5, Math.max(60.0, finalScore)));
  }

  return adjustmentMap;
}
