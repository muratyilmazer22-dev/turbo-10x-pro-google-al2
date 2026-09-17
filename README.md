# 🏇 TURBO 10X PRO — TJK Yarış Analiz & Kupon Optimizasyon Motoru

[![CI Build](https://github.com/muratyilmazer22-dev/turbo-10x-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/muratyilmazer22-dev/turbo-10x-pro)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-green.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **TURBO 10X PRO**, Türkiye Jokey Kulübü (TJK) yarış bültenlerini, 24+ aylık hipodrom geçmişini, pedigri/DNA hatlarını ve canlı pist eğilimlerini (Track Bias) işleyerek en rasyonel, yüksek EV (Expected Value) ve ganyan avcısı altılı ganyan şablonlarını oluşturan kapalı devre analitik kupon optimizasyon motorudur.

---

## ⚡ Temel Özellikler & Matematiksel Mimari

### 1. 🛡️ Sıfır Halüsinasyon & Kapalı Devre Veri Doğrulama
- Bültende yer almayan hiçbir safkan, jokey veya kilo kurguya dahil edilmez.
- 14 Kriterli Çıktı Öncesi Denetim Kalkanı (**Audit Shield**): Gelecek verisi sızıntısı, bütçe aşımı, mükerrer safkan ve hayali veri kontrollerini milisaniyeler içinde gerçekleştirir.

### 2. 📊 20 Parametreli AHP (Analytic Hierarchy Process) Matrisi
Koşu tipine (Handikap, Şartlı, Maiden, Açık Koşu) göre dinamik ağırlıklandırılan 20 parametreli matematiksel değerlendirme:
1. Handikap Puanı & Trend
2. Son Form Grafiği
3. Speed Rating (Hız Derecesi)
4. Pist Uyumu (Kum / Çim / Sentetik)
5. Mesafe Uyumu
6. Sıklet (Kilo)
7. Kilo Değişimi & Apranti İndirimi
8. Jokey Seviyesi
9. Jokey-Antrenör Sinerjisi (JSI)
10. Jokey Tercih Çarpanı
11. Early Pace (Erken Hız)
12. Late Kick (Son Sektör Sprint Gücü)
13. Tempo Senaryosu
14. Galop & İdman Dereceleri
15. Takı Değişikliği Etkisi (KG, DB vb.)
16. Pedigri / Orijin DNA Uyumu
17. Kulvar & Pist Bias
18. AGF / Piyasa Oranı
19. Ahır / Eküri Sinerjisi
20. Canlı Padok Durumu

### 3. 🎲 10.000 İterasyonlu Monte Carlo Simülasyonu
- Her koşu için trafik, çıkış gecikmesi, kulvar dezavantajı ve tempo çarpışmalarını stokastik simülasyonla hesaplar.
- Çıktılar: **Win% (Kazanma Olasılığı)**, **İlk 2%**, **İlk 3%**, **Ortalama Bitiriş Sırası** ve **EV (Expected Value)**.

### 4. ⚡ Sert Tempo Cezası (Pace Crash) & Track Bias Adaptasyonu
- Grupta erken pres yapacak birden fazla kaçak at olduğunda favori kaçakların puanı dinamik olarak törpülenir, sprinter/pusucu safkanlar öne çıkarılır.
- Günlük koşulan ilk 1-2 yarışın zemin verileriyle pist karakteri (iç/dış kulvar, kaçak/bekleme avantajı) kalibre edilir.

### 5. 💰 Dinamik Knapsack Bütçe & Kolon Optimizasyonu
- Belirtilen bütçe (örn: 80 TL, 150 TL, 500 TL) ve geçerli birim kolon fiyatı kuruşu kuruşuna esas alınır.
- Ezbere eşit at dağıtımı yerine; kaos ayakları genişletilir, sağlam ayaklar daraltılır veya rasyonel teklerle finanse edilir.
- **1. Ayak Hayatta Kalma Kalkanı**: İlk ayakta kuponun erken çökmesini önleyen asgari derinlik koruması devrededir.

---

## 🚀 Hızlı Başlangıç (Quick Start)

### Gereksinimler
- **Node.js** v20.x veya v22.x
- **npm** (veya pnpm / yarn)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/muratyilmazer22-dev/turbo-10x-pro.git
cd turbo-10x-pro
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenlerini Ayarlayın
`.env.example` dosyasını `.env` olarak kopyalayın:
```bash
cp .env.example .env
```
*(İsteğe bağlı: Gemini API anahtarınızı `GEMINI_API_KEY=` satırına ekleyebilirsiniz.)*

### 4. Geliştirme Ortamında Başlatın
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde Express API ve Vite Frontend ile eşzamanlı olarak çalışır.

### 5. Üretim (Production) Derlemesi ve Çalıştırma
```bash
# TypeScript doğrulaması (Lint)
npm run lint

# Frontend ve Backend bundle derlemesi
npm run build

# Üretim sunucusunu başlatma
npm start
```

---

## 📁 Proje Dizin Yapısı

```text
├── server.ts                 # Express API, TJK Entegrasyonu & Karar Motoru
├── src/
│   ├── App.tsx               # Ana Kullanıcı Arayüzü & Yönetim Paneli
│   ├── analysisEngine.ts     # AHP, Monte Carlo & Deterministik Analiz
│   ├── types.ts              # Ortak TypeScript Tipleri ve Veri Modelleri
│   ├── components/           # UI Bileşenleri & Dashboard Modülleri
│   ├── services/             # İzole Servisler (Stabilization, Pedigree, vb.)
│   └── db/                   # Şema ve Veritabanı Modelleri
├── data.json                 # Yerel TJK Veri Bankası & 24 Aylık Hafıza
├── public/                   # PWA Manifest, İkonlar ve Statik Varlıklar
├── .github/workflows/        # GitHub Actions CI/CD Otomasyonu
├── .env.example              # Örnek Çevre Değişkenleri
├── metadata.json             # AI Studio Uygulama Tanımı
└── package.json              # Paket Bağımlılıkları ve Komutlar
```

---

## 🔒 Güvenlik & Gizlilik
- Hiçbir API anahtarı veya gizli anahtar frontend kodlarına gömülmez (`server.ts` üzerinden proxy edilir).
- `.gitignore` dosyası; hassas kimlik bilgileri, `.env` dosyaları ve derleme çıktılarını güvenle hariç tutar.

---

## 📜 Lisans
Bu proje [MIT Lisansı](LICENSE) kapsamında lisanslanmıştır.
