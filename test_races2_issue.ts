import fetch from 'node-fetch';

async function testCurrentRacesIssue() {
  // Suppose UI currently has 2. Altılı races loaded in state (races 4 to 9 or 5 to 10)
  // because user previously viewed 2. Altılı or default was 2. Altılı
  const races2 = [
    { raceNo: 5, title: '5. Koşu', horses: [{ num: '1', name: 'AT A' }, { num: '2', name: 'AT B' }] },
    { raceNo: 6, title: '6. Koşu', horses: [{ num: '1', name: 'AT C' }, { num: '2', name: 'AT D' }] },
    { raceNo: 7, title: '7. Koşu', horses: [{ num: '1', name: 'AT E' }, { num: '2', name: 'AT F' }] },
    { raceNo: 8, title: '8. Koşu', horses: [{ num: '1', name: 'AT G' }, { num: '2', name: 'AT H' }] },
    { raceNo: 9, title: '9. Koşu', horses: [{ num: '1', name: 'AT I' }, { num: '2', name: 'AT J' }] },
    { raceNo: 10, title: '10. Koşu', horses: [{ num: '1', name: 'AT K' }, { num: '2', name: 'AT L' }] },
  ];

  const res = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "birinci altılıyı 80 tl yap",
      hipodrom: "İSTANBUL",
      date: "2026-09-17",
      programType: "1. Altılı Ganyan",
      currentRaces: races2,
      unitPrice: 1.25,
      targetBudget: 80
    })
  });
  const data = await res.json() as any;
  console.log('Result for "birinci altılıyı 80 tl yap" when currentRaces has races 5-10:');
  const lines = (data.reply || '').split('\n').filter((l: string) => l.includes('.koşu '));
  console.log('Lines in ticket:', lines.join(' | '));
  console.log('Header:', (data.reply || '').split('\n')[0]);
}

testCurrentRacesIssue();
