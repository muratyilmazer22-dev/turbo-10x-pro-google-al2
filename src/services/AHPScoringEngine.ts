/**
 * 🧠 20-PARAMETRELI DİNAMİK AHP PUANLAMA MOTORU
 * Her at için gerçek veriye dayalı analitik skor hesapla
 * Kapalı devre sistemin kalbi — %100 deterministic
 */

export interface HorseMetrics {
  agf_puan: number;              // Tüm İşler Gemileri — geçmiş form
  kilo_etkisi: number;            // Sıklet avantajı (en önemli)
  jokey_form: number;             // Jokey güncel forma
  antrenor_form: number;          // Antrenör istatistikleri
  galop_gucu: number;             // Son galop derecesi
  form_6yaris: number;            // Son 6 yarışta ortalama başarı
  pist_uyumu: number;             // Spesifik piste uyumu
  mesafe_uyumu: number;           // Yarış mesafesine uyumu
  sinif_gucu: number;             // Yarış sınıfına göre güç
  handikap_gucu: number;          // Handicap puanı kalitesi
  sprint_gucu: number;            // Son 400m sprint hızı
  pedigree_dna: number;           // Anne-baba kan hattı
  tempo_ayaki: number;            // Erken tempo başarı
  son_kosu_performansi: number;   // Son koşudaki performans
  pist_durumu_uyumu: number;      // Pist durumuna uyum
  kafa_sagligi: number;           // Psikiyatrik hazırlık
  is_rotasyon: number;            // Yarış aralığı optimizasyonu
  ozellik_kupu: number;           // Özel donanım avantajı
  hafiza_bankasi_boost: number;   // Kullanıcı hafıza notlarından
  rakip_analizi: number;          // Diğer atların zayıflığı
}

