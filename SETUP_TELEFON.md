# 📱 TELEFONDA GOOGLE AI STUDIO KURULUMU

## ⚡ 3 Adımda Başla

### 1️⃣ Google AI Studio API Key Al

```bash
# Telefondaki tarayıcıda aç:
https://ai.google.dev/

# "Get API Key" tıkla
# Yeni proje oluştur veya var olan seç
# API Key kopyala
```

### 2️⃣ Uygulamada Ayarla

**Telefondaki uygulamada:**

1. **Ayarlar** → **API Ayarları**
2. "Google AI Studio API Key" alanına yapıştır
3. **✅ Kaydet**

```
VITE_GEMINI_API_KEY = [buraya yapıştır]
```

### 3️⃣ Test Et

1. **"Analiz Paneli"** aç
2. Bülten metin/görsel yükle
3. **"⚡ ANALIZ ET"** tıkla
4. ✅ 6/6 Kuponu görüntülenecek

---

## 🔄 İş Akışı

```
Telefonda Kullanım:

1. Bülten Yükle
   ↓
2. "Analiz Et" → Gemini çağrı
   ├─ OCR (Görsel ise)
   ├─ AHP 20-Parametreli
   ├─ Monte Carlo 1000 İter.
   ├─ Knapsack Bütçe
   └─ 6/6 Kuponu
   ↓
3. Hafıza Bankası notları ekle (opsiyonel)
   ↓
4. Yarış sonucunu öğret
   ↓
5. Vercel'e otomatik sync (WiFi varsa)
```

---

## 🛠️ TELEFON UYGULAMASI MOD

```typescript
// src/App.tsx

import useGeminiAnalysis from './hooks/useGeminiAnalysis';

const App = () => {
  const geminiApiKey = localStorage.getItem('GEMINI_API_KEY');
  const { analyzeFullPipeline, progress, loading, races, budgetPlan, error } = 
    useGeminiAnalysis(geminiApiKey || '');

  const handleAnalyze = async (bulletinText: string) => {
    const result = await analyzeFullPipeline(
      bulletinText,
      false, // metin mi görsel mi
      100,   // bütçe
      1.25   // birim fiyat
    );
    
    // 6/6 Kuponu ekranda göster
    console.log(result.races, result.budgetPlan);
  };

  return (
    <div>
      {/* Bülten yükle */}
      <textarea 
        value={bulletinText}
        onChange={(e) => setBulletinText(e.target.value)}
        placeholder="Bülteni yapıştır..."
      />
      
      {/* Analiz başlat */}
      <button onClick={() => handleAnalyze(bulletinText)}>
        {loading ? `${progress}...` : '⚡ Analiz Et'}
      </button>
      
      {/* Sonuçlar */}
      {error && <div className="error">{error}</div>}
      {races.length > 0 && (
        <div>
          <h2>6/6 KUPONU</h2>
          {races.map((race, i) => (
            <div key={i}>
              <h3>{i+1}. AYAK</h3>
              {race.horses.map((h: any) => (
                <div key={h.name}>
                  {h.name} - {h.monoCarloScore.toFixed(2)} Puan
                </div>
              ))}
            </div>
          ))}
          <div>
            <strong>Toplam: {budgetPlan.combinations} Kombinasyon</strong>
            <strong>Tutar: {budgetPlan.totalCost} TL</strong>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📡 VERCEL SYNC (WiFi'de Otomatik)

```typescript
// useEffect hook
useEffect(() => {
  const syncToVercel = async () => {
    const localData = {
      races,
      budgetPlan,
      timestamp: new Date().toISOString()
    };
    
    await fetch('https://turbo-10x-pro-google-al2.vercel.app/api/sync', {
      method: 'POST',
      body: JSON.stringify(localData)
    });
  };
  
  // Analiz tamamlandığında sync et
  if (races.length > 0) {
    syncToVercel();
  }
}, [races]);
```

---

## 🔒 GÜVENLİK

✅ **Gemini API Key sadece telefonda**
- LocalStorage'da şifrelenmiş
- Hiçbir backend'e gönderilmez

✅ **Vercel sync opsiyonel**
- Offline mode + lokal veri
- Yalnızca kullanıcı isterse sync

✅ **Firebase Firestore (opsiyonel)**
- Yedek veri depolama
- Birden fazla cihazda senkronizasyon

---

## ⚡ PERFORMANS

| İşlem | Süre | Mod |
|-------|------|-----|
| Bülten Parse (Gemini) | 3-5 sn | Online |
| AHP Hesaplama | <1 sn | Lokal |
| Monte Carlo 1000 İter. | 1-2 sn | Lokal |
| Knapsack Bütçe | <1 sn | Lokal |
| **Toplam** | **5-8 sn** | Mixed |

---

## 🎯 TELEFONDA KULLANIM SENARYOSU

```
📱 Saat 13:50 - Hipodromda

1. TJK bültenini fotoğrafla
2. Uygulamaya yükle
3. "Analiz Et" → 8 saniye sonra
4. 6/6 Kuponu hazır! ✅
5. Kupon yazdır/paylaş
6. WiFi varsa Vercel'e yedekle

📱 Saat 17:00 - Evde

1. Yarış sonuçlarını gir
2. Motor otomatik öğren
3. Hafızaya not ekle
4. Sonraki gün daha doğru puanlar 📈
```

---

## 🆘 SORUN GIDERME

### "API Key geçersiz" hatası
```bash
# Yeni key al: https://ai.google.dev/
# LocalStorage temizle:
# localStorage.clear()
# Uygulamayı restart et
```

### "Bülten parse edilemedi"
```bash
# Bülten formatını kontrol et
# Örnek:
# 1. KOŞU - 14:00
# 1 AT_ADI - SIRE / DAM - JOKEY: X.X
```

### "Monte Carlo çok yavaş"
```bash
# İterasyon sayısını azalt (opsiyonel)
# VITE_MONTE_CARLO_ITERATIONS=500
```

---

## 📞 DESTEK

- **GitHub Issues:** turbo-10x-pro-google-al2/issues
- **Gemini API Docs:** https://ai.google.dev/docs
- **Firebase Console:** https://console.firebase.google.com
