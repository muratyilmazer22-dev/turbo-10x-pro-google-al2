# Gelişmiş Altılı Robot Orkestrasyonu

`AltiliCouponOrchestrator` verified race-card verisiyle iki programı birbirinden kesin olarak ayırır:

- **1. Altılı:** koşu 1-6
- **2. Altılı:** koşu 5-10

Pipeline; yarış seçimi, at puanlama, bütçe optimizasyonu, final audit ve hafıza kaydını ayrı robot aşamaları olarak yürütür. Bülten eksikse sistem sessizce diğer altılıya geçmez ve sentetik safkan üretmez; `INSUFFICIENT_DATA` döndürür.

Örnek kullanım:

```ts
import { couponOrchestrator } from './src/services/AltiliCouponOrchestrator.js';
const plan = couponOrchestrator.create({
  program: '1. Altılı Ganyan',
  races: currentRaces,
  targetBudget: 80,
  unitPrice: 1.25,
  source: 'TJK-live-sync'
});
```

Hafıza katmanı `MemorySink` ile bağlanır. Üretimde bunu mevcut `historicalDb`/`data.json` yazıcısına bağlamak gerekir; her robot adımı için `REQUEST`, `RACE_ANALYSIS`, `BUDGET_OPTIMIZATION` ve `FINAL_AUDIT` kayıtları üretilir.

Test:

```bash
npm test
npm run lint
```