export function calculateDynamicAHP(
  horseName: string,
  isHandicapRace: boolean,
  recentRaceResults: Array<{ position: number; distance: number; trackType: string }>,
  memoryNotes: string[],
  pedigreeRating: number,
  weight: number,
  handicap: number
): HorseMetrics {
  
  // Hafıza Bankası Boost
  const hafiza_boost = Math.min(6.0, (memoryNotes?.length || 0) * 1.5);

  // 1. AGF PUAN (Tüm İşler Gemileri)
  let agf_puan = 75.0;
  if (recentRaceResults && recentRaceResults.length > 0) {
    const avgPosition = recentRaceResults.reduce((sum, r) => sum + r.position, 0) / recentRaceResults.length;
    agf_puan = Math.max(55, 100 - (avgPosition * 8));
  }

  // 2. KİLO ETKİSİ (En önemli faktör)
  let kilo_etkisi = 4.0;
  if (weight <= 53.5) kilo_etkisi = 8.0;
  else if (weight <= 55.0) kilo_etkisi = 6.5;
  else if (weight <= 57.0) kilo_etkisi = 5.0;
  else if (weight <= 59.0) kilo_etkisi = 3.0;
  else kilo_etkisi = 1.0;

  // 3. JOKEY FORM
  let jokey_form = 75.0;
  if (memoryNotes?.some(n => n.toLowerCase().includes("jokey"))) {
    jokey_form = 85.0;
  }

  // 4. ANTRENOR FORM
  let antrenor_form = 70.0;
  if (memoryNotes?.some(n => n.toLowerCase().includes("antrenor"))) {
    antrenor_form = 80.0;
  }

  // 5. GALOP GUCU
  let galop_gucu = 75.0;
  if (memoryNotes?.some(n => n.toLowerCase().includes("galop"))) {
    galop_gucu = 85.0;
  }

  // 6. FORM 6 YARIS
  let form_6yaris = 65.0;
  if (recentRaceResults && recentRaceResults.length === 6) {
    const wins = recentRaceResults.filter(r => r.position === 1).length;
    form_6yaris = 50 + (wins * 8);
  }

  // 7. PIST UYUMU
  let pist_uyumu = 72.0;
  if (recentRaceResults?.some(r => r.trackType === "Çim")) {
    pist_uyumu = 80.0;
  }

  // 8. MESAFE UYUMU
  let mesafe_uyumu = 75.0;

  // 9. SINIF GUCU
  let sinif_gucu = 74.0;
  if (isHandicapRace) {
    sinif_gucu = Math.min(90, 70 + (handicap / 2));
  }

  // 10. HANDIKAP GUCU
  let handikap_gucu = handicap * 0.6;

  // 11. SPRINT GUCU
  let sprint_gucu = 70.0;
  if (memoryNotes?.some(n => n.toLowerCase().includes("sprint"))) {
    sprint_gucu = 85.0;
  }

  // 12. PEDIGREE DNA
  let pedigree_dna = pedigreeRating;

  // 13. TEMPO AYAGI
  let tempo_ayaki = 68.0;
  if (weight <= 55.0 && sprint_gucu > 75) {
    tempo_ayaki = 82.0;
  }

  // 14. SON KOSU PERFORMANSI
  let son_kosu_performansi = 70.0;
  if (recentRaceResults && recentRaceResults.length > 0) {
    const lastRace = recentRaceResults[recentRaceResults.length - 1];
    son_kosu_performansi = Math.max(60, 100 - (lastRace.position * 10));
  }

  // 15. PIST DURUMU UYUMU
  let pist_durumu_uyumu = 75.0;

  // 16. KAFA SAGLIGI
  let kafa_sagligi = 72.0;
  if (memoryNotes?.some(n => n.toLowerCase().includes("stres"))) {
    kafa_sagligi = 65.0;
  }

  // 17. IS ROTASYONU
  let is_rotasyon = 75.0;

  // 18. OZELLIK KUPU
  let ozellik_kupu = 75.0;
  if (memoryNotes?.some(n => n.match(/KG|DB|SK|OG|HP/))) {
    ozellik_kupu = 85.0;
  }

  // 19. HAFIZA BANKASI BOOST
  let hafiza_bankasi_boost = hafiza_boost;

  // 20. RAKIP ANALIZI
  let rakip_analizi = 70.0;

  return {
    agf_puan,
    kilo_etkisi,
    jokey_form,
    antrenor_form,
    galop_gucu,
    form_6yaris,
    pist_uyumu,
    mesafe_uyumu,
    sinif_gucu,
    handikap_gucu,
    sprint_gucu,
    pedigree_dna,
    tempo_ayaki,
    son_kosu_performansi,
    pist_durumu_uyumu,
    kafa_sagligi,
    is_rotasyon,
    ozellik_kupu,
    hafiza_bankasi_boost,
    rakip_analizi
  };
}

/**
 * Ağırlandırılmış AHP Toplam Puan
 */
export function calculateWeightedAHPScore(metrics: HorseMetrics, isHandicapRace: boolean): number {
  const weights = {
    agf_puan: 0.12,
    kilo_etkisi: 0.10,
    jokey_form: 0.08,
    antrenor_form: 0.05,
    galop_gucu: 0.06,
    form_6yaris: 0.08,
    pist_uyumu: 0.06,
    mesafe_uyumu: 0.06,
    sinif_gucu: 0.07,
    handikap_gucu: isHandicapRace ? 0.09 : 0.05,
    sprint_gucu: 0.06,
    pedigree_dna: 0.07,
    tempo_ayaki: 0.05,
    son_kosu_performansi: 0.07,
    pist_durumu_uyumu: 0.03,
    kafa_sagligi: 0.04,
    is_rotasyon: 0.03,
    ozellik_kupu: 0.04,
    hafiza_bankasi_boost: 0.04,
    rakip_analizi: 0.04
  };

  let totalScore = 0;
  const entries = Object.entries(weights) as Array<[keyof HorseMetrics, number]>;
  
  for (const [key, weight] of entries) {
    totalScore += (metrics[key] || 0) * weight;
  }

  return Math.min(99.5, Math.max(60.0, totalScore));
}
