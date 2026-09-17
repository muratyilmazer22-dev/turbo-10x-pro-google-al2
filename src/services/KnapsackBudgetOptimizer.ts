/**
 * 💰 DİNAMİK KNAPSACK BÜTÇE OPTİMİZASYONU + RISK BANKASI
 * Bütçeyi kuruş hassasiyetiyle yönet, ilk ayak kaos sigortası garantisi
 */

export interface BudgetOptimizationResult {
  counts: number[];                    // Ayak başına seçilecek at sayısı
  combinations: number;                 // Toplam kombinasyon sayısı
  totalScore: number;                  // Seçilen atların toplam AI skoru
  totalCost: number;                   // Toplam kurgu maliyeti (TL)
  riskBancoStrategy: {
    firstLegBancoRequired: boolean;    // İlk ayak en az 2 at gerekli mi?
    backupHorses: string[];            // Backup atlar
    budgetReserve: number;             // Kullanılmayan bütçe (TL)
  };
}

/**
 * Knapsack algoritması + Risk Bankası
 * @param races 6 koşu verisi (her koşudaki atlar ve skorları)
 * @param targetBudget Hedef bütçe (TL)
 * @param unitPrice Birim fiyat (TL)
 * @returns Optimal kurgu planı
 */
export function optimizeKnapsackBudget(
  races: Array<{ horses: Array<{ horseName: string; score: number }> }>,
  targetBudget: number,
  unitPrice: number
): BudgetOptimizationResult {
  
  const numLegs = races.length;
  const maxCombinations = Math.floor(targetBudget / unitPrice);

  let bestCounts = new Array(numLegs).fill(2);
  if (bestCounts.length > 0) bestCounts[0] = Math.min(3, Math.max(1, races[0]?.horses?.length || 3));
  let bestCombinations = 0;
  let bestUtility = -Infinity;
  let bestTotalScore = 0;

  // Maximum singles allowed: 2 (Banko Freni - at most 2 singles, at least 4 legs must be multiple)
  const maxSingles = Math.min(2, Math.max(1, numLegs <= 4 ? 1 : 2));

  // Recursive backtracking with strict budget constraints
  function backtrack(
    legIdx: number,
    currentComb: number,
    currentCounts: number[],
    currentScore: number,
    singlesCount: number
  ) {
    if (legIdx === numLegs) {
      if (currentComb <= maxCombinations && singlesCount <= maxSingles) {
        // Utility calculation: prioritize exact budget match, then highest combination <= maxCombinations
        const budgetRatio = currentComb / maxCombinations;
        let utility = Math.pow(budgetRatio, 3) * 25000 + currentScore;
        
        if (currentComb === maxCombinations) {
          utility += 50000; // Exact target match bonus (e.g. 64/64 for 80 TL)
        } else {
          utility -= (maxCombinations - currentComb) * 80;
        }

        // 1st Leg Survival Shield bonus
        if (currentCounts[0] >= 4) utility += 2000;
        else if (currentCounts[0] >= 3) utility += 1000;

        if (utility > bestUtility) {
          bestUtility = utility;
          bestCombinations = currentComb;
          bestCounts = [...currentCounts];
          bestTotalScore = currentScore;
        }
      }
      return;
    }

    const currentLeg = races[legIdx] as any;
    const horsesInLeg: Array<{ horseName?: string; score: number }> = 
      Array.isArray(currentLeg?.horses) ? currentLeg.horses : (Array.isArray(currentLeg) ? currentLeg : []);
    const maxAvailable = Math.max(1, horsesInLeg.length);

    // KURAL 1: 1. Ayak Hayatta Kalma Kalkanı - Asla 1 veya 2 at olamaz! Minimum 3 veya 4.
    const minCount = legIdx === 0 ? Math.min(3, maxAvailable) : (singlesCount < maxSingles ? 1 : 2);
    const maxForThisLeg = Math.min(
      maxAvailable,
      Math.max(minCount, Math.floor(maxCombinations / (currentComb || 1)))
    );

    for (let c = minCount; c <= maxForThisLeg; c++) {
      const nextComb = currentComb * c;
      if (nextComb > maxCombinations) break;

      const nextSingles = singlesCount + (c === 1 ? 1 : 0);
      if (nextSingles > maxSingles) continue;

      const topScores = horsesInLeg.length > 0
        ? horsesInLeg
            .map(h => typeof h?.score === "number" ? h.score : 50)
            .sort((a, b) => b - a)
            .slice(0, c)
            .reduce((sum, score) => sum + score, 0)
        : 50 * c;

      currentCounts[legIdx] = c;
      backtrack(legIdx + 1, nextComb, currentCounts, currentScore + topScores, nextSingles);
    }
  }

  backtrack(0, 1, new Array(numLegs).fill(1), 0, 0);

  // Fallback if no configuration found: safe balanced ticket
  if (bestCombinations === 0 || bestCounts.reduce((a, b) => a * b, 1) > maxCombinations) {
    bestCounts = new Array(numLegs).fill(2);
    if (bestCounts.length > 0) bestCounts[0] = Math.min(3, Math.max(1, races[0]?.horses?.length || 3));
    if (bestCounts.length > 2) bestCounts[2] = 1; // Middle risk banko
    while (bestCounts.reduce((a, b) => a * b, 1) > maxCombinations) {
      const maxVal = Math.max(...bestCounts.slice(1));
      const idx = bestCounts.findIndex((c, i) => i > 0 && c === maxVal && c > 1);
      if (idx === -1) break;
      bestCounts[idx]--;
    }
    bestCombinations = bestCounts.reduce((a, b) => a * b, 1);
  }

  const totalCost = Number((bestCombinations * unitPrice).toFixed(2));
  const budgetReserve = Number(Math.max(0, targetBudget - totalCost).toFixed(2));

  const firstLegRunners = races[0]?.horses || [];
  const backupHorses = firstLegRunners
    .slice(0, Math.min(4, firstLegRunners.length))
    .map(h => h.horseName);

  return {
    counts: bestCounts,
    combinations: bestCombinations,
    totalScore: bestTotalScore,
    totalCost,
    riskBancoStrategy: {
      firstLegBancoRequired: false,
      backupHorses,
      budgetReserve
    }
  };
}
