# 📱 TELEFON + GOOGLE AI STUDIO ENTEGRASYON REHBERI

## 🎯 HEDEF

✅ Telefondaki uygulamada **Google AI Studio API** kullanılacak
✅ **Vercel backend'i OPTIONAL** (sync için)
✅ **Tüm 3 motor (AHP + Monte Carlo + Knapsack) çalışacak**
✅ **Offline mode** + WiFi'de Vercel sync

---

## 🏗️ MIMARI

```
┌─────────────────────────────────────┐
│      📱 TELEFON UYGULAMASI          │
│  (React + TypeScript + Vite)        │
├─────────────────────────────────────┤
│                                     │
│  🤖 Gemini API (Bülten)             │
│  ├─ OCR (Görsel)                    │
│  └─ JSON Parse                      │
│                                     │
│  🧠 AHP 20-Parametreli (Lokal)     │
│  ├─ Dinamik metrikler               │
│  └─ Ağırlandırılmış puan            │
│                                     │
│  🎲 Monte Carlo 1000 İter. (Lokal)  │
│  ├─ Pace-crash sim.                 │
│  └─ Favori %20 azalt                │
│                                     │
│  💰 Knapsack Bütçe (Lokal)          │
│  ├─ Optimal kombinasyon             │
│  └─ Risk bankası                    │
│                                     │
│  💾 LocalStorage (Offline)          │
│  ├─ Hafıza bankası                  │
│  ├─ Öğrenme logları                 │
│  └─ Bülten cache                    │
│                                     │
└─────────────────────────────────────┘
         ⬇️ WiFi varsa
┌─────────────────────────────────────┐
│  ☁️ VERCEL BACKEND (SYNC ONLY)      │
│  ├─ Firebase Firestore              │
│  ├─ Yedekleme                       │
│  └─ Birden çok cihaz senkron.       │
└─────────────────────────────────────┘
```

---

## 🔧 KURULUM ADIMLARI

### 1. Google AI Studio API Key Al

```bash
# Tarayıcıda aç:
https://ai.google.dev

# "Get API Key" tıkla
# → "Create API key in new Google Cloud project"
# → API key kopyala

# Örnek:
VITE_GEMINI_API_KEY = "AIzaSyD..."
```

### 2. Uygulamaya Ekle

**Dosya: `src/App.tsx`**

```typescript
import useGeminiAnalysis from './hooks/useGeminiAnalysis';

const App = () => {
  // API Key'i environment'ten al
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    return <div>⚠️ GEMINI_API_KEY tanımlı değil</div>;
  }
  
  // Hook'u use et
  const { 
    analyzeFullPipeline,   // Tam analiz pipeline
    analyzeMemoryNotes,    // Hafıza notları analiz
    learnRaceResult,       // Yarış öğrenme
    askGemini,             // Chat
    loading,               // Loading state
    progress,              // İlerleme mesajı
    races,                 // Analiz sonucu
    budgetPlan,            // Bütçe optimizasyonu
    error                  // Hata
  } = useGeminiAnalysis(geminiApiKey);
  
  const handleAnalyzeClick = async () => {
    try {
      const result = await analyzeFullPipeline(
        bulletinText,  // Bülten metin/görsel
        false,         // isImage
        100,           // targetBudget TL
        1.25,          // unitPrice TL
        memoryNotes    // Hafıza notları
      );
      
      console.log('✅ Analiz tamamlandı', result);
      // UI güncelle
    } catch (err) {
      console.error('❌ Hata:', err);
    }
  };
  
  return (
    <div>
      {/* Bülten input */}
      <textarea 
        value={bulletinText}
        onChange={(e) => setBulletinText(e.target.value)}
        placeholder="Bülteni yapıştır veya yükle..."
      />
      
      {/* Analiz butonu */}
      <button 
        onClick={handleAnalyzeClick}
        disabled={loading}
      >
        {loading ? `⏳ ${progress}` : '⚡ Analiz Et'}
      </button>
      
      {/* Hata gösterimi */}
      {error && <div className="error">❌ {error}</div>}
      
      {/* Sonuçlar */}
      {races.length > 0 && (
        <div className="results">
          <h2>✅ 6/6 KUPONU</h2>
          {races.map((race, idx) => (
            <div key={idx} className="race">
              <h3>{idx + 1}. AYAK {race.isBanko ? '⭐ BANKO' : ''}</h3>
              {race.horses.map((horse: any) => (
                <div key={horse.name} className="horse">
                  <span>{horse.name}</span>
                  <span className="score">{horse.monoCarloScore.toFixed(2)} P</span>
                </div>
              ))}
            </div>
          ))}
          
          <div className="summary">
            <p>💰 Kombinasyon: {budgetPlan.combinations}</p>
            <p>💵 Tutar: {budgetPlan.totalCost} TL</p>
            <p>🏦 Reserve: {budgetPlan.riskBancoStrategy.budgetReserve} TL</p>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 3. Environment Variable Ayarla

**`.env.local`:**
```bash
VITE_GEMINI_API_KEY=AIzaSyD...
```

veya

**Telefonda App Settings'te:**
```
Settings → API Configuration → Paste Gemini Key
```

---

## 🚀 KULLANIM ÖRNEĞI

### Senaryo 1: Metin Bülten

```typescript
const bulletinText = `
1. KOŞU - 14:00 - Handikap 15 - 1400m Çim
1 SHINING GLORY - DAREDEVIL / SILENT CAT - JOKEY: A.SÖZEN - KG DB
2 TURBO KING - TURBO / GÜLİZAR - JOKEY: H.KARATAŞ - K SK
...`;

