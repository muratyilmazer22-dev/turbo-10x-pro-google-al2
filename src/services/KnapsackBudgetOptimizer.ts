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

  let bestCounts = new Array(numLegs).fill(1);
  let bestCombinations = 1;
  let bestTotalScore = 0;

  // Recursive backtracking
  function backtrack(
    legIdx: number,
    currentComb: number,
    currentCounts: number[],
    currentScore: number
  ) {
    if (legIdx === numLegs) {
      if (currentComb <= maxCombinations) {
        if (
          currentComb > bestCombinations ||
          (currentComb === bestCombinations && currentScore > bestTotalScore)
        ) {
          bestCombinations = currentComb;
          bestCounts = [...currentCounts];
          bestTotalScore = currentScore;
        }
      }
      return;
    }

    const horsesInLeg = races[legIdx].horses;
    const maxForThisLeg = Math.min(
      horsesInLeg.length,
      Math.floor(maxCombinations / (currentComb || 1))
    );

    for (let c = 1; c <= maxForThisLeg; c++) {
      const nextComb = currentComb * c;
      if (nextComb > maxCombinations) break;

      const topScores = horsesInLeg
        .map(h => h.score)
        .sort((a, b) => b - a)
        .slice(0, c)
        .reduce((sum, score) => sum + score, 0);

      currentCounts[legIdx] = c;
      backtrack(legIdx + 1, nextComb, currentCounts, currentScore + topScores);
    }
  }

  backtrack(0, 1, new Array(numLegs).fill(1), 0);

  // İLK AYAK KAOS SİGORTASI
  let riskBancoRequired = bestCounts[0] < 2;
  if (riskBancoRequired) {
    bestCounts[0] = 2;
    bestCombinations = bestCounts.reduce((prod, c) => prod * c, 1);
    
    // Bütçe taşarsa sonraki ayakları azalt
    if (bestCombinations > maxCombinations) {
      for (let i = 1; i < numLegs; i++) {
        if (bestCounts[i] > 1 && bestCombinations > maxCombinations) {
          bestCounts[i] = Math.max(1, bestCounts[i] - 1);
          bestCombinations = bestCounts.reduce((prod, c) => prod * c, 1);
        }
      }
    }
  }

  const totalCost = bestCombinations * unitPrice;
  const budgetReserve = Math.max(0, targetBudget - totalCost);

  return {
    counts: bestCounts,
    combinations: bestCombinations,
    totalScore: bestTotalScore,
    totalCost,
    riskBancoStrategy: {
      firstLegBancoRequired: riskBancoRequired,
      backupHorses: races[0].horses
        .slice(0, Math.min(3, races[0].horses.length))
        .map(h => h.horseName),
      budgetReserve
    }
  };
}
