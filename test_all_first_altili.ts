import fetch from 'node-fetch';

async function testAllTracks() {
  const tracks = ['BURSA', 'İZMİR', 'ANKARA', 'İSTANBUL', 'ADANA', 'ANTALYA', 'KOCAELİ', 'ŞANLIURFA', 'DİYARBAKIR', 'ELAZIĞ'];
  for (const t of tracks) {
    try {
      const res = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${t} birinci altılıyı 80 tl yap`,
          hipodrom: t,
          date: '2026-09-17',
          programType: '1. Altılı Ganyan',
          unitPrice: 1.25,
          targetBudget: 80
        })
      });
      const data = await res.json() as any;
      const firstLine = (data.reply || '').split('\n').filter((l: string) => l.trim().length > 0)[0] || '';
      const hasKoşu1 = (data.reply || '').includes('1.koşu') || (data.reply || '').includes('1. Koşu');
      const hasKoşu2 = (data.reply || '').includes('2.koşu') || (data.reply || '').includes('2. Koşu');
      const isAltili2 = (data.reply || '').includes('2. Altılı') || (data.reply || '').includes('2. ALTILI');
      const isMissing = (data.reply || '').includes('BÜLTEN VERİSİ EKSİK');
      console.log(`[${t}] ok:${data.success} missing:${isMissing} altili2:${isAltili2} hasKoşu1:${hasKoşu1} hasKoşu2:${hasKoşu2}`);
      console.log(`   Header: ${firstLine.substring(0, 100)}`);
      // Find what races are in the ticket list at the bottom:
      const lines = (data.reply || '').split('\n').filter((l: string) => l.includes('.koşu '));
      console.log(`   Ticket lines:`, lines.join(' | '));
    } catch (e: any) {
      console.log(`[${t}] ERROR:`, e.message);
    }
  }
}

testAllTracks();