const result = await analyzeFullPipeline(
  bulletinText,
  false,  // metin
  100,    // 100 TL bütçe
  1.25,   // 1.25 TL birim
  []      // hafıza notları yok
);

console.log('6/6 Kuponu:', result.races);
console.log('Bütçe Plan:', result.budgetPlan);
```

### Senaryo 2: Görsel Bülten (Kamera)

```typescript
// Telefon kamerasından görsel
const canvas = await html2canvas(bulletinImage);
const base64 = canvas.toDataURL('image/jpeg');

const result = await analyzeFullPipeline(
  base64,  // Base64 görsel
  true,    // görsel
  100,
  1.25,
  []
);

// Gemini otomatik OCR yapar → JSON çıktı
console.log('Parsed races:', result.races);
```

### Senaryo 3: Hafıza Notlarıyla

```typescript
const memoryNotes = [
  "SHINING GLORY - Çim pistte 1400m derecesi 1.24.12, çok iyi form",
  "H.KARATAŞ - Son 10 yarışta 8 galibiyet, harika jokey",
  "TURBO KING - Kum pistte yavaş, çim tercih ediyor"
];

const result = await analyzeFullPipeline(
  bulletinText,
  false,
  100,
  1.25,
  memoryNotes  // Notlar → Gemini analiz → boost
);

// SHINING GLORY ve H.KARATAŞ puanları yükselecek
console.log('Enhanced scores:', result.races);
```

### Senaryo 4: Yarış Sonucunu Öğren

```typescript
const result = await learnRaceResult({
  winner: "SHINING GLORY",
  beaten: ["TURBO KING", "KAFKAS KARTALI"],
  jockey: "A.SÖZEN",
  weight: 57.5,
  distance: "1400m",
  track: "Çim"
});

console.log('Learning points:', result.learningPoints);
console.log('Analysis:', result.analysis);

// Motor SHINING GLORY puanını +2.5-4 puan artırır
// Sonraki analysisde daha doğru olur
```

### Senaryo 5: Gemini Chat

```typescript
const answer = await askGemini(
  "SHINING GLORY için sürpriz at var mı? Neden?"
);

console.log(answer);
// "Evet, WIND DANCER çok hafif (53kg) ve pedigree çok iyi..."
```

---

## 📦 Entegre Dosyalar

✅ `src/services/GoogleAIStudioIntegration.ts`
- Gemini API calls
- OCR (görsel → metin)
- Hafıza analizi
- Öğrenme işleme
- Chat

✅ `src/hooks/useGeminiAnalysis.ts`
- React Hook
- Pipeline orkestrasyonu
- AHP + Monte Carlo + Knapsack
- State management

✅ `src/services/AHPScoringEngine.ts`
- 20-parametreli puanlama

✅ `src/services/MonteCarloPaceSimulation.ts`
- 1000 iterasyon

✅ `src/services/KnapsackBudgetOptimizer.ts`
- Bütçe optimizasyonu

---

## 🔄 VERCEL SYNC (OPSİYONEL)

```typescript
// Otomatik sync aktivitesi
useEffect(() => {
  const syncInterval = setInterval(async () => {
    if (navigator.onLine) {  // WiFi varsa
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          races,
          budgetPlan,
          memoryNotes,
          learningEvents,
          timestamp: new Date()
        })
      });
      console.log('✅ Vercel ile senkron edildi');
    }
  }, 5 * 60 * 1000);  // Her 5 dakikada bir
  
  return () => clearInterval(syncInterval);
}, [races]);
```

---

## ✅ HAZIR KONTROL LİSTESİ

- [ ] Google AI Studio API Key aldın
- [ ] `.env.local` dosyasına ekledin
- [ ] `useGeminiAnalysis` hook'u import ettim
- [ ] Bülten input alanı oluşturdum
- [ ] "Analiz Et" butonunu tıkla
- [ ] 6/6 Kuponu görüntülendi ✅
- [ ] Hafıza notları ekledim
- [ ] Yarış sonucu öğrettim
- [ ] Vercel sync aktif

---

## 🎉 BITTI!

Telefonda **Google AI Studio + AHP + Monte Carlo + Knapsack** tamamen entegre ve çalışıyor! 🚀
